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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_hl7_messages_message_type ON hl7_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_created_at ON hl7_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_name ON hl7_messages(name);

-- Disable RLS for now (can be enabled later with proper authentication)
ALTER TABLE hl7_messages DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, uncomment the following lines
-- and comment out the DISABLE ROW LEVEL SECURITY line above

-- ALTER TABLE hl7_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
-- WARNING: These policies allow anyone to read/write data
-- In production, you should implement proper authentication and user-specific policies

-- DROP POLICY IF EXISTS "Allow anonymous read access" ON hl7_messages;
-- CREATE POLICY "Allow anonymous read access" ON hl7_messages
--   FOR SELECT USING (true);

-- DROP POLICY IF EXISTS "Allow anonymous insert access" ON hl7_messages;
-- CREATE POLICY "Allow anonymous insert access" ON hl7_messages
--   FOR INSERT WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow anonymous update access" ON hl7_messages;
-- CREATE POLICY "Allow anonymous update access" ON hl7_messages
--   FOR UPDATE USING (true);

-- DROP POLICY IF EXISTS "Allow anonymous delete access" ON hl7_messages;
-- CREATE POLICY "Allow anonymous delete access" ON hl7_messages
--   FOR DELETE USING (true);

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

-- Clean up any existing test records and insert a new one
DELETE FROM hl7_messages WHERE name = 'Test Message';

-- Insert a test record to verify the table works
INSERT INTO hl7_messages (name, description, raw_message, parsed_message, message_type, version)
VALUES (
  'Test Message',
  'This is a test message to verify the table setup',
  'MSH|^~\&|TEST|TEST|TEST|TEST|20231201120000||ADT^A01|123|P|2.5|',
  '{"messageType": "ADT^A01", "version": "2.5", "segments": []}',
  'ADT^A01',
  '2.5'
);

-- Output confirmation
SELECT 
  'HL7 messages table created successfully' AS result,
  COUNT(*) AS total_records,
  'RLS is disabled for demo purposes' AS security_note
FROM hl7_messages;
