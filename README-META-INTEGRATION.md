# SpeedFunnels v4 - Integração com Meta Business SDK

Este arquivo documenta a integração do SpeedFunnels v4 com o Meta Business SDK usando o Login do Facebook para Empresas.

## Visão Geral

A integração permite que usuários do SpeedFunnels conectem suas contas de anúncios do Facebook para extrair métricas e insights para análise. Utilizamos o método recomendado pela Meta - o Login do Facebook para Empresas - para garantir a segurança e conformidade com as políticas da plataforma.

## Requisitos

1. Conta de desenvolvedor Meta
2. Aplicativo Meta configurado com Login do Facebook para Empresas
3. Permissões de API: `ads_management`, `ads_read`, `business_management`, `read_insights`
4. Variáveis de ambiente configuradas

## Arquitetura da Integração

### Frontend

- `metaConfig.js`: Configurações para o SDK do Meta Business
- `MetaBusinessLogin.js`: Componente React para processo de login
- `MetaAuthComplete.js`: Página para completar o processo de autenticação

### Backend

- `meta-business-auth.routes.js`: Rotas para processo de autenticação
- `meta-business-auth.controller.js`: Controlador para gerenciar requisições
- `meta-business-auth.service.js`: Lógica de negócios para autenticação
- `business-account.model.js`: Modelo para armazenar contas conectadas

### Fluxo de Autenticação

1. Usuário clica no botão "Conectar com Facebook Ads"
2. Sistema gera um estado de autenticação único e armazena no Redis
3. Usuário é redirecionado para o Facebook para autorização
4. Facebook redireciona de volta com código de autorização
5. Backend troca código por token de acesso
6. Backend obtém informações de contas de negócios e anúncios
7. Informações são salvas no banco de dados
8. Frontend exibe contas conectadas

## Variáveis de Ambiente

```
META_APP_ID=            # ID do aplicativo Meta
META_APP_SECRET=        # Chave secreta do aplicativo
META_CONFIG_ID=         # ID da configuração do Business SDK
META_REDIRECT_URI=      # URL de redirecionamento para callback
```

## Configuração do Aplicativo Meta

1. **Crie um aplicativo Meta**:
   - Acesse [developers.facebook.com](https://developers.facebook.com/)
   - Clique em "Meus Aplicativos" > "Criar Aplicativo"
   - Selecione "Empresa" como tipo de aplicativo

2. **Configure o Login do Facebook para Empresas**:
   - No painel do aplicativo, adicione o produto "Login do Facebook para Empresas"
   - Em "Configurações", crie uma nova configuração
   - Selecione "Token de acesso do usuário do sistema de integração comercial"
   - Adicione as permissões necessárias (`ads_management`, `ads_read`, etc.)

3. **Configure URLs de redirecionamento**:
   - Em "Configurações" > "Básico", adicione seu domínio
   - Em "Login do Facebook para Empresas" > "Configurações", adicione a URL de redirecionamento

4. **Obtenha os IDs necessários**:
   - `META_APP_ID`: Página inicial do aplicativo
   - `META_APP_SECRET`: Em "Configurações" > "Básico"
   - `META_CONFIG_ID`: ID da configuração do Login do Facebook para Empresas

## Implementação Local

1. Clone o repositório
2. Configure as variáveis de ambiente
3. Execute `npm install` no diretório frontend e backend
4. Inicie o servidor e o cliente

## Uso da API

### Conectar conta de Facebook Ads

```javascript
// No frontend
import MetaBusinessLogin from '../components/MetaBusinessLogin';

<MetaBusinessLogin
  onLoginSuccess={(data) => {
    console.log('Conectado com sucesso!', data);
  }}
/>
```

### Obter métricas de campanhas

```javascript
// No backend
const MetaAdsService = require('../services/meta-ads.service');

// Obter métricas
const metrics = await MetaAdsService.getCampaignMetrics(userId, dateRange);
```

## Segurança

- Tokens de acesso são armazenados criptografados no banco de dados
- Autenticação de usuário requerida para acessar dados das contas
- Estado de autenticação único para prevenir CSRF
- Redis para armazenamento temporário de códigos de autorização

## Troubleshooting

### Problemas comuns

1. **Erro: "Login failed"**
   - Verifique se o aplicativo está configurado corretamente
   - Confirme que o usuário tem permissões adequadas na conta de negócios

2. **Erro: "Invalid OAuth redirect URI"**
   - Verifique se a URL de redirecionamento corresponde exatamente à configurada no aplicativo Meta

3. **Erro: "The user hasn't authorized the application"**
   - O usuário precisa conceder todas as permissões solicitadas

4. **Erro: "Token expirado"**
   - Os tokens são renovados automaticamente, mas podem expirar se o usuário revogar o acesso
   - Solicite que o usuário se reconecte

## Referências

- [Documentação do Login do Facebook para Empresas](https://developers.facebook.com/docs/facebook-login/business)
- [Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Políticas de Plataforma Meta](https://developers.facebook.com/policy/)

## Atualizações Futuras

- Implementação de métricas avançadas
- Visualização de dados históricos
- Sincronização automática de campanhas
- Suporte para múltiplas contas de negócios por usuário

---

Para documentação mais detalhada, consulte o arquivo `/docs/meta-business-integration.md`.
