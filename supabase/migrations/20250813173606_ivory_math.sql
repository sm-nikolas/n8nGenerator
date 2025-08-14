/*
  # Sistema de Workflows N8N

  1. Novas Tabelas
    - `workflows`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `nodes` (jsonb) - Armazena os nós do workflow
      - `connections` (jsonb) - Armazena as conexões entre nós
      - `user_id` (uuid, foreign key)
      - `is_public` (boolean) - Se o workflow é público
      - `tags` (text[]) - Tags para categorização
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`
      - `id` (uuid, primary key)
      - `content` (text)
      - `type` (enum: user, assistant)
      - `workflow_id` (uuid, foreign key, nullable)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `workflow_executions`
      - `id` (uuid, primary key)
      - `workflow_id` (uuid, foreign key)
      - `status` (enum: running, completed, failed)
      - `started_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `execution_data` (jsonb, nullable)
      - `user_id` (uuid, foreign key)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas seus próprios dados
    - Política especial para workflows públicos
*/

-- Criar enum para tipo de mensagem
CREATE TYPE message_type AS ENUM ('user', 'assistant');

-- Criar enum para status de execução
CREATE TYPE execution_status AS ENUM ('running', 'completed', 'failed');

-- Tabela de workflows
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  tags text[] DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  type message_type NOT NULL,
  workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de execuções de workflow
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  status execution_status NOT NULL DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  execution_data jsonb DEFAULT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Habilitar RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Políticas para workflows
CREATE POLICY "Users can read own workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read public workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para workflow_executions
CREATE POLICY "Users can read own executions"
  ON workflow_executions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions"
  ON workflow_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions"
  ON workflow_executions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS workflows_user_id_idx ON workflows(user_id);
CREATE INDEX IF NOT EXISTS workflows_created_at_idx ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS workflows_is_public_idx ON workflows(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_workflow_id_idx ON messages(workflow_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_executions_user_id_idx ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS workflow_executions_workflow_id_idx ON workflow_executions(workflow_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at em workflows
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();