@echo off
REM Database Migration Script for Tasks Table (Windows)
REM This script creates the tasks table and related indexes

echo 🚀 Starting database migration for tasks table...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create one with your Supabase credentials.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Create the tasks table migration
echo 📝 Creating tasks table migration...

(
echo -- Create tasks table
echo CREATE TABLE IF NOT EXISTS tasks ^(
echo   id UUID PRIMARY KEY DEFAULT gen_random_uuid^(^),
echo   title VARCHAR^(255^) NOT NULL,
echo   description TEXT,
echo   status VARCHAR^(50^) NOT NULL DEFAULT 'todo',
echo   priority VARCHAR^(50^) NOT NULL DEFAULT 'medium',
echo   organization_id UUID NOT NULL REFERENCES organizations^(id^) ON DELETE CASCADE,
echo   assignee_id UUID REFERENCES users^(id^) ON DELETE SET NULL,
echo   creator_id UUID NOT NULL REFERENCES users^(id^) ON DELETE CASCADE,
echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo   completed_at TIMESTAMP WITH TIME ZONE
echo ^);
echo.
echo -- Create indexes for better performance
echo CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks^(organization_id^);
echo CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks^(assignee_id^);
echo CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks^(creator_id^);
echo CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks^(status^);
echo CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks^(priority^);
echo CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks^(created_at^);
echo.
echo -- Add constraints for valid status and priority values
echo ALTER TABLE tasks ADD CONSTRAINT check_task_status 
echo   CHECK ^(status IN ^('draft', 'todo', 'in_progress', 'review', 'done', 'archived'^)^);
echo.
echo ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
echo   CHECK ^(priority IN ^('critical', 'high', 'medium', 'low'^)^);
echo.
echo -- Enable Row Level Security
echo ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
echo.
echo -- Create RLS policies
echo -- Users can view tasks from their organization
echo CREATE POLICY "Users can view tasks from their organization" ON tasks
echo   FOR SELECT USING ^(
echo     organization_id IN ^(
echo       SELECT organization_id 
echo       FROM organization_members 
echo       WHERE user_id = auth.uid^(^)
echo     ^)
echo   ^);
echo.
echo -- Users can create tasks in their organization
echo CREATE POLICY "Users can create tasks in their organization" ON tasks
echo   FOR INSERT WITH CHECK ^(
echo     organization_id IN ^(
echo       SELECT organization_id 
echo       FROM organization_members 
echo       WHERE user_id = auth.uid^(^)
echo     ^)
echo   ^);
echo.
echo -- Users can update tasks they created or are assigned to
echo CREATE POLICY "Users can update tasks they created or are assigned to" ON tasks
echo   FOR UPDATE USING ^(
echo     creator_id = auth.uid^(^) OR 
echo     assignee_id = auth.uid^(^) OR
echo     EXISTS ^(
echo       SELECT 1 FROM organization_members om
echo       WHERE om.organization_id = tasks.organization_id 
echo       AND om.user_id = auth.uid^(^) 
echo       AND om.role IN ^('owner', 'admin'^)
echo     ^)
echo   ^);
echo.
echo -- Only owners and admins can delete tasks
echo CREATE POLICY "Only owners and admins can delete tasks" ON tasks
echo   FOR DELETE USING ^(
echo     EXISTS ^(
echo       SELECT 1 FROM organization_members om
echo       WHERE om.organization_id = tasks.organization_id 
echo       AND om.user_id = auth.uid^(^) 
echo       AND om.role IN ^('owner', 'admin'^)
echo     ^)
echo   ^);
echo.
echo -- Create function to automatically update updated_at timestamp
echo CREATE OR REPLACE FUNCTION update_updated_at_column^(^)
echo RETURNS TRIGGER AS $$^
echo BEGIN
echo   NEW.updated_at = NOW^(^);
echo   RETURN NEW;
echo END;
echo $$ language 'plpgsql';
echo.
echo -- Create trigger to automatically update updated_at
echo CREATE TRIGGER update_tasks_updated_at 
echo   BEFORE UPDATE ON tasks 
echo   FOR EACH ROW 
echo   EXECUTE FUNCTION update_updated_at_column^(^);
) > migration_tasks.sql

echo ✅ Migration SQL created

echo ⚠️  Please execute the migration manually:
echo    1. Go to your Supabase project dashboard
echo    2. Navigate to SQL Editor
echo    3. Copy and paste the contents of migration_tasks.sql
echo    4. Execute the SQL

echo 🎉 Migration script completed!
echo 📊 Tasks table SQL is ready for execution.
pause
