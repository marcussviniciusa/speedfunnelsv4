const metaBusinessAuthService = require('../services/meta-business-auth.service');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Controlador para autenticação com o Login do Facebook para Empresas
 */
class MetaBusinessAuthController {
  /**
   * Inicia o processo de login via Facebook Business SDK
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async initiateLogin(req, res) {
    try {
      const { userId } = req.user;
      const state = await metaBusinessAuthService.generateAuthState(userId);
      
      return res.status(200).json({
        success: true,
        state
      });
    } catch (error) {
      logger.error('Erro ao iniciar login com Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao iniciar processo de autenticação com Facebook Ads',
        error: error.message
      });
    }
  }

  /**
   * Endpoint de callback para o processo de autenticação
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleCallback(req, res) {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros de autenticação ausentes'
        });
      }
      
      // Armazenar o código temporariamente no Redis associado ao state
      await redisClient.set(`meta_auth_code:${state}`, code, 'EX', 300); // expira em 5 minutos
      
      // Redirecionar para a página de conclusão do frontend
      return res.redirect(`${process.env.FRONTEND_URL}/meta-auth-complete?state=${state}`);
    } catch (error) {
      logger.error('Erro ao processar callback do Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar autenticação com Facebook Ads',
        error: error.message
      });
    }
  }

  /**
   * Completa o processo de autenticação usando o estado armazenado
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async completeAuth(req, res) {
    try {
      const { state } = req.body;
      const { userId } = req.user;
      
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro de estado ausente'
        });
      }
      
      // Verificar se o state pertence ao usuário atual
      const storedUserId = await redisClient.get(`meta_auth_state:${state}`);
      if (!storedUserId || storedUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Estado de autenticação inválido ou expirado'
        });
      }
      
      // Obter o código armazenado temporariamente no Redis
      const code = await redisClient.get(`meta_auth_code:${state}`);
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Código de autorização expirado ou ausente'
        });
      }
      
      // Trocar o código por um token de acesso
      const tokenResponse = await metaBusinessAuthService.exchangeCodeForToken(code);
      
      // Obter informações de conta de negócios e contas de anúncios
      const businessData = await metaBusinessAuthService.getBusinessAccounts(tokenResponse.accessToken);
      
      // Salvar as informações de token no banco de dados
      await metaBusinessAuthService.saveUserToken(userId, tokenResponse, businessData);
      
      // Limpar dados temporários do Redis
      await redisClient.del(`meta_auth_state:${state}`);
      await redisClient.del(`meta_auth_code:${state}`);
      
      return res.status(200).json({
        success: true,
        message: 'Autenticação com Facebook Ads concluída com sucesso',
        businessAccounts: businessData.businessAccounts
      });
    } catch (error) {
      logger.error('Erro ao completar autenticação com Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao finalizar autenticação com Facebook Ads',
        error: error.message
      });
    }
  }

  /**
   * Troca o código de autorização por um token de acesso
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async exchangeToken(req, res) {
    try {
      const { code, business_id } = req.body;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Código de autorização não fornecido'
        });
      }
      
      const userId = req.user.id;
      const result = await metaBusinessAuthService.exchangeToken(code, business_id, userId);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Erro ao trocar token do Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar autenticação com Facebook Ads',
        error: error.message
      });
    }
  }
  
  /**
   * Verifica o status da conexão atual com o Meta Business
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConnectionStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await metaBusinessAuthService.getConnectionStatus(userId);
      
      return res.status(200).json({
        success: true,
        ...status
      });
    } catch (error) {
      logger.error('Erro ao verificar status de conexão Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar status de conexão com Facebook Ads',
        error: error.message
      });
    }
  }

  /**
   * Desconecta a integração com o Meta Business
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async disconnect(req, res) {
    try {
      const userId = req.user.id;
      await metaBusinessAuthService.disconnect(userId);
      
      return res.status(200).json({
        success: true,
        message: 'Integração com Facebook Ads desconectada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao desconectar integração Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao desconectar integração com Facebook Ads',
        error: error.message
      });
    }
  }

  /**
   * Obtém as contas de anúncios disponíveis para o usuário
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAdAccounts(req, res) {
    try {
      const userId = req.user.id;
      const adAccounts = await metaBusinessAuthService.getAdAccounts(userId);
      
      return res.status(200).json({
        success: true,
        adAccounts
      });
    } catch (error) {
      logger.error('Erro ao obter contas de anúncios Meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter contas de anúncios do Facebook Ads',
        error: error.message
      });
    }
  }
  
  /**
   * Seleciona uma conta de anúncios para ser usada
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async selectAdAccount(req, res) {
    try {
      const { adAccountId } = req.body;
      
      if (!adAccountId) {
        return res.status(400).json({
          success: false,
          message: 'ID da conta de anúncios não fornecido'
        });
      }
      
      const userId = req.user.id;
      await metaBusinessAuthService.selectAdAccount(adAccountId, userId);
      
      return res.status(200).json({
        success: true,
        message: 'Conta de anúncios selecionada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao selecionar conta de anúncios Meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao selecionar conta de anúncios do Facebook Ads',
        error: error.message
      });
    }
  }
}

module.exports = new MetaBusinessAuthController();
