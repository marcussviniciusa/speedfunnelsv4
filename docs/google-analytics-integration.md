# Integração OAuth com Google Analytics

Este documento explica como configurar e usar a integração OAuth com o Google Analytics no SpeedFunnels v4.

## Visão Geral

A autenticação OAuth com o Google Analytics é a solução recomendada pelo Google para integrações com o Analytics. As principais vantagens incluem:

- Segurança aprimorada com tokens controlados pelo usuário
- Acesso apenas aos dados que o usuário explicitamente permite
- Melhor conformidade com políticas do Google e regulamentos de privacidade
- Experiência de autenticação simplificada

## Pré-requisitos

1. Um projeto Google Cloud configurado no [Google Cloud Console](https://console.cloud.google.com)
2. Credenciais OAuth 2.0 para aplicativo Web configuradas no projeto
3. API Google Analytics habilitada no projeto
4. Conta e propriedade no Google Analytics

## Configuração do Projeto Google Cloud

### 1. Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Clique em "Criar Projeto"
3. Preencha o nome do projeto e outras informações solicitadas
4. Clique em "Criar"

### 2. Habilitar a API do Google Analytics

1. No painel do projeto, acesse "APIs e Serviços" > "Biblioteca"
2. Busque por "Google Analytics API"
3. Selecione a API e clique em "Habilitar"

### 3. Configurar Credenciais OAuth 2.0

1. No painel de APIs e Serviços, acesse "Credenciais"
2. Clique em "Criar Credenciais" > "ID do Cliente OAuth"
3. Selecione "Aplicativo da Web" como tipo de aplicativo
4. Preencha o nome (ex: "SpeedFunnels Google Analytics Integration")
5. Em "Origens JavaScript autorizadas", adicione:
   - `http://localhost:3000` (para desenvolvimento)
   - `https://seu-dominio.com` (para produção)
6. Em "URIs de redirecionamento autorizados", adicione:
   - `http://localhost:3000/api/auth/google/callback` (para desenvolvimento)
   - `https://seu-dominio.com/api/auth/google/callback` (para produção)
7. Clique em "Criar"
8. Anote o ID do Cliente e o Segredo do Cliente gerados

### 4. Configurar Tela de Consentimento OAuth

1. No painel de APIs e Serviços, acesse "Tela de consentimento OAuth"
2. Selecione "Externo" (ou "Interno", se aplicável à sua organização)
3. Preencha as informações do aplicativo:
   - Nome do aplicativo
   - E-mail de suporte ao usuário
   - Logotipo (opcional)
   - Domínio do aplicativo
4. Adicione os escopos necessários:
   - `.../auth/userinfo.profile`
   - `.../auth/userinfo.email`
   - `.../auth/analytics.readonly`
5. Adicione domínios autorizados e informações de contato do desenvolvedor
6. Conclua a configuração e publique o aplicativo

## Configuração no SpeedFunnels v4

### 1. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```
GOOGLE_CLIENT_ID=seu_id_do_cliente
GOOGLE_CLIENT_SECRET=seu_segredo_do_cliente
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

Para produção, atualize o valor de `GOOGLE_REDIRECT_URL` para seu domínio de produção.

### 2. Verificar Configuração do Banco de Dados

Confirme que o modelo `User` possui os seguintes campos necessários para armazenar as informações de autenticação do Google:

- `googleId`
- `googleAccessToken`
- `googleRefreshToken`
- `googleTokenExpiry`
- `googleConnected`

## Implementação Técnica

### Backend

O backend contém os seguintes componentes principais:

#### 1. Controlador de Autenticação

O arquivo `src/controllers/google-auth.controller.js` gerencia o fluxo de autenticação:

- `initiateGoogleAuth`: Inicia o fluxo de autenticação redirecionando para a URL de consentimento do Google
- `handleGoogleCallback`: Processa o callback do Google após a autenticação, obtendo tokens e armazenando-os
- `checkGoogleConnection`: Verifica se o usuário atual está conectado ao Google Analytics
- `disconnectGoogle`: Desconecta uma conta do Google Analytics

#### 2. Serviço de Autenticação

O arquivo `src/services/google-auth.service.js` contém a lógica de autenticação:

- `generateAuthUrl`: Gera a URL de autenticação com os escopos adequados
- `getTokens`: Troca o código de autorização por tokens
- `getUserProfile`: Obtém o perfil do usuário usando o token de acesso
- `saveUserTokens`: Armazena os tokens do usuário no banco de dados
- `revokeTokens`: Revoga os tokens quando o usuário desconecta a conta

#### 3. Serviço do Google Analytics

O arquivo `src/services/ga.service.js` contém a lógica para interagir com a API do Google Analytics:

- `_initializeAuth`: Inicializa a autenticação a partir dos tokens do usuário e obtém o `viewId` da propriedade do GA
- `_refreshToken`: Atualiza um token expirado usando o refresh token
- Métodos para obter dados analíticos como `getSummary`, `getPerformance`, `getEvents`, etc.

### Frontend

#### 1. Componente de Login

Implemente um botão de login com Google na interface:

```jsx
<Button 
  onClick={() => window.location.href = '/api/auth/google'}
  startIcon={<GoogleIcon />}
>
  Conectar com Google Analytics
</Button>
```

#### 2. Página de Configurações

Na página de configurações, permita que os usuários:

- Visualizem o status da conexão com o Google Analytics
- Conectem ou desconectem suas contas do Google Analytics
- Visualizem propriedades e perfis conectados

## Uso da API

### Exemplos de Requisições

#### 1. Iniciar Autenticação

```http
GET /api/auth/google
```

#### 2. Verificar Status da Conexão

```http
GET /api/auth/google/status
```

#### 3. Obter Dados do Google Analytics

```http
GET /api/analytics/summary?startDate=2023-01-01&endDate=2023-01-31
```

## Solução de Problemas

### Problemas Comuns

1. **Erro "Token expirado"**
   - Solução: O token de acesso expirou. O sistema deve tentar renovar automaticamente usando o refresh token. Se persistir, o usuário precisa reconectar sua conta.

2. **Erro "Acesso negado"**
   - Solução: Verifique se as permissões corretas foram solicitadas e se o usuário concedeu todas as permissões necessárias.

3. **Erro "ViewId não encontrado"**
   - Solução: Confirme se o usuário tem acesso a pelo menos uma propriedade do Google Analytics com um perfil (view) configurado.

## Próximos Passos e Melhorias Futuras

1. Implementar seleção de propriedade e perfil do Google Analytics pelo usuário
2. Adicionar suporte ao Google Analytics 4 (GA4)
3. Configurar sincronização automática de métricas
4. Criar dashboards personalizados com dados do Google Analytics

Para mais informações, consulte a [documentação oficial da API do Google Analytics](https://developers.google.com/analytics/devguides/reporting/core/v4).
