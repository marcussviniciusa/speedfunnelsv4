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
    this.baseApiUrl = 'https://graph.facebook.com/v19.0';
    this.appId = process.env.META_APP_ID;
    this.appSecret = process.env.META_APP_SECRET;
    this.redirectUri = process.env.META_REDIRECT_URI;
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
        return await this.exchangeForLongLivedToken(response.data.access_token);
      }

      throw new Error('Token de acesso não recebido do Facebook');
    } catch (error) {
      logger.error('Erro ao trocar código por token:', error);
      throw new Error(error.response?.data?.error?.message || error.message);
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

      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('Erro ao trocar por token de longa duração:', error);
      throw new Error(error.response?.data?.error?.message || error.message);
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
          fields: 'id,name'
        }
      });

      const userId = meResponse.data.id;
      const userName = meResponse.data.name;

      // Obter contas de negócios associadas ao usuário
      const businessAccountsResponse = await axios.get(
        `${this.baseApiUrl}/${userId}/businesses`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,verification_status,owner_business'
          }
        }
      );

      const businessAccounts = businessAccountsResponse.data.data || [];
      const result = {
        userId,
        userName,
        businessAccounts: []
      };

      // Para cada conta de negócios, obter contas de anúncios associadas
      for (const business of businessAccounts) {
        const adAccountsResponse = await axios.get(
          `${this.baseApiUrl}/${business.id}/owned_ad_accounts`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,name,account_status,account_id,business,currency,timezone_name'
            }
          }
        );

        const adAccounts = adAccountsResponse.data.data || [];

        result.businessAccounts.push({
          id: business.id,
          name: business.name,
          verificationStatus: business.verification_status,
          adAccounts
        });
      }

      return result;
    } catch (error) {
      logger.error('Erro ao obter informações de contas de negócios:', error);
      throw new Error(error.response?.data?.error?.message || error.message);
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
