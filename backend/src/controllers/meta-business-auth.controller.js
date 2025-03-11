const metaBusinessAuthService = require('../services/meta-business-auth.service');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Controlador para autenticação com o Login do Facebook para Empresas
 * Gerencia o fluxo completo de OAuth 2.0 para integração com Meta Business SDK
 * e acesso às contas de anúncios do Facebook
 */
class MetaBusinessAuthController {
  /**
   * Inicia o processo de login via Facebook Business SDK
   * Gera um estado de autenticação único para o usuário que será validado posteriormente
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async initiateLogin(req, res) {
    try {
      const { userId } = req.user;
      const state = await metaBusinessAuthService.generateAuthState(userId);
      
      logger.info(`Iniciando processo de login com Meta Business para usuário ${userId} com estado ${state}`);
      
      return res.status(200).json({
        success: true,
        state,
        scopes: metaBusinessAuthService.requiredPermissions
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
   * Endpoint de callback para o processo de autenticação OAuth
   * Recebe o código de autorização do Facebook e armazena temporariamente para troca por um token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleCallback(req, res) {
    try {
      const { code, state, error, error_reason, error_description } = req.query;
      
      // Verificar se o usuário negou acesso ou ocorreu algum erro na autorização
      if (error || error_reason) {
        logger.warn(`Erro no callback do Facebook: ${error} - ${error_reason} - ${error_description}`);
        return res.redirect(`${process.env.FRONTEND_URL}/meta-auth-complete?error=${encodeURIComponent(error_description || error_reason || error)}`);
      }
      
      if (!code || !state) {
        logger.warn('Callback do Facebook sem código ou estado')
        return res.status(400).json({
          success: false,
          message: 'Parâmetros de autenticação ausentes'
        });
      }
      
      // Verificar se o estado existe no Redis
      const storedUserId = await redisClient.get(`meta_auth_state:${state}`);
      if (!storedUserId) {
        logger.warn(`Estado inválido recebido no callback: ${state}`);
        return res.redirect(`${process.env.FRONTEND_URL}/meta-auth-complete?error=${encodeURIComponent('Estado de autenticação inválido ou expirado')}`);
      }
      
      // Armazenar o código temporariamente no Redis associado ao state
      await redisClient.set(`meta_auth_code:${state}`, code, 'EX', 300); // expira em 5 minutos
      logger.info(`Código de autorização armazenado para estado ${state}`);
      
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
   * Completa o processo de autenticação trocando o código por um token e obtendo dados de negócios
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
        logger.warn(`Tentativa de completar autenticação com estado inválido: ${state} para usuário ${userId}`);
        return res.status(403).json({
          success: false,
          message: 'Estado de autenticação inválido ou expirado'
        });
      }
      
      // Obter o código armazenado temporariamente no Redis
      const code = await redisClient.get(`meta_auth_code:${state}`);
      if (!code) {
        logger.warn(`Código de autorização ausente para estado: ${state}`);
        return res.status(400).json({
          success: false,
          message: 'Código de autorização expirado ou ausente'
        });
      }
      
      // Trocar o código por um token de acesso
      logger.info(`Trocando código por token para usuário ${userId}`);
      const tokenResponse = await metaBusinessAuthService.exchangeCodeForToken(code);
      
      // Obter informações de conta de negócios e contas de anúncios
      logger.info(`Obtendo informações de contas de negócios para usuário ${userId}`);
      const businessData = await metaBusinessAuthService.getBusinessAccounts(tokenResponse.accessToken);
      
      // Verificar se existem contas de negócios disponíveis
      if (!businessData.businessAccounts || businessData.businessAccounts.length === 0) {
        logger.warn(`Nenhuma conta de negócios encontrada para usuário ${userId}`);
        return res.status(400).json({
          success: false,
          message: 'Nenhuma conta de negócios do Facebook encontrada para este usuário. Verifique se você tem permissões adequadas ou crie uma conta de negócios no Facebook.'
        });
      }
      
      // Salvar as informações de token no banco de dados
      logger.info(`Salvando token e informações para usuário ${userId} com ${businessData.businessAccounts.length} contas de negócios`);
      await metaBusinessAuthService.saveUserToken(userId, tokenResponse, businessData);
      
      // Limpar dados temporários do Redis
      await redisClient.del(`meta_auth_state:${state}`);
      await redisClient.del(`meta_auth_code:${state}`);
      
      return res.status(200).json({
        success: true,
        message: 'Autenticação com Facebook Ads concluída com sucesso',
        userName: businessData.userName,
        userEmail: businessData.userEmail,
        businessAccounts: businessData.businessAccounts
      });
    } catch (error) {
      logger.error('Erro ao completar autenticação com Meta Business:', error);
      
      // Mensagens de erro mais amigáveis e específicas
      let errorMessage = 'Erro ao finalizar autenticação com Facebook Ads';
      if (error.message.includes('Permissões necessárias não concedidas')) {
        errorMessage = 'Permissões necessárias para acessar dados de anúncios não foram concedidas. Por favor, tente novamente e autorize todas as permissões solicitadas.';
      } else if (error.message.includes('token')) {
        errorMessage = 'Erro com o token de autenticação do Facebook. Por favor, tente novamente o processo de login.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
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
   * Retorna informações sobre tokens, contas conectadas e status de expiração
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConnectionStatus(req, res) {
    try {
      const userId = req.user.id;
      logger.info(`Verificando status de conexão Meta Business para usuário ${userId}`);
      const status = await metaBusinessAuthService.getConnectionStatus(userId);
      
      // Se houver tokens expirados, incluir uma flag para indicar necessidade de reautenticação
      if (status.requiresReauth) {
        logger.warn(`Tokens expirados detectados para usuário ${userId}`);  
      }
      
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
   * Revoga tokens e remove registros de contas associadas
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async disconnect(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.body; // Opcional - ID específico da conta a ser desconectada
      
      logger.info(`Solicitação para desconectar ${accountId ? 'conta específica' : 'todas as contas'} Meta Business para usuário ${userId}`);
      const result = await metaBusinessAuthService.disconnect(userId, accountId);
      
      return res.status(200).json({
        success: true,
        message: accountId ? 'Conta específica do Facebook desconectada com sucesso' : 'Integração com Facebook Ads desconectada com sucesso',
        disconnectedAccounts: result.disconnectedAccounts
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

  /**
   * Verifica a validade de um token de acesso específico
   * Útil para diagnosticar problemas com tokens expirados ou com permissões insuficientes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyToken(req, res) {
    try {
      const { accountId } = req.params;
      const userId = req.user.id;
      
      // Obter a conta específica
      const BusinessAccount = require('../models/business-account.model');
      const account = await BusinessAccount.findOne({
        where: {
          id: accountId,
          userId,
          provider: 'meta'
        }
      });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Conta de negócios não encontrada'
        });
      }
      
      // Verificar o token
      const tokenStatus = await metaBusinessAuthService.checkTokenValidity(account.accessToken);
      
      return res.status(200).json({
        success: true,
        businessId: account.businessId,
        businessName: account.businessName,
        tokenStatus
      });
    } catch (error) {
      logger.error('Erro ao verificar token Meta Business:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar token do Facebook',
        error: error.message
      });
    }
  }
  
  /**
   * Retorna as permissões necessárias para funcionalidade completa da integração
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRequiredPermissions(req, res) {
    try {
      return res.status(200).json({
        success: true,
        requiredPermissions: metaBusinessAuthService.requiredPermissions,
        description: {
          ads_management: 'Gerenciar campanhas e criar anúncios',
          ads_read: 'Ler dados de campanhas e anúncios existentes',
          business_management: 'Acessar contas de negócios e suas propriedades',
          read_insights: 'Ler métricas de desempenho e insights dos anúncios'
        }
      });
    } catch (error) {
      logger.error('Erro ao obter permissões necessárias:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter permissões necessárias',
        error: error.message
      });
    }
  }
}

module.exports = new MetaBusinessAuthController();
