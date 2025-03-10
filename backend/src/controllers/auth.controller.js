const authService = require('../services/auth.service');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Controlador para autenticação de usuários
 */
class AuthController {
  /**
   * Login de usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Autentica o usuário
      const { user, accessToken, refreshToken } = await authService.authenticate(email, password);
      
      // Configura o cookie de refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.server.env === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
      });
      
      // Retorna usuário e token
      res.status(200).json({
        user,
        token: accessToken
      });
    } catch (error) {
      logger.error(`Erro no login: ${error.message}`);
      
      // Mensagens de erro personalizadas
      if (error.message === 'Usuário não encontrado' || error.message === 'Credenciais inválidas') {
        return res.status(401).json({ message: 'Email ou senha incorretos' });
      }
      
      if (error.message === 'Usuário desativado') {
        return res.status(403).json({ message: 'Sua conta está desativada' });
      }
      
      if (error.message === 'Faça login com o Google') {
        return res.status(400).json({ 
          message: 'Esta conta foi registrada via Google. Por favor, faça login com o Google.',
          useGoogle: true
        });
      }
      
      return res.status(500).json({ message: 'Erro ao fazer login' });
    }
  }

  /**
   * Registro de usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async register(req, res) {
    try {
      const userData = req.body;
      
      // Registra o usuário
      const { user, accessToken, refreshToken } = await authService.register(userData);
      
      // Configura o cookie de refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.server.env === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
      });
      
      // Retorna usuário e token
      res.status(201).json({
        user,
        token: accessToken
      });
    } catch (error) {
      logger.error(`Erro no registro: ${error.message}`);
      
      if (error.message === 'Email já cadastrado') {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
      
      return res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  }

  /**
   * Obtém o perfil do usuário autenticado
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      // Busca o usuário pelo ID
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Remove dados sensíveis
      const userData = user.toJSON();
      delete userData.password;
      delete userData.googleAccessToken;
      delete userData.googleRefreshToken;
      
      // Adiciona status da conexão com Google
      userData.googleConnected = !!user.googleConnected;
      
      res.status(200).json(userData);
    } catch (error) {
      logger.error(`Erro ao obter perfil: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: 'Erro ao carregar perfil do usuário' });
    }
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async refreshToken(req, res) {
    try {
      // Obtém o refresh token dos cookies
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token não fornecido' });
      }
      
      // Renova o token de acesso
      const { accessToken } = await authService.refreshAccessToken(refreshToken);
      
      res.status(200).json({ token: accessToken });
    } catch (error) {
      logger.error(`Erro no refresh token: ${error.message}`);
      
      // Se o token for inválido ou expirado
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
  }

  /**
   * Desconecta o usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async logout(req, res) {
    try {
      // Limpa o cookie de refresh token
      res.clearCookie('refreshToken');
      
      res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      logger.error(`Erro no logout: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: 'Erro ao realizar logout' });
    }
  }
}

module.exports = new AuthController();
