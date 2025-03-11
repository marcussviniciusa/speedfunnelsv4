const express = require('express');
const metaBusinessAuthController = require('../controllers/meta-business-auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Rotas para autenticação com o Login do Facebook para Empresas
 */

// Rota para iniciar processo de login com Facebook
router.post('/initiate-login', requireAuth, metaBusinessAuthController.initiateLogin);

// Rota para trocar código de autorização por token de acesso
router.post('/exchange-token', requireAuth, metaBusinessAuthController.exchangeToken);

// Rota para verificar status de conexão atual
router.get('/connection-status', requireAuth, metaBusinessAuthController.getConnectionStatus);

// Rota para desconectar integração
router.post('/disconnect', requireAuth, metaBusinessAuthController.disconnect);

// Rota para obter contas de anúncios disponíveis
router.get('/ad-accounts', requireAuth, metaBusinessAuthController.getAdAccounts);

// Rota para selecionar conta de anúncios a ser usada
router.post('/select-ad-account', requireAuth, metaBusinessAuthController.selectAdAccount);

// Rota de callback para redirecionamento após login
router.get('/callback', metaBusinessAuthController.handleCallback);

// Rota para completar autenticação
router.post('/complete-auth', requireAuth, metaBusinessAuthController.completeAuth);

// Rota para obter informações da integração (scopes, app ID, etc)
router.get('/integration-info', requireAuth, metaBusinessAuthController.getMetaIntegrationInfo);

// Rota para verificar a validade de um token específico
router.get('/verify-token/:accountId', requireAuth, metaBusinessAuthController.verifyToken);

// Rota para obter as permissões necessárias para a integração
router.get('/required-permissions', requireAuth, metaBusinessAuthController.getRequiredPermissions);

module.exports = router;
