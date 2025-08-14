/*
  # Fix Chat Schema - Create missing tables and columns

  This migration creates the missing database structure for the chat system:

  1. New Tables
    - `conversations` table with all required columns
    - Proper indexes for performance
    
  2. Table Updates  
    - Add missing columns to `messages` table
    - Update foreign key relationships
    
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  4. Functions and Triggers
    - Auto-update timestamps
    - Auto-create conversations for messages
    - Update conversation timestamps when messages change

  Run this migration in your Supabase SQL Editor to fix the schema errors.
*/

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid NOT NULL,
  workflow_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

-- Add missing columns to messages table if they don't exist
DO $$
BEGIN
  -- Add conversation_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN conversation_id uuid;
  END IF;

  -- Add message_order column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_order'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_order integer DEFAULT 0;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes for conversations table
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_workflow_id_idx ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);

-- Create indexes for messages table
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_conversation_order_idx ON messages(conversation_id, message_order);

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY IF NOT EXISTS "Users can read own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update messages RLS policies to include conversation access
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    ))
  );

-- Add foreign key constraints
DO $$
BEGIN
  -- Add foreign key for conversation_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversations updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-create conversation for messages
CREATE OR REPLACE FUNCTION create_conversation_for_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_id uuid;
  conv_title text;
BEGIN
  -- Only create conversation if message doesn't have one and it's a user message
  IF NEW.conversation_id IS NULL AND NEW.type = 'user' THEN
    -- Generate title from first 50 characters of content
    conv_title := CASE 
      WHEN length(NEW.content) > 50 
      THEN substring(NEW.content from 1 for 50) || '...'
      ELSE NEW.content
    END;
    
    -- Create new conversation
    INSERT INTO conversations (title, user_id, workflow_id, created_at, updated_at, last_message_at)
    VALUES (conv_title, NEW.user_id, NEW.workflow_id, now(), now(), now())
    RETURNING id INTO conv_id;
    
    -- Set conversation_id for the message
    NEW.conversation_id := conv_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create conversations
DROP TRIGGER IF EXISTS auto_create_conversation ON messages;
CREATE TRIGGER auto_create_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_for_message();

-- Create function to update conversation timestamps when messages change
CREATE OR REPLACE FUNCTION update_conversation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation's last_message_at and updated_at
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations 
    SET 
      last_message_at = now(),
      updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update conversation timestamps
DROP TRIGGER IF EXISTS update_conversation_on_message_change ON messages;
CREATE TRIGGER update_conversation_on_message_change
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION update_conversation_timestamps();