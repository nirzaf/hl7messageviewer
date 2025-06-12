-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create HL7 messages table
CREATE TABLE IF NOT EXISTS hl7_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  raw_message TEXT NOT NULL,
  parsed_message JSONB NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Add user_id column
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_hl7_messages_message_type ON hl7_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_created_at ON hl7_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_name ON hl7_messages(name);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_user_id ON hl7_messages(user_id); -- Index for user_id

-- Enable RLS
ALTER TABLE hl7_messages ENABLE ROW LEVEL SECURITY;

-- Remove existing anonymous policies as they are too permissive
DROP POLICY IF EXISTS "Allow anonymous read access" ON hl7_messages;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON hl7_messages;
DROP POLICY IF EXISTS "Allow anonymous update access" ON hl7_messages;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON hl7_messages;

-- RLS Policies for user-specific access
-- Ensure policies are dropped before creating to avoid errors on re-runs for idempotency
DROP POLICY IF EXISTS "Allow individual select access" ON hl7_messages;
CREATE POLICY "Allow individual select access" ON hl7_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual insert access" ON hl7_messages;
CREATE POLICY "Allow individual insert access" ON hl7_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual update access" ON hl7_messages;
CREATE POLICY "Allow individual update access" ON hl7_messages
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual delete access" ON hl7_messages;
CREATE POLICY "Allow individual delete access" ON hl7_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_hl7_messages_updated_at ON hl7_messages;
CREATE TRIGGER update_hl7_messages_updated_at
BEFORE UPDATE ON hl7_messages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Remove generic test data insertion as data should be user-specific now
-- Ensure this only deletes the old generic test message if it exists and is not tied to a user
DELETE FROM hl7_messages WHERE user_id IS NULL AND name = 'Test Message';

-- Output confirmation
SELECT 
  'HL7 messages table updated/created successfully with user-specific RLS policies.' AS result,
  (SELECT COUNT(*) FROM hl7_messages) AS total_records_overall, -- Shows count of all messages, RLS might restrict viewing for specific users here
  'RLS is enabled. Users can only access their own messages.' AS security_note,
  (SELECT string_agg(polname, ', ') FROM pg_policies WHERE tablename = 'hl7_messages') AS policies_applied
FROM pg_tables WHERE tablename = 'hl7_messages'; -- Check table existence for primary output row
