const googleAuthService = require('../services/google-auth.service');
const authService = require('../services/auth.service');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controlador para autenticação com Google
 */
class GoogleAuthController {
  /**
   * Inicia o fluxo de autenticação com o Google
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async initiateGoogleAuth(req, res) {
    try {
      // Podemos passar um estado para validar no callback e incluir o userId
      // se o usuário já estiver autenticado e apenas quiser conectar sua conta Google
      const state = req.query.userId 
        ? jwt.sign({ userId: req.query.userId }, config.auth.jwtSecret, { expiresIn: '1h' })
        : '';
      
      // Gera URL de autenticação
      const authUrl = googleAuthService.generateAuthUrl(state);
      
      // Redireciona para a URL de autenticação
      res.redirect(authUrl);
    } catch (error) {
      logger.error(`Erro ao iniciar autenticação Google: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: 'Erro ao iniciar autenticação com Google' });
    }
  }

  /**
   * Callback recebido após autenticação no Google
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async handleGoogleCallback(req, res) {
    try {
      const { code, state } = req.query;
      
      // Verifica se temos o código de autorização
      if (!code) {
        return res.status(400).redirect(`${config.frontend.url}/auth/error?message=Código de autorização ausente`);
      }
      
      // Obtém tokens a partir do código
      const tokens = await googleAuthService.getTokens(code);
      
      // Obtém perfil do usuário
      const userProfile = await googleAuthService.getUserProfile(tokens.access_token);
      
      let userId;
      
      // Verifica se recebemos um state com userId (para vinculação de conta)
      if (state) {
        try {
          const decoded = jwt.verify(state, config.auth.jwtSecret);
          userId = decoded.userId;
        } catch (error) {
          // Ignora erro de jwt, significa que o state não é válido ou expirou
          logger.warn(`State inválido no callback Google: ${error.message}`);
        }
      }
      
      // Fluxo para usuário já autenticado que está conectando sua conta Google
      if (userId) {
        // Atualiza os tokens do usuário
        await googleAuthService.saveUserTokens(userId, tokens);
        
        // Redireciona para a página de sucesso
        return res.redirect(`${config.frontend.url}/dashboard/settings?google=connected`);
      }
      
      // Fluxo para login/registro com Google
      
      // Verifica se já existe um usuário com este email
      let user = await User.findOne({ where: { email: userProfile.email } });
      
      if (user) {
        // Usuário existe, atualiza tokens do Google
        await user.update({
          googleId: userProfile.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          googleConnected: true,
          avatar: userProfile.picture || user.avatar,
          lastLogin: new Date()
        });
      } else {
        // Cria novo usuário com os dados do Google
        user = await User.create({
          name: userProfile.name,
          email: userProfile.email,
          password: null, // Sem senha para usuários Google
          googleId: userProfile.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          googleConnected: true,
          role: 'client', // Papel padrão para novos usuários
          avatar: userProfile.picture,
          active: true
        });
      }
      
      // Gera tokens JWT para o usuário
      const jwtTokens = await authService.generateTokens(user);
      
      // Configura o cookie de refresh token
      res.cookie('refreshToken', jwtTokens.refreshToken, {
        httpOnly: true,
        secure: config.server.env === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
      });
      
      // Redireciona para o frontend com token
      return res.redirect(`${config.frontend.url}/auth/callback?token=${jwtTokens.accessToken}`);
    } catch (error) {
      logger.error(`Erro no callback Google: ${error.message}`, { stack: error.stack });
      res.redirect(`${config.frontend.url}/auth/error?message=Erro na autenticação`);
    }
  }

  /**
   * Verifica se o usuário está conectado ao Google
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async checkGoogleConnection(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.status(200).json({
        connected: !!user.googleConnected,
        email: user.email
      });
    } catch (error) {
      logger.error(`Erro ao verificar conexão Google: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: 'Erro ao verificar status da conexão Google' });
    }
  }

  /**
   * Desconecta a conta do Google
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async disconnectGoogle(req, res) {
    try {
      const userId = req.user.id;
      
      // Desconecta a conta do Google
      await googleAuthService.disconnectGoogleAccount(userId);
      
      res.status(200).json({ message: 'Conta Google desconectada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao desconectar conta Google: ${error.message}`, { stack: error.stack });
      res.status(500).json({ message: 'Erro ao desconectar conta Google' });
    }
  }
}

module.exports = new GoogleAuthController();
