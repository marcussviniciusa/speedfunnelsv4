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
