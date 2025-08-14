/*
  # Melhorias no Sistema de Chat e Histórico

  1. Novas Tabelas
    - `conversations`
      - `id` (uuid, primary key)
      - `title` (text) - Título da conversa
      - `user_id` (uuid, foreign key)
      - `workflow_id` (uuid, foreign key, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_message_at` (timestamp)

  2. Modificações na tabela messages
    - Adicionar `conversation_id` (uuid, foreign key)
    - Adicionar `message_order` (integer) - Para ordenação das mensagens
    - Adicionar `metadata` (jsonb) - Para dados extras como tokens, tempo de resposta, etc.

  3. Segurança
    - Habilitar RLS na nova tabela
    - Políticas para usuários acessarem apenas suas conversas
    - Atualizar políticas de mensagens para incluir conversas

  4. Índices
    - Índices para performance em consultas de conversas
    - Índices compostos para mensagens por conversa
*/

-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

-- Adicionar colunas à tabela messages se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_order'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_order integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Habilitar RLS na tabela conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can read own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Atualizar políticas de messages para incluir conversas
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id AND user_id = auth.uid()
    ))
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_workflow_id_idx ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_conversation_order_idx ON messages(conversation_id, message_order);

-- Trigger para atualizar updated_at e last_message_at em conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamps da conversa quando uma mensagem é inserida/atualizada
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE conversations 
    SET 
      updated_at = now(),
      last_message_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para messages
CREATE TRIGGER update_conversation_on_message_change
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION update_conversation_timestamps();

-- Trigger para conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar uma nova conversa automaticamente
CREATE OR REPLACE FUNCTION create_conversation_for_message()
RETURNS TRIGGER AS $$
DECLARE
  new_conversation_id uuid;
  conversation_title text;
BEGIN
  -- Se não há conversation_id e não há workflow_id, criar nova conversa
  IF NEW.conversation_id IS NULL AND NEW.workflow_id IS NULL THEN
    -- Gerar título baseado no conteúdo da mensagem
    conversation_title := CASE 
      WHEN length(NEW.content) > 50 THEN left(NEW.content, 47) || '...'
      ELSE NEW.content
    END;
    
    -- Criar nova conversa
    INSERT INTO conversations (title, user_id, workflow_id)
    VALUES (conversation_title, NEW.user_id, NEW.workflow_id)
    RETURNING id INTO new_conversation_id;
    
    -- Atualizar a mensagem com o conversation_id
    NEW.conversation_id := new_conversation_id;
  END IF;
  
  -- Se há workflow_id mas não há conversation_id, buscar conversa existente ou criar nova
  IF NEW.conversation_id IS NULL AND NEW.workflow_id IS NOT NULL THEN
    -- Tentar encontrar conversa existente para este workflow
    SELECT id INTO new_conversation_id
    FROM conversations 
    WHERE workflow_id = NEW.workflow_id AND user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Se não encontrou, criar nova conversa
    IF new_conversation_id IS NULL THEN
      SELECT name INTO conversation_title
      FROM workflows 
      WHERE id = NEW.workflow_id;
      
      INSERT INTO conversations (title, user_id, workflow_id)
      VALUES (COALESCE(conversation_title, 'Workflow Chat'), NEW.user_id, NEW.workflow_id)
      RETURNING id INTO new_conversation_id;
    END IF;
    
    NEW.conversation_id := new_conversation_id;
  END IF;
  
  -- Definir message_order se não foi definido
  IF NEW.message_order = 0 THEN
    SELECT COALESCE(MAX(message_order), 0) + 1 
    INTO NEW.message_order
    FROM messages 
    WHERE conversation_id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar conversa automaticamente
CREATE TRIGGER auto_create_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_for_message();