const express = require('express');
const metaBusinessAuthController = require('../controllers/meta-business-auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rotas para autenticação com o Login do Facebook para Empresas
 */

// Rota para iniciar processo de login com Facebook
router.post('/initiate-login', authMiddleware, metaBusinessAuthController.initiateLogin);

// Rota para trocar código de autorização por token de acesso
router.post('/exchange-token', authMiddleware, metaBusinessAuthController.exchangeToken);

// Rota para verificar status de conexão atual
router.get('/connection-status', authMiddleware, metaBusinessAuthController.getConnectionStatus);

// Rota para desconectar integração
router.post('/disconnect', authMiddleware, metaBusinessAuthController.disconnect);

// Rota para obter contas de anúncios disponíveis
router.get('/ad-accounts', authMiddleware, metaBusinessAuthController.getAdAccounts);

// Rota para selecionar conta de anúncios a ser usada
router.post('/select-ad-account', authMiddleware, metaBusinessAuthController.selectAdAccount);

// Rota de callback para redirecionamento após login
router.get('/callback', metaBusinessAuthController.handleCallback);

// Rota para completar autenticação
router.post('/complete-auth', authMiddleware, metaBusinessAuthController.completeAuth);

// Rota para obter informações da integração (scopes, app ID, etc)
router.get('/integration-info', authMiddleware, metaBusinessAuthController.getMetaIntegrationInfo);

// Rota para verificar a validade de um token específico
router.get('/verify-token/:accountId', authMiddleware, metaBusinessAuthController.verifyToken);

// Rota para obter as permissões necessárias para a integração
router.get('/required-permissions', authMiddleware, metaBusinessAuthController.getRequiredPermissions);

module.exports = router;
