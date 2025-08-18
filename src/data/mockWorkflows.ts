import { Workflow } from '../types';

export const generateMockWorkflow = (): Workflow => {
  return mockWorkflows[0];
};

const mockWorkflows: Workflow[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Qualificação de Lead B2B SaaS',
    description: 'Workflow para qualificar leads B2B usando dados de CNPJ, Google Places e IA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: '',
    nodes: [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Entrada Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: { x: 100, y: 300 },
        parameters: {
          path: 'qualificar-lead',
          method: 'POST',
          responseMode: 'onReceived'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Limpar CNPJ',
        type: 'n8n-nodes-base.function',
        position: { x: 400, y: 300 },
        parameters: {
          functionCode: ''
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'ReceitaWS',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 700, y: 100 },
        parameters: {
          url: 'https://www.receitaws.com.br/v1/cnpj={{$json.cnpj}}',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Google Places',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 700, y: 220 },
        parameters: {
          url: 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={{$json.nome}}&inputtype=textquery&fields=name,rating,user_ratings_total,formatted_address&key=SUA_GOOGLE_API_KEY',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'CNPJ Aberto',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 700, y: 340 },
        parameters: {
          url: 'https://publica.cnpj.ws/cnpj/{{ $json.cnpj }}',
          method: 'GET',
          responseFormat: 'json'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Buscar LinkedIn',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 700, y: 460 },
        parameters: {
          url: 'https://api.search.brave.com/res/v1/web/search?q={{$json.nome}} site:linkedin.com&count=3',
          method: 'GET',
          headers: {
            'x-api-key': 'SUA_BRAVE_API_KEY'
          },
          responseFormat: 'json'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'Criar Prompt DeepSeek',
        type: 'n8n-nodes-base.function',
        position: { x: 1000, y: 300 },
        parameters: {
          functionCode: 'const dados = \n  nome: $json.nome,\n  cnpj: $json.cnpj,\n  receita: $items("ReceitaWS")[0].json,\n  google: $items("Google Places")[0].json,\n  cnpjAberto: $items("CNPJ Aberto")[0].json,\n  linkedin: $items("Buscar LinkedIn")[0].json\n;\n\nreturn [{\n  json: {\n    prompt: `Avalie a empresa a seguir com base nos dados fornecidos. Determine um score de 0 a 100 sobre o quão qualificada ela parece para ser um lead de produto B2B SaaS.\n\n${JSON.stringify(dados, null, 2)}\n\nResponda com um número e uma justificativa curta.`\n  }\n}];'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'Classificar com DeepSeek',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 1300, y: 300 },
        parameters: {
          url: 'https://api.deepseek.com/v1/chat/completions',
          method: 'POST',
          responseFormat: 'json',
          headers: {
            'Authorization': 'Bearer SUA_DEEPSEEK_API_KEY',
            'Content-Type': 'application/json'
          },
          jsonParameters: true,
          bodyParametersJson: {
            'model': 'deepseek-chat',
            'messages': [
              {
                'role': 'user',
                'content': '={{$json.prompt}}'
              }
            ],
            'temperature': 0.3
          }
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Extrair Score',
        type: 'n8n-nodes-base.function',
        position: { x: 1600, y: 300 },
        parameters: {
          functionCode: 'const texto = $json.choices?.[0]?.message?.content || "";\nconst match = texto.match(/(\\d{1,3})/);\nconst score = match ? parseInt(match[1]) : null;\nreturn [{ json: { ...$json, score, motivo: texto } }];'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Retornar Resultado',
        type: 'n8n-nodes-base.set',
        position: { x: 1900, y: 300 },
        parameters: {
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
    connections: {
      'Entrada Webhook': {
        main: [
          [{ node: 'Limpar CNPJ', type: 'main', index: 0 }]
        ]
      },
      'Limpar CNPJ': {
        main: [
          [
            { node: 'ReceitaWS', type: 'main', index: 0 },
            { node: 'Google Places', type: 'main', index: 0 },
            { node: 'CNPJ Aberto', type: 'main', index: 0 },
            { node: 'Buscar LinkedIn', type: 'main', index: 0 }
          ]
        ]
      },
      'ReceitaWS': {
        main: [[{ node: 'Criar Prompt DeepSeek', type: 'main', index: 0 }]]
      },
      'Google Places': {
        main: [[{ node: 'Criar Prompt DeepSeek', type: 'main', index: 0 }]]
      },
      'CNPJ Aberto': {
        main: [[{ node: 'Criar Prompt DeepSeek', type: 'main', index: 0 }]]
      },
      'Buscar LinkedIn': {
        main: [[{ node: 'Criar Prompt DeepSeek', type: 'main', index: 0 }]]
      },
      'Criar Prompt DeepSeek': {
        main: [[{ node: 'Classificar com DeepSeek', type: 'main', index: 0 }]]
      },
      'Classificar com DeepSeek': {
        main: [[{ node: 'Extrair Score', type: 'main', index: 0 }]]
      },
      'Extrair Score': {
        main: [[{ node: 'Retornar Resultado', type: 'main', index: 0 }]]
      }
    }
  }
];
