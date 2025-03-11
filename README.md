# SpeedFunnels v4 - Dashboard para Análise de Marketing Digital

Sistema de dashboard para análise de dados de marketing digital, integrando dados do Meta Ads e Google Analytics.

## Componentes

- **Backend**: API REST em Node.js/Express
- **ETL**: Processamento de dados do Meta Ads e Google Analytics
- **Frontend**: Dashboard em React
- **Database**: PostgreSQL e Redis
- **Infraestrutura**: Docker, Portainer e Traefik

## Configuração de Desenvolvimento

1. Clone o repositório
2. Execute `npm install` nos diretórios `/backend`, `/etl`, e `/frontend`
3. Configure as variáveis de ambiente em `.env` (veja `.env.example`)
4. Inicie os serviços com `docker-compose up`

## Funcionalidades Principais

- Dashboard multi-cliente
- Integração com Meta Ads API
- Integração com Google Analytics
- Análise de ROI e performance de campanhas
- Geração de relatórios
- Autenticação com Google (OAuth2)

## Autenticação

### Autenticação Tradicional
- Registro e login com email/senha
- Tokens JWT para autenticação de API
- Refresh tokens para sessões persistentes

### Autenticação com Google
A plataforma suporta autenticação e login com contas Google, permitindo:
- Login rápido com contas Google
- Autorização para acesso aos dados do Google Analytics
- Conexão de contas existentes com Google
- Desconexão de contas Google mantendo o acesso à plataforma

#### Configuração da Autenticação Google
1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Configure as credenciais OAuth 2.0:
   - Tipo de aplicação: Web
   - URLs de redirecionamento autorizadas: `http://localhost:3001/api/auth/google/callback` (desenvolvimento) e URL de produção
3. Adicione as credenciais no arquivo `.env`:
   ```
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_client_secret
   GOOGLE_REDIRECT_URL=http://localhost:3001/api/auth/google/callback
   ```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login tradicional
- `POST /api/auth/register` - Registro de usuário
- `GET /api/auth/me` - Obter perfil do usuário autenticado
- `POST /api/auth/refresh-token` - Renovar token de acesso
- `POST /api/auth/logout` - Logout

### Autenticação Google
- `GET /api/auth/google` - Iniciar autenticação com Google
- `GET /api/auth/google/callback` - Callback para processar autenticação Google
- `GET /api/auth/google/status` - Verificar status da conexão com Google
- `POST /api/auth/google/disconnect` - Desconectar conta do Google

## Integrações de Analytics

O SpeedFunnels v4 oferece integrações robustas com Google Analytics e Meta Ads para análise avançada de dados de marketing.

### Google Analytics

A integração com Google Analytics permite:

- Visualização de métricas essenciais (sessões, usuários, pageviews)
- Análise de desempenho ao longo do tempo
- Identificação das principais fontes de tráfego
- Lista de páginas mais visitadas
- Dados demográficos dos usuários
- Acompanhamento de eventos personalizados

#### API Endpoints Google Analytics
Todos os endpoints requerem autenticação JWT e parâmetros de data no formato `YYYY-MM-DD`:

- `GET /api/google-analytics/summary` - Resumo de métricas
- `GET /api/google-analytics/performance` - Desempenho diário
- `GET /api/google-analytics/traffic-sources` - Fontes de tráfego
- `GET /api/google-analytics/top-pages` - Páginas mais visitadas
- `GET /api/google-analytics/demographics` - Dados demográficos
- `GET /api/google-analytics/events` - Eventos registrados

### Meta Ads

A integração com Meta Ads permite:

- Monitoramento de campanhas publicitárias no Meta (Facebook/Instagram)
- Análise de desempenho (impressões, cliques, CTR, gastos)
- Avaliação de campanhas, conjuntos de anúncios e anúncios individuais
- Cálculo de ROI e métricas de conversão

#### API Endpoints Meta Ads
Todos os endpoints requerem autenticação JWT e parâmetros de data no formato `YYYY-MM-DD`:

- `GET /api/meta-ads/summary` - Resumo de métricas
- `GET /api/meta-ads/performance` - Desempenho diário
- `GET /api/meta-ads/campaigns` - Lista de campanhas
- `GET /api/meta-ads/adsets` - Conjuntos de anúncios
- `GET /api/meta-ads/ads` - Anúncios individuais

### Dashboard Unificado de Analytics

Um dashboard unificado de analytics está disponível em `/analytics`, combinando dados do Google Analytics e Meta Ads em uma única interface intuitiva.

Para obter mais detalhes sobre a configuração e uso das integrações de analytics, consulte o arquivo [README-ANALYTICS.md](/backend/README-ANALYTICS.md).

## Scripts de Teste e Utilitários

O projeto inclui scripts para testar as conexões com as APIs:

- `backend/src/scripts/test-ga-connection.js` - Testa a conexão com Google Analytics
- `backend/src/scripts/test-meta-ads-connection.js` - Testa a conexão com Meta Ads
- `backend/src/scripts/test-analytics-connections.js` - Testa ambas as conexões

## Variáveis de Ambiente

Além das variáveis mencionadas anteriormente, configure as seguintes para as integrações de analytics:

```
# Google Analytics
GOOGLE_SERVICE_ACCOUNT_KEY=caminho/para/chave.json
GA_VIEW_ID=seu_view_id
GA_CLIENT_EMAIL=email_da_conta_de_servico
GA_PRIVATE_KEY="chave_privada_da_conta_de_servico"

# Meta Ads
META_ACCESS_TOKEN=seu_token_de_acesso
META_AD_ACCOUNT_ID=seu_id_da_conta_de_anuncios
