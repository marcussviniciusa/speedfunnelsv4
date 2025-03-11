/**
 * Configuração para a integração com o Meta Business SDK
 */
const metaConfig = {
  // Configuração do app Meta
  appId: process.env.REACT_APP_META_APP_ID,
  // ID da configuração do Login do Facebook para Empresas (será definido no painel do desenvolvedor)
  configId: process.env.REACT_APP_META_CONFIG_ID,
  // Permissões necessárias para acessar dados de anúncios
  permissions: ['ads_management', 'ads_read', 'business_management', 'read_insights'],
  // URL para redirecionamento após login
  redirectUri: process.env.REACT_APP_META_REDIRECT_URI || window.location.origin + '/meta-callback',
};

export default metaConfig;
