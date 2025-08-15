/*
  # Atualizar estrutura de workflows para formato n8n

  1. Alterações na tabela workflows
    - Manter campos `nodes` e `connections` como JSONB (já existem)
    - Adicionar validação para garantir estrutura correta
    - Atualizar comentários para refletir novo formato

  2. Funcionalidades
    - Validação de estrutura n8n
    - Índices para melhor performance
    - Triggers para validação automática

  3. Compatibilidade
    - Manter compatibilidade com dados existentes
    - Migração suave sem perda de dados
*/

-- Adicionar comentários atualizados para documentar o novo formato
COMMENT ON COLUMN workflows.nodes IS 'Array de nós do workflow no formato n8n com id, name, type, typeVersion, position e parameters';
COMMENT ON COLUMN workflows.connections IS 'Objeto de conexões do workflow no formato n8n com estrutura {nodeName: {main: [[{node, type, index}]]}}';

-- Função para validar estrutura de nó n8n
CREATE OR REPLACE FUNCTION validate_n8n_node(node_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar campos obrigatórios do nó
  IF NOT (
    node_data ? 'id' AND
    node_data ? 'name' AND
    node_data ? 'type' AND
    node_data ? 'position' AND
    node_data ? 'parameters'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se position é um array com 2 elementos
  IF NOT (
    jsonb_typeof(node_data->'position') = 'array' AND
    jsonb_array_length(node_data->'position') = 2
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se parameters é um objeto
  IF jsonb_typeof(node_data->'parameters') != 'object' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para validar estrutura de conexões n8n
CREATE OR REPLACE FUNCTION validate_n8n_connections(connections_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  node_name TEXT;
  connection_data JSONB;
  main_connections JSONB;
  connection_item JSONB;
BEGIN
  -- Se connections estiver vazio, é válido
  IF connections_data = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Iterar sobre cada nó nas conexões
  FOR node_name IN SELECT jsonb_object_keys(connections_data)
  LOOP
    connection_data := connections_data->node_name;
    
    -- Verificar se tem estrutura 'main'
    IF NOT (connection_data ? 'main') THEN
      RETURN FALSE;
    END IF;
    
    main_connections := connection_data->'main';
    
    -- Verificar se main é um array
    IF jsonb_typeof(main_connections) != 'array' THEN
      RETURN FALSE;
    END IF;
    
    -- Verificar cada conexão
    FOR connection_item IN SELECT jsonb_array_elements(main_connections)
    LOOP
      -- Cada item deve ser um array
      IF jsonb_typeof(connection_item) != 'array' THEN
        RETURN FALSE;
      END IF;
      
      -- Verificar estrutura de cada conexão individual
      DECLARE
        individual_connection JSONB;
      BEGIN
        FOR individual_connection IN SELECT jsonb_array_elements(connection_item)
        LOOP
          IF NOT (
            individual_connection ? 'node' AND
            individual_connection ? 'type' AND
            individual_connection ? 'index'
          ) THEN
            RETURN FALSE;
          END IF;
        END LOOP;
      END;
    END LOOP;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função de trigger para validar workflows antes de inserir/atualizar
CREATE OR REPLACE FUNCTION validate_workflow_structure()
RETURNS TRIGGER AS $$
DECLARE
  node_item JSONB;
BEGIN
  -- Validar que nodes é um array
  IF jsonb_typeof(NEW.nodes) != 'array' THEN
    RAISE EXCEPTION 'Campo nodes deve ser um array';
  END IF;
  
  -- Validar que connections é um objeto
  IF jsonb_typeof(NEW.connections) != 'object' THEN
    RAISE EXCEPTION 'Campo connections deve ser um objeto';
  END IF;
  
  -- Validar cada nó
  FOR node_item IN SELECT jsonb_array_elements(NEW.nodes)
  LOOP
    IF NOT validate_n8n_node(node_item) THEN
      RAISE EXCEPTION 'Estrutura de nó inválida: %', node_item;
    END IF;
  END LOOP;
  
  -- Validar conexões
  IF NOT validate_n8n_connections(NEW.connections) THEN
    RAISE EXCEPTION 'Estrutura de conexões inválida: %', NEW.connections;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação automática
DROP TRIGGER IF EXISTS validate_workflow_trigger ON workflows;
CREATE TRIGGER validate_workflow_trigger
  BEFORE INSERT OR UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION validate_workflow_structure();

-- Adicionar índices para melhor performance em consultas de nós e conexões
CREATE INDEX IF NOT EXISTS workflows_nodes_gin_idx ON workflows USING GIN (nodes);
CREATE INDEX IF NOT EXISTS workflows_connections_gin_idx ON workflows USING GIN (connections);

-- Índice para buscar workflows por tipo de nó
CREATE INDEX IF NOT EXISTS workflows_node_types_idx ON workflows USING GIN ((
  SELECT jsonb_agg(node->>'type')
  FROM jsonb_array_elements(nodes) AS node
));

-- Função helper para extrair tipos de nós de um workflow
CREATE OR REPLACE FUNCTION get_workflow_node_types(workflow_nodes JSONB)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT node->>'type'
    FROM jsonb_array_elements(workflow_nodes) AS node
  );
END;
$$ LANGUAGE plpgsql;

-- Função helper para contar nós de um workflow
CREATE OR REPLACE FUNCTION count_workflow_nodes(workflow_nodes JSONB)
RETURNS INTEGER AS $$
BEGIN
  RETURN jsonb_array_length(workflow_nodes);
END;
$$ LANGUAGE plpgsql;

-- Função helper para contar conexões de um workflow
CREATE OR REPLACE FUNCTION count_workflow_connections(workflow_connections JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_connections INTEGER := 0;
  node_name TEXT;
  main_connections JSONB;
  connection_group JSONB;
BEGIN
  FOR node_name IN SELECT jsonb_object_keys(workflow_connections)
  LOOP
    main_connections := workflow_connections->node_name->'main';
    
    FOR connection_group IN SELECT jsonb_array_elements(main_connections)
    LOOP
      total_connections := total_connections + jsonb_array_length(connection_group);
    END LOOP;
  END LOOP;
  
  RETURN total_connections;
END;
$$ LANGUAGE plpgsql;

-- View para estatísticas de workflows
CREATE OR REPLACE VIEW workflow_stats AS
SELECT 
  id,
  name,
  description,
  user_id,
  created_at,
  updated_at,
  count_workflow_nodes(nodes) as node_count,
  count_workflow_connections(connections) as connection_count,
  get_workflow_node_types(nodes) as node_types,
  CASE 
    WHEN count_workflow_connections(connections) > count_workflow_nodes(nodes) THEN 'complex'
    WHEN count_workflow_nodes(nodes) > 5 THEN 'medium'
    ELSE 'simple'
  END as complexity_level
FROM workflows;

-- Comentário na view
COMMENT ON VIEW workflow_stats IS 'View com estatísticas calculadas dos workflows incluindo contagem de nós, conexões e nível de complexidade';