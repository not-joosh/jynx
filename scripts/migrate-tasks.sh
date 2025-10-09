#!/bin/bash

# Database Migration Script for Tasks Table
# This script creates the tasks table and related indexes

echo "🚀 Starting database migration for tasks table..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your Supabase credentials."
    exit 1
fi

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   SUPABASE_URL: ${SUPABASE_URL:+✅ Set}"
    echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+✅ Set}"
    exit 1
fi

echo "✅ Environment variables loaded"

# Create the tasks table migration
echo "📝 Creating tasks table migration..."

cat > migration_tasks.sql << 'EOF'
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Add constraints for valid status and priority values
ALTER TABLE tasks ADD CONSTRAINT check_task_status 
  CHECK (status IN ('draft', 'todo', 'in_progress', 'review', 'done', 'archived'));

ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
  CHECK (priority IN ('critical', 'high', 'medium', 'low'));

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view tasks from their organization
CREATE POLICY "Users can view tasks from their organization" ON tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create tasks in their organization
CREATE POLICY "Users can create tasks in their organization" ON tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update tasks they created or are assigned to (if they have member+ role)
CREATE POLICY "Users can update tasks they created or are assigned to" ON tasks
  FOR UPDATE USING (
    creator_id = auth.uid() OR 
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id 
      AND om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can delete tasks
CREATE POLICY "Only owners and admins can delete tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tasks.organization_id 
      AND om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
EOF

echo "✅ Migration SQL created"

# Execute the migration using Supabase CLI or psql
if command -v supabase &> /dev/null; then
    echo "🔧 Using Supabase CLI to execute migration..."
    supabase db reset --linked
    echo "✅ Migration executed via Supabase CLI"
elif command -v psql &> /dev/null; then
    echo "🔧 Using psql to execute migration..."
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h "$(echo $SUPABASE_URL | sed 's/.*\/\/\([^:]*\).*/\1/')" -U postgres -d postgres -f migration_tasks.sql
    echo "✅ Migration executed via psql"
else
    echo "⚠️  Neither Supabase CLI nor psql found."
    echo "📋 Please execute the migration_tasks.sql file manually in your Supabase dashboard:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the contents of migration_tasks.sql"
    echo "   4. Execute the SQL"
fi

echo "🎉 Database migration completed!"
echo "📊 Tasks table is now ready for use."
