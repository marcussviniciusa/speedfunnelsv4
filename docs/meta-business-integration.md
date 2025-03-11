# Integração com Login do Facebook para Empresas

Este documento explica como configurar e usar a integração com o Login do Facebook para Empresas no SpeedFunnels v4.

## Visão Geral

O Login do Facebook para Empresas é a solução de autorização recomendada pela Meta para integrações com o Facebook Ads. As principais vantagens incluem:

- Segurança aprimorada com tokens controlados pelo usuário
- Acesso apenas aos dados que o usuário explicitamente permite
- Melhor conformidade com políticas da Meta e regulamentos de privacidade
- Experiência de autenticação simplificada

## Pré-requisitos

1. Um aplicativo Meta do tipo **Empresa** registrado no [Meta Developers Portal](https://developers.facebook.com)
2. Configuração de Login do Facebook para Empresas configurada no aplicativo
3. Permissões `ads_management`, `ads_read`, `business_management` e `read_insights` habilitadas

## Configuração do Aplicativo Meta

### 1. Criar um Aplicativo Meta do tipo Empresa

1. Acesse o [Meta Developers Portal](https://developers.facebook.com)
2. Clique em "Meus Aplicativos" > "Criar Aplicativo"
3. Selecione "Empresa" como tipo de aplicativo
4. Preencha o nome e informações de contato

### 2. Configurar o Login do Facebook para Empresas

1. No painel do aplicativo, adicione o produto "Login do Facebook para Empresas"
2. Acesse a seção "Configurações" do produto
3. Clique em "Criar configuração" ou use um modelo existente
4. Defina um nome para a configuração (ex: "SpeedFunnels Ads Integration")
5. Em "Tipo de token de acesso", selecione "Token de acesso do usuário do sistema de integração comercial"
6. Em "Duração do token", selecione "Nunca expira" para uso em produção
7. Em "Permissões", selecione:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `read_insights`
8. Clique em "Criar" para finalizar

### 3. Obter os IDs necessários

Após a criação da configuração, você precisará obter:

- **APP ID**: ID do aplicativo Meta (encontrado na página inicial do aplicativo)
- **APP Secret**: Chave secreta do aplicativo (encontrado em Configurações > Básico)
- **CONFIG ID**: ID da configuração do Login do Facebook para Empresas (mostrado após criar a configuração)

### 4. Configurar URLs de redirecionamento

Em "Configurações > Básico" do seu aplicativo, defina:

- Site: URL do seu site (ex: `https://speedfunnels.com`)
- URL de redirecionamento: URL completo para o callback (ex: `https://api.speedfunnels.com/api/meta-ads/callback`)

## Configuração do SpeedFunnels

### 1. Atualizar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_CONFIG_ID=seu_config_id
META_REDIRECT_URI=https://api.speedfunnels.com/api/meta-ads/callback
```

### 2. Configuração no Frontend

O SpeedFunnels v4 já inclui todos os componentes necessários para a integração. Na página de Configurações, na aba "Integrações API", você encontrará a seção "Facebook Ads" com um botão para conectar sua conta.

### 3. Processo de Autenticação

1. Acesse a página de Configurações do SpeedFunnels
2. Na aba "Integrações API", habilite a integração com Facebook Ads
3. Clique no botão "Conectar com Facebook Ads"
4. Você será redirecionado para o Facebook para autorizar o acesso
5. Selecione a conta de negócios que deseja conectar
6. Autorize as permissões solicitadas
7. Você será redirecionado de volta ao SpeedFunnels, onde verá a confirmação de conexão

## Solução de Problemas

### Token Inválido ou Expirado

Se o token se tornar inválido, você verá uma mensagem de erro na página de Configurações. Simplesmente clique em "Desconectar" e depois "Conectar com Facebook Ads" para obter um novo token.

### Permissões Insuficientes

Se você não vir suas contas de anúncios ou não conseguir acessar dados específicos, verifique:

1. Se você autorizou todas as permissões solicitadas
2. Se você tem o papel adequado na conta de negócios (Administrador ou Analista)
3. Se a conta de anúncios está ativa e acessível

### Outros Erros

Para erros persistentes, verifique:

- Os logs do servidor para mensagens de erro detalhadas
- Se todas as variáveis de ambiente estão configuradas corretamente
- Se o aplicativo Meta está configurado corretamente e aprovado para uso

## Benefícios da Integração

- **Mais Seguro**: O usuário controla exatamente quais dados compartilhar
- **Mais Flexível**: Suporte a múltiplas contas de anúncios
- **Mais Confiável**: Token de longa duração para operação contínua
- **Mais Completo**: Acesso a dados de campanhas, conjuntos de anúncios e anúncios

## Próximos Passos

Após a configuração, você poderá:

1. Visualizar métricas de campanhas na página de Analytics
2. Importar dados de campanhas para análise comparativa
3. Configurar sincronização automática de métricas
4. Criar dashboards personalizados com dados do Facebook Ads

Para mais informações, consulte a [documentação oficial do Login do Facebook para Empresas](https://developers.facebook.com/docs/facebook-login/business).
