import { Workflow } from '../types';

export const mockWorkflows: Workflow[] = [
  {
    id: 'qualificar-lead-workflow',
    name: 'Qualificação de Lead B2B SaaS',
    description: 'Workflow automatizado para qualificar leads empresariais usando múltiplas APIs e IA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'Webhook',
        name: 'Entrada Webhook',
        type: 'n8n-nodes-base.webhook',
        position: { x: 100, y: 300 },
        data: {
          path: 'qualificar-lead',
          method: 'POST',
          responseMode: 'onReceived'
        }
      },
      {
        id: 'Formatar CNPJ',
        name: 'Limpar CNPJ',
        type: 'n8n-nodes-base.function',
        position: { x: 300, y: 300 },
        data: {
          functionCode: '// Limpa e formata o CNPJ recebido'
        }
      },
      {
        id: 'ReceitaWS',
        name: 'ReceitaWS',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 100 },
        data: {
          url: 'https://www.receitaws.com.br/v1/cnpj={{$json.cnpj}}',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: 'Google Places',
        name: 'Google Places',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 200 },
        data: {
          url: 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={{$json.nome}}&inputtype=textquery&fields=name,rating,user_ratings_total,formatted_address&key=SUA_GOOGLE_API_KEY',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: 'CNPJ Aberto',
        name: 'CNPJ Aberto',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 300 },
        data: {
          url: 'https://publica.cnpj.ws/cnpj/{{ $json.cnpj }}',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: 'Brave Search',
        name: 'Buscar LinkedIn',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 400 },
        data: {
          url: 'https://api.search.brave.com/res/v1/web/search?q={{$json.nome}} site:linkedin.com&count=3',
          method: 'GET',
          headers: {
            'x-api-key': 'SUA_BRAVE_API_KEY'
          },
          responseFormat: 'json'
        }
      },
      {
        id: 'Criar Prompt DeepSeek',
        name: 'Criar Prompt DeepSeek',
        type: 'n8n-nodes-base.function',
        position: { x: 700, y: 300 },
        data: {
          functionCode: `const dados = {
  nome: $json.nome,
  cnpj: $json.cnpj,
  receita: $items("ReceitaWS")[0].json,
  google: $items("Google Places")[0].json,
  cnpjAberto: $items("CNPJ Aberto")[0].json,
  linkedin: $items("Buscar LinkedIn")[0].json
};

return [{
  json: {
    prompt: \`Avalie a empresa a seguir com base nos dados fornecidos. Determine um score de 0 a 100 sobre o quão qualificada ela parece para ser um lead de produto B2B SaaS.\\n\\n\${JSON.stringify(dados, null, 2)}\\n\\nResponda com um número e uma justificativa curta.\`
  }
}];`
        }
      },
      {
        id: 'DeepSeek',
        name: 'Classificar com DeepSeek',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 900, y: 300 },
        data: {
          url: 'https://api.deepseek.com/v1/chat/completions',
          method: 'POST',
          responseFormat: 'json',
          headers: {
            'Authorization': 'Bearer SUA_DEEPSEEK_API_KEY',
            'Content-Type': 'application/json'
          },
          bodyParametersJson: {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: '={{$json.prompt}}'
              }
            ],
            temperature: 0.3
          }
        }
      },
      {
        id: 'Extrair Score',
        name: 'Extrair Score',
        type: 'n8n-nodes-base.function',
        position: { x: 1100, y: 300 },
        data: {
          functionCode: `const texto = $json.choices?.[0]?.message?.content || "";
const match = texto.match(/(\\d{1,3})/);
const score = match ? parseInt(match[1]) : null;
return [{ json: { ...$json, score, motivo: texto } }];`
        }
      },
      {
        id: 'Retorno',
        name: 'Retornar Resultado',
        type: 'n8n-nodes-base.set',
        position: { x: 1300, y: 300 },
        data: {
          values: {
            json: {
              nome: '={{$json.nome}}',
              cnpj: '={{$json.cnpj}}',
              score: '={{$json.score}}',
              motivo: '={{$json.motivo}}'
            }
          }
        }
      }
    ],
    edges: [
      {
        id: 'webhook-to-format',
        source: 'Webhook',
        target: 'Formatar CNPJ'
      },
      {
        id: 'format-to-receita',
        source: 'Formatar CNPJ',
        target: 'ReceitaWS'
      },
      {
        id: 'format-to-google',
        source: 'Formatar CNPJ',
        target: 'Google Places'
      },
      {
        id: 'format-to-cnpj-aberto',
        source: 'Formatar CNPJ',
        target: 'CNPJ Aberto'
      },
      {
        id: 'format-to-linkedin',
        source: 'Formatar CNPJ',
        target: 'Buscar LinkedIn'
      },
      {
        id: 'receita-to-prompt',
        source: 'ReceitaWS',
        target: 'Criar Prompt DeepSeek'
      },
      {
        id: 'google-to-prompt',
        source: 'Google Places',
        target: 'Criar Prompt DeepSeek'
      },
      {
        id: 'cnpj-aberto-to-prompt',
        source: 'CNPJ Aberto',
        target: 'Criar Prompt DeepSeek'
      },
      {
        id: 'linkedin-to-prompt',
        source: 'Buscar LinkedIn',
        target: 'Criar Prompt DeepSeek'
      },
      {
        id: 'prompt-to-deepseek',
        source: 'Criar Prompt DeepSeek',
        target: 'Classificar com DeepSeek'
      },
      {
        id: 'deepseek-to-extract',
        source: 'Classificar com DeepSeek',
        target: 'Extrair Score'
      },
      {
        id: 'extract-to-return',
        source: 'Extrair Score',
        target: 'Retornar Resultado'
      }
    ]
  },
  {
    id: 'ecommerce-automation',
    name: 'Automação de E-commerce',
    description: 'Workflow para automatizar processos de vendas e estoque',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'webhook-ecommerce',
        name: 'Webhook de Pedido',
        type: 'n8n-nodes-base.webhook',
        position: { x: 100, y: 200 },
        data: {
          path: 'novo-pedido',
          method: 'POST'
        }
      },
      {
        id: 'validate-order',
        name: 'Validar Pedido',
        type: 'n8n-nodes-base.function',
        position: { x: 300, y: 200 },
        data: {
          functionCode: '// Valida dados do pedido'
        }
      },
      {
        id: 'check-stock',
        name: 'Verificar Estoque',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 200 },
        data: {
          url: 'https://api.estoque.com/check',
          method: 'POST'
        }
      },
      {
        id: 'send-notification',
        name: 'Enviar Notificação',
        type: 'n8n-nodes-base.set',
        position: { x: 700, y: 200 },
        data: {
          values: {
            json: {
              status: 'Pedido processado'
            }
          }
        }
      }
    ],
    edges: [
      {
        id: 'webhook-to-validate',
        source: 'webhook-ecommerce',
        target: 'validate-order'
      },
      {
        id: 'validate-to-stock',
        source: 'validate-order',
        target: 'check-stock'
      },
      {
        id: 'stock-to-notification',
        source: 'check-stock',
        target: 'send-notification'
      }
    ]
  },
  {
    id: 'social-media-monitor',
    name: 'Monitor de Redes Sociais',
    description: 'Monitoramento e análise de menções em redes sociais',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'twitter-webhook',
        name: 'Webhook Twitter',
        type: 'n8n-nodes-base.webhook',
        position: { x: 100, y: 150 },
        data: {
          path: 'twitter-mentions',
          method: 'POST'
        }
      },
      {
        id: 'sentiment-analysis',
        name: 'Análise de Sentimento',
        type: 'n8n-nodes-base.function',
        position: { x: 300, y: 150 },
        data: {
          functionCode: '// Analisa sentimento do tweet'
        }
      },
      {
        id: 'openai-analysis',
        name: 'Análise OpenAI',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 500, y: 150 },
        data: {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST'
        }
      },
      {
        id: 'store-result',
        name: 'Armazenar Resultado',
        type: 'n8n-nodes-base.set',
        position: { x: 700, y: 150 },
        data: {
          values: {
            json: {
              analysis: 'Análise completa'
            }
          }
        }
      }
    ],
    edges: [
      {
        id: 'twitter-to-sentiment',
        source: 'twitter-webhook',
        target: 'sentiment-analysis'
      },
      {
        id: 'sentiment-to-openai',
        source: 'sentiment-analysis',
        target: 'openai-analysis'
      },
      {
        id: 'openai-to-store',
        source: 'openai-analysis',
        target: 'store-result'
      }
    ]
  }
];

// Função para gerar workflow mockado baseado no JSON do n8n
export function generateMockWorkflow(): Workflow {
  return mockWorkflows[0]; // Retorna o workflow de qualificação de leads
}
