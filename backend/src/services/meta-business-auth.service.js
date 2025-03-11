const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const BusinessAccount = require('../models/business-account.model');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Serviço para autenticação e integração com o Login do Facebook para Empresas
 */
class MetaBusinessAuthService {
  constructor() {
    // Atualização para a versão mais recente da API do Meta
    this.baseApiUrl = 'https://graph.facebook.com/v22.0';
    this.appId = process.env.META_APP_ID;
    this.appSecret = process.env.META_APP_SECRET;
    this.redirectUri = process.env.META_REDIRECT_URI;
    
    // Lista de permissões necessárias para integração completa
    this.requiredPermissions = [
      'ads_management',
      'ads_read', 
      'business_management',
      'read_insights'
    ];
  }

  /**
   * Gera um estado de autenticação único e o associa ao usuário no Redis
   * @param {string} userId - ID do usuário
   * @returns {Promise<string>} - Estado de autenticação gerado
   */
  async generateAuthState(userId) {
    const state = crypto.randomBytes(32).toString('hex');
    
    // Armazenar no Redis com expiração de 10 minutos
    await redisClient.set(`meta_auth_state:${state}`, userId, 'EX', 600);
    
    return state;
  }

  /**
   * Troca um código de autorização por um token de acesso
   * @param {string} code - Código de autorização
   * @returns {Promise<Object>} - Resposta com tokens de acesso e informações de expiração
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.get(`${this.baseApiUrl}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });

      // Se o token for de curta duração, troque por um de longa duração
      if (response.data.access_token) {
        const tokenData = await this.exchangeForLongLivedToken(response.data.access_token);
        
        // Verificar as permissões concedidas
        await this.verifyPermissions(tokenData.accessToken);
        
        return tokenData;
      }

      throw new Error('Token de acesso não recebido do Facebook');
    } catch (error) {
      if (error.response?.data?.error?.code === 190) {
        logger.error('Token inválido ou expirado:', error.response.data.error);
        throw new Error('Token do Facebook inválido ou expirado. Por favor, tente autenticar novamente.');
      } else if (error.response?.data?.error?.code === 4) {
        logger.error('Limite de requisição excedido:', error.response.data.error);
        throw new Error('Limite de requisições ao Facebook excedido. Por favor, tente novamente mais tarde.');
      } else {
        logger.error('Erro ao trocar código por token:', error);
        throw new Error(error.response?.data?.error?.message || error.message);
      }
    }
  }

  /**
   * Troca um token de curta duração por um de longa duração
   * @param {string} shortLivedToken - Token de acesso de curta duração
   * @returns {Promise<Object>} - Resposta com token de longa duração e informações de expiração
   */
  async exchangeForLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.baseApiUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken
        }
      });

      // Registrar a expiração para notificações futuras
      const expiresAt = new Date(Date.now() + (response.data.expires_in * 1000));
      logger.info(`Token de longa duração obtido, expira em: ${expiresAt.toISOString()}`);

      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('Erro ao trocar por token de longa duração:', error);
      
      // Melhor tratamento de erros específicos do Facebook
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        if (fbError.code === 190) {
          throw new Error('Token inválido ou expirado. Por favor, tente autenticar novamente.');
        } else if (fbError.code === 10) {
          throw new Error('Erro de permissão. Verifique se as permissões necessárias foram concedidas.');
        }
      }
      
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  /**
   * Verifica se o token tem as permissões necessárias
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<boolean>} - Retorna true se todas as permissões necessárias estão presentes
   */
  async verifyPermissions(accessToken) {
    try {
      const response = await axios.get(`${this.baseApiUrl}/me/permissions`, {
        params: {
          access_token: accessToken
        }
      });

      const grantedPermissions = response.data.data || [];
      const permissionMap = {};
      
      // Criar um mapa das permissões concedidas e seus status
      grantedPermissions.forEach(perm => {
        permissionMap[perm.permission] = perm.status === 'granted';
      });
      
      // Verificar se todas as permissões necessárias foram concedidas
      const missingPermissions = this.requiredPermissions.filter(
        perm => !permissionMap[perm]
      );
      
      if (missingPermissions.length > 0) {
        logger.warn('Permissões necessárias não concedidas:', missingPermissions);
        throw new Error(`Permissões necessárias não concedidas: ${missingPermissions.join(', ')}. Por favor, autorize todas as permissões solicitadas.`);
      }
      
      return true;
    } catch (error) {
      if (error.message.includes('Permissões necessárias não concedidas')) {
        throw error; // Re-throw nosso erro customizado
      }
      logger.error('Erro ao verificar permissões:', error);
      throw new Error('Erro ao verificar permissões do token. ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Obtém informações sobre as contas de negócios associadas ao token
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} - Informações sobre contas de negócios e contas de anúncios
   */
  async getBusinessAccounts(accessToken) {
    try {
      // Obter ID do usuário do Facebook
      const meResponse = await axios.get(`${this.baseApiUrl}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email'
        }
      });

      const userId = meResponse.data.id;
      const userName = meResponse.data.name;
      const userEmail = meResponse.data.email;

      // Obter contas de negócios associadas ao usuário
      const businessAccountsResponse = await axios.get(
        `${this.baseApiUrl}/${userId}/businesses`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,verification_status,owner_business,created_time,primary_page'
          }
        }
      );

      const businessAccounts = businessAccountsResponse.data.data || [];
      const result = {
        userId,
        userName,
        userEmail,
        businessAccounts: []
      };

      // Para cada conta de negócios, obter contas de anúncios associadas
      for (const business of businessAccounts) {
        const adAccountsResponse = await axios.get(
          `${this.baseApiUrl}/${business.id}/owned_ad_accounts`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,name,account_status,account_id,business,currency,timezone_name,amount_spent,balance,insights.date_preset(LAST_30D){spend}'
            }
          }
        );

        const adAccounts = adAccountsResponse.data.data || [];

        // Obter mais detalhes sobre a conta de negócios
        const businessDetails = await axios.get(
          `${this.baseApiUrl}/${business.id}`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,name,verification_status,created_time,is_disabled,link'
            }
          }
        );

        result.businessAccounts.push({
          id: business.id,
          name: business.name,
          verificationStatus: business.verification_status,
          createdTime: businessDetails.data.created_time,
          isDisabled: businessDetails.data.is_disabled || false,
          link: businessDetails.data.link,
          primaryPage: business.primary_page,
          adAccounts
        });
      }

      return result;
    } catch (error) {
      logger.error('Erro ao obter informações de contas de negócios:', error);
      
      // Identificar diferentes tipos de erros do Facebook
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        if (fbError.code === 190) {
          throw new Error('O token de acesso expirou ou é inválido. Por favor, reconecte sua conta Facebook.');
        } else if (fbError.code === 10 || fbError.code === 200) {
          throw new Error('Erro de permissão. Por favor, reconecte sua conta com todas as permissões necessárias.');
        } else if (fbError.code === 4) {
          throw new Error('Limite de requisições da API do Facebook excedido. Por favor, tente novamente mais tarde.');
        }
      }
      
      throw new Error('Erro ao obter informações das contas de negócios: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Salva as informações de token e contas de negócios para o usuário
   * @param {string} userId - ID do usuário
   * @param {Object} tokenData - Dados do token de acesso
   * @param {Object} businessData - Dados das contas de negócios e contas de anúncios
   * @returns {Promise<void>}
   */
  async saveUserToken(userId, tokenData, businessData) {
    try {
      // Calcular data de expiração
      const expiresAt = tokenData.expiresIn
        ? new Date(Date.now() + tokenData.expiresIn * 1000)
        : null;

      // Para cada conta de negócios, criar ou atualizar um registro
      for (const business of businessData.businessAccounts) {
        const existingAccount = await BusinessAccount.findOne({
          where: {
            userId,
            provider: 'meta',
            businessId: business.id
          }
        });

        const metadata = {
          facebookUserId: businessData.userId,
          facebookUserName: businessData.userName,
          verificationStatus: business.verificationStatus,
          adAccounts: business.adAccounts.map(account => ({
            id: account.id,
            name: account.name,
            accountId: account.account_id,
            status: account.account_status,
            currency: account.currency,
            timezone: account.timezone_name
          }))
        };

        if (existingAccount) {
          await existingAccount.update({
            accessToken: tokenData.accessToken,
            expiresAt,
            metadata,
            lastSynced: new Date()
          });
        } else {
          await BusinessAccount.create({
            id: uuidv4(),
            userId,
            provider: 'meta',
            businessId: business.id,
            businessName: business.name,
            accessToken: tokenData.accessToken,
            expiresAt,
            metadata,
            lastSynced: new Date()
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao salvar token do usuário:', error);
      throw new Error(`Erro ao salvar informações de conexão: ${error.message}`);
    }
  }

  /**
   * Obtém o status de conexão atual com o Meta Business para o usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Status da conexão
   */
  async getConnectionStatus(userId) {
    try {
      const accounts = await BusinessAccount.findAll({
        where: {
          userId,
          provider: 'meta'
        }
      });

      if (!accounts || accounts.length === 0) {
        return {
          connected: false,
          message: 'Nenhuma conta de negócios Meta conectada'
        };
      }

      // Verificar se algum token está próximo de expirar (menos de 7 dias)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const expiringAccounts = accounts.filter(account => 
        account.expiresAt && account.expiresAt < sevenDaysFromNow
      );

      return {
        connected: true,
        businessAccounts: accounts.map(account => ({
          id: account.businessId,
          name: account.businessName,
          expiresAt: account.expiresAt,
          adAccounts: account.metadata.adAccounts || []
        })),
        warningMessage: expiringAccounts.length > 0
          ? 'Alguns tokens de acesso estão próximos de expirar. Reconecte as contas em breve.'
          : null
      };
    } catch (error) {
      logger.error('Erro ao verificar status de conexão:', error);
      throw new Error(`Erro ao verificar status de conexão: ${error.message}`);
    }
  }

  /**
   * Desconecta a integração com o Meta Business para o usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  async disconnect(userId) {
    try {
      const accounts = await BusinessAccount.findAll({
        where: {
          userId,
          provider: 'meta'
        }
      });

      // Tentar revogar tokens no Facebook antes de excluir
      for (const account of accounts) {
        try {
          await axios.delete(`${this.baseApiUrl}/me/permissions`, {
            params: {
              access_token: account.accessToken
            }
          });
        } catch (revokeError) {
          logger.warn(`Erro ao revogar token no Facebook: ${revokeError.message}`);
          // Continua mesmo se falhar - vamos remover da nossa base de qualquer forma
        }
      }

      // Remover todos os registros de contas Meta do usuário
      await BusinessAccount.destroy({
        where: {
          userId,
          provider: 'meta'
        }
      });
    } catch (error) {
      logger.error('Erro ao desconectar integração:', error);
      throw new Error(`Erro ao desconectar integração: ${error.message}`);
    }
  }

  /**
   * Obtém as contas de anúncios disponíveis para o usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} - Lista de contas de anúncios
   */
  async getAdAccounts(userId) {
    try {
      const accounts = await BusinessAccount.findAll({
        where: {
          userId,
          provider: 'meta'
        }
      });

      if (!accounts || accounts.length === 0) {
        return [];
      }

      // Extrair e combinar todas as contas de anúncios de todas as contas de negócios
      const adAccounts = [];
      for (const account of accounts) {
        if (account.metadata && account.metadata.adAccounts) {
          adAccounts.push(
            ...account.metadata.adAccounts.map(adAccount => ({
              ...adAccount,
              businessId: account.businessId,
              businessName: account.businessName
            }))
          );
        }
      }

      return adAccounts;
    } catch (error) {
      logger.error('Erro ao obter contas de anúncios:', error);
      throw new Error(`Erro ao obter contas de anúncios: ${error.message}`);
    }
  }

  /**
   * Seleciona uma conta de anúncios específica para usar
   * @param {string} adAccountId - ID da conta de anúncios
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  async selectAdAccount(adAccountId, userId) {
    try {
      // Verificar se o usuário tem acesso a essa conta de anúncios
      const accounts = await BusinessAccount.findAll({
        where: {
          userId,
          provider: 'meta'
        }
      });

      let hasAccess = false;
      let businessAccountId = null;

      for (const account of accounts) {
        if (account.metadata && account.metadata.adAccounts) {
          const found = account.metadata.adAccounts.some(
            adAccount => adAccount.id === adAccountId
          );
          if (found) {
            hasAccess = true;
            businessAccountId = account.id;
            break;
          }
        }
      }

      if (!hasAccess) {
        throw new Error('Usuário não tem acesso à conta de anúncios especificada');
      }

      // Atualizar as configurações do usuário para usar essa conta
      // Aqui poderia ser implementado para salvar a preferência no modelo User ou em UserPreferences
      
      return {
        adAccountId,
        businessAccountId
      };
    } catch (error) {
      logger.error('Erro ao selecionar conta de anúncios:', error);
      throw new Error(`Erro ao selecionar conta de anúncios: ${error.message}`);
    }
  }
}

module.exports = new MetaBusinessAuthService();
