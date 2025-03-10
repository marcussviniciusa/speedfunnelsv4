const { google } = require('googleapis');
const config = require('../config/config');
const logger = require('../utils/logger');
const User = require('../models/user.model');

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.googleAuth.clientId,
      config.googleAuth.clientSecret,
      config.googleAuth.redirectUrl
    );

    // Definindo escopos - precisamos de acesso ao perfil e ao Google Analytics
    this.scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/analytics.readonly'
    ];
  }

  /**
   * Gera URL para autenticação do usuário com o Google
   * @param {string} state - String para validação de estado (pode conter userId, etc)
   * @returns {string} URL de autorização
   */
  generateAuthUrl(state) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Para receber refresh_token
      scope: this.scopes,
      state: state,
      prompt: 'consent' // Força o consentimento para sempre receber refresh_token
    });
  }

  /**
   * Troca o código de autorização por tokens
   * @param {string} code - Código recebido do Google
   * @returns {Promise<Object>} Tokens (access_token, refresh_token, etc)
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error(`Erro ao obter tokens do Google: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém informações do perfil do usuário
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} Dados do perfil do usuário
   */
  async getUserProfile(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2'
      });
      
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      logger.error(`Erro ao obter perfil do usuário do Google: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Salva ou atualiza os tokens do Google para um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} tokens - Tokens de acesso e atualização
   * @returns {Promise<Object>} Usuário atualizado
   */
  async saveUserTokens(userId, tokens) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Atualiza os tokens do usuário
      await user.update({
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || user.googleRefreshToken, // Mantém o refresh token existente se não tiver um novo
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleConnected: true
      });
      
      return user;
    } catch (error) {
      logger.error(`Erro ao salvar tokens do usuário: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Atualiza o token de acesso quando expirado
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Novos tokens
   */
  async refreshAccessToken(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.googleRefreshToken) {
        throw new Error('Usuário não encontrado ou não conectado ao Google');
      }
      
      // Configura as credenciais com o refresh token
      this.oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken
      });
      
      // Solicita novo token de acesso
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Atualiza o token no banco de dados
      await user.update({
        googleAccessToken: credentials.access_token,
        googleTokenExpiry: new Date(credentials.expiry_date)
      });
      
      return credentials;
    } catch (error) {
      logger.error(`Erro ao atualizar token de acesso: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Verifica se o token de acesso está expirado e atualiza se necessário
   * @param {string} userId - ID do usuário
   * @returns {Promise<string>} Token de acesso válido
   */
  async getValidAccessToken(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.googleConnected) {
        throw new Error('Usuário não conectado ao Google');
      }
      
      // Verifica se o token expirou
      const tokenExpiry = user.googleTokenExpiry ? new Date(user.googleTokenExpiry) : null;
      const isExpired = !tokenExpiry || tokenExpiry <= new Date();
      
      // Se expirou, atualiza usando o refresh token
      if (isExpired) {
        const newTokens = await this.refreshAccessToken(userId);
        return newTokens.access_token;
      }
      
      return user.googleAccessToken;
    } catch (error) {
      logger.error(`Erro ao obter token válido: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Desconecta a conta do Google
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async disconnectGoogleAccount(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Remove as informações do Google
      await user.update({
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleConnected: false
      });
      
      return user;
    } catch (error) {
      logger.error(`Erro ao desconectar conta do Google: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }
}

module.exports = new GoogleAuthService();
