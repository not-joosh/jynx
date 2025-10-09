-- ============================================================================
-- ORGANIZATION INVITATIONS & WORKSPACE MANAGEMENT - DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGANIZATION INVITATIONS TABLE
-- ============================================================================

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  personal_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- UPDATE ORGANIZATION MEMBERS TABLE
-- ============================================================================

-- Add invitation tracking columns to existing organization_members table
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES organization_invitations(id),
ADD COLUMN IF NOT EXISTS joined_via VARCHAR(50) DEFAULT 'direct' CHECK (joined_via IN ('direct', 'invitation', 'owner'));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization invitations indexes
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_invited_by ON organization_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_org_invitations_expires_at ON organization_invitations(expires_at);

-- Organization members indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on organization_invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organization owners and admins can read invitations for their organization
CREATE POLICY "Organization members can read invitations" ON organization_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_invitations.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Organization owners and admins can create invitations
CREATE POLICY "Organization admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_invitations.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Organization owners and admins can update invitations
CREATE POLICY "Organization admins can update invitations" ON organization_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_invitations.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Organization owners and admins can delete invitations
CREATE POLICY "Organization admins can delete invitations" ON organization_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_invitations.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Anyone can read invitation by token (for invitation acceptance)
CREATE POLICY "Anyone can read invitation by token" ON organization_invitations
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on organization_invitations
CREATE TRIGGER update_organization_invitations_updated_at
  BEFORE UPDATE ON organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's workspaces (organizations they belong to)
CREATE OR REPLACE FUNCTION get_user_workspaces(user_uuid UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name VARCHAR(255),
  organization_description TEXT,
  user_role VARCHAR(50),
  member_count BIGINT,
  joined_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.description as organization_description,
    om.role as user_role,
    COUNT(om2.user_id) as member_count,
    om.joined_at,
    (u.current_organization_id = o.id) as is_current
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  LEFT JOIN organization_members om2 ON o.id = om2.organization_id
  LEFT JOIN users u ON u.id = user_uuid
  WHERE om.user_id = user_uuid
  GROUP BY o.id, o.name, o.description, om.role, om.joined_at, u.current_organization_id
  ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization invitation stats
CREATE OR REPLACE FUNCTION get_organization_invitation_stats(org_uuid UUID)
RETURNS TABLE (
  total_invitations BIGINT,
  pending_invitations BIGINT,
  accepted_invitations BIGINT,
  declined_invitations BIGINT,
  expired_invitations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_invitations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_invitations,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invitations,
    COUNT(*) FILTER (WHERE status = 'declined') as declined_invitations,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_invitations
  FROM organization_invitations
  WHERE organization_id = org_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Uncomment the following lines to create sample data for testing
/*
-- Create a sample invitation (replace with actual UUIDs)
INSERT INTO organization_invitations (
  organization_id,
  invited_by,
  invited_email,
  role,
  token,
  personal_message
) VALUES (
  'your-organization-uuid-here',
  'your-user-uuid-here',
  'test@example.com',
  'member',
  generate_invitation_token(),
  'Welcome to our team! We are excited to have you join us.'
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('organization_invitations', 'organization_members')
ORDER BY table_name, ordinal_position;

-- Check if indexes were created
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('organization_invitations', 'organization_members')
ORDER BY tablename, indexname;

-- Check if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'organization_invitations';
