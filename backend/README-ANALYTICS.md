# Integrações com Google Analytics e Meta Ads

Este documento descreve como configurar e utilizar as integrações com Google Analytics e Meta Ads no SpeedFunnels v4.

## Índice

1. [Requisitos](#requisitos)
2. [Configuração](#configuração)
   - [Configuração do Google Analytics](#configuração-do-google-analytics)
   - [Configuração do Meta Ads](#configuração-do-meta-ads)
3. [Autenticação com Google](#autenticação-com-google)
4. [APIs Disponíveis](#apis-disponíveis)
   - [Google Analytics](#google-analytics)
   - [Meta Ads](#meta-ads)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Scripts de Teste](#scripts-de-teste)
7. [Dashboard](#dashboard)
8. [Troubleshooting](#troubleshooting)

## Requisitos

Para utilizar as integrações com Google Analytics e Meta Ads, você precisará:

- Conta no Google Analytics
- Conta no Meta Business Manager e acesso a uma conta de anúncios
- Credenciais de API configuradas para ambos os serviços

## Configuração

### Configuração do Google Analytics

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilite a API do Google Analytics
3. Crie credenciais OAuth2 para o seu aplicativo
4. Configure as variáveis de ambiente no arquivo `.env`:

```
# Credenciais do Google OAuth2
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URL=https://seu-dominio.com/api/auth/google/callback

# Credenciais para acesso à API do Google Analytics
GOOGLE_SERVICE_ACCOUNT_KEY=caminho/para/chave.json
GA_VIEW_ID=seu_view_id
GA_CLIENT_EMAIL=email_da_conta_de_servico
GA_PRIVATE_KEY="chave_privada_da_conta_de_servico"
```

### Configuração do Meta Ads

1. Crie um aplicativo no [Meta for Developers](https://developers.facebook.com/)
2. Adicione a permissão `ads_management` ao seu aplicativo
3. Gere um token de acesso para a sua conta de anúncios
4. Configure as variáveis de ambiente no arquivo `.env`:

```
# Credenciais do Meta Ads
META_ACCESS_TOKEN=seu_token_de_acesso
META_AD_ACCOUNT_ID=seu_id_da_conta_de_anuncios
```

## Autenticação com Google

A aplicação inclui um fluxo completo de autenticação OAuth2 com o Google, que permite:

1. Fazer login com a conta Google
2. Conectar contas de usuários existentes com o Google
3. Autorizar acesso aos dados do Google Analytics

Endpoints para autenticação:

- `GET /api/auth/google` - Inicia o fluxo de autenticação com Google
- `GET /api/auth/google/callback` - Callback para processar a autenticação
- `GET /api/auth/google/connection-status` - Verifica o status da conexão

## APIs Disponíveis

### Google Analytics

Todos os endpoints abaixo requerem autenticação JWT e parâmetros de data no formato `YYYY-MM-DD`.

- `GET /api/google-analytics/summary` - Resumo de métricas (sessões, usuários, pageviews)
- `GET /api/google-analytics/performance` - Dados de desempenho diário
- `GET /api/google-analytics/traffic-sources` - Principais fontes de tráfego
- `GET /api/google-analytics/top-pages` - Páginas mais visitadas
- `GET /api/google-analytics/demographics` - Dados demográficos dos usuários
- `GET /api/google-analytics/events` - Eventos registrados

Parâmetros de consulta:

- `startDate` (obrigatório) - Data de início no formato YYYY-MM-DD
- `startDate` (obrigatório) - Data de fim no formato YYYY-MM-DD
- `clientId` (opcional) - ID do cliente para filtrar dados
- `limit` (opcional) - Limite de resultados (apenas para alguns endpoints)

### Meta Ads

Todos os endpoints abaixo requerem autenticação JWT e parâmetros de data no formato `YYYY-MM-DD`.

- `GET /api/meta-ads/summary` - Resumo de métricas (impressões, cliques, CTR, gastos)
- `GET /api/meta-ads/performance` - Dados de desempenho diário
- `GET /api/meta-ads/campaigns` - Lista de campanhas
- `GET /api/meta-ads/adsets` - Conjuntos de anúncios
- `GET /api/meta-ads/ads` - Anúncios individuais

Parâmetros de consulta:

- `startDate` (obrigatório) - Data de início no formato YYYY-MM-DD
- `startDate` (obrigatório) - Data de fim no formato YYYY-MM-DD
- `clientId` (opcional) - ID do cliente para filtrar dados
- `campaignId` (opcional) - ID da campanha para filtrar conjuntos de anúncios ou anúncios
- `adSetId` (opcional) - ID do conjunto de anúncios para filtrar anúncios

## Exemplos de Uso

### Exemplo de requisição para Google Analytics

```javascript
// Obter resumo de métricas
const startDate = '2023-01-01';
const endDate = '2023-01-31';

fetch(`/api/google-analytics/summary?startDate=${startDate}&endDate=${endDate}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));
```

### Exemplo de requisição para Meta Ads

```javascript
// Obter lista de campanhas
const startDate = '2023-01-01';
const endDate = '2023-01-31';

fetch(`/api/meta-ads/campaigns?startDate=${startDate}&endDate=${endDate}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));
```

## Scripts de Teste

O projeto inclui scripts para testar a conexão com as APIs:

- `src/scripts/test-ga-connection.js` - Testa a conexão com o Google Analytics
- `src/scripts/test-meta-ads-connection.js` - Testa a conexão com o Meta Ads
- `src/scripts/test-analytics-connections.js` - Testa ambas as conexões

Para executar os scripts:

```bash
# Testar Google Analytics
node src/scripts/test-ga-connection.js

# Testar Meta Ads
node src/scripts/test-meta-ads-connection.js

# Testar ambas as conexões
node src/scripts/test-analytics-connections.js
```

## Dashboard

A aplicação inclui um dashboard para visualizar os dados do Google Analytics e Meta Ads. O dashboard está disponível em:

```
/analytics
```

O dashboard permite:

- Visualizar métricas resumidas
- Analisar desempenho ao longo do tempo
- Ver fontes de tráfego e campanhas
- Analisar páginas mais visitadas
- Comparar dados entre períodos

Para acessar os dados do Google Analytics, o usuário precisa conectar sua conta Google através do botão "Conectar com Google" disponível no dashboard.

## Troubleshooting

### Google Analytics

- **Erro de autorização**: Verifique se as credenciais OAuth2 estão configuradas corretamente e se o usuário concedeu as permissões necessárias.
- **Erro na API**: Verifique se a API do Google Analytics está habilitada no console do Google Cloud e se a conta de serviço tem acesso à propriedade do Analytics.
- **Dados não aparecem**: Verifique se o View ID está correto e se você tem acesso à visualização no Google Analytics.

### Meta Ads

- **Erro de autorização**: Verifique se o token de acesso é válido e não expirou. Tokens de longa duração são recomendados.
- **Erro na API**: Verifique se o aplicativo tem as permissões necessárias e se a conta de anúncios está ativa.
- **Dados não aparecem**: Verifique se o ID da conta de anúncios está correto e se há campanhas ativas no período especificado.
