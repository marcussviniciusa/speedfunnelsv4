const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Serviço para autenticação de usuários
 */
class AuthService {
  /**
   * Autentica o usuário com email e senha
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Usuário autenticado e tokens
   */
  async authenticate(email, password) {
    try {
      // Busca o usuário pelo email
      const user = await User.findOne({ where: { email } });
      
      // Verifica se o usuário existe
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verifica se o usuário está ativo
      if (!user.active) {
        throw new Error('Usuário desativado');
      }
      
      // Verifica se o usuário foi criado via Google (não tem senha)
      if (!user.password) {
        throw new Error('Faça login com o Google');
      }
      
      // Verifica a senha
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        throw new Error('Credenciais inválidas');
      }
      
      // Atualiza a data do último login
      await user.update({ lastLogin: new Date() });
      
      // Gera tokens JWT
      const tokens = await this.generateTokens(user);
      
      return {
        user: this._sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error(`Erro na autenticação: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Registra um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado e tokens
   */
  async register(userData) {
    try {
      // Verifica se o email já existe
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }
      
      // Criptografa a senha
      const salt = await bcrypt.genSalt(config.auth.saltRounds);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Cria o usuário
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      
      // Gera tokens JWT
      const tokens = await this.generateTokens(user);
      
      return {
        user: this._sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error(`Erro no registro: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Gera tokens JWT para o usuário
   * @param {Object} user - Objeto do usuário
   * @returns {Promise<Object>} Access token e refresh token
   */
  async generateTokens(user) {
    try {
      // Payload do token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      // Gera access token
      const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiration
      });
      
      // Gera refresh token (validade mais longa)
      const refreshToken = jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: '30d'
      });
      
      return { accessToken, refreshToken };
    } catch (error) {
      logger.error(`Erro ao gerar tokens: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Novo access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verifica e decodifica o refresh token
      const decoded = jwt.verify(refreshToken, config.auth.jwtSecret);
      
      // Busca o usuário
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.active) {
        throw new Error('Usuário não encontrado ou inativo');
      }
      
      // Gera novo access token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiration
      });
      
      return { accessToken };
    } catch (error) {
      logger.error(`Erro ao atualizar token: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Verifica token JWT
   * @param {string} token - Token a ser verificado
   * @returns {Promise<Object>} Payload decodificado
   */
  async verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      logger.error(`Erro ao verificar token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove dados sensíveis do objeto do usuário
   * @param {Object} user - Objeto do usuário
   * @returns {Object} Usuário sem dados sensíveis
   * @private
   */
  _sanitizeUser(user) {
    const userData = user.toJSON();
    delete userData.password;
    delete userData.googleAccessToken;
    delete userData.googleRefreshToken;
    
    return userData;
  }
}

module.exports = new AuthService();
