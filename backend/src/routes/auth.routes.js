const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const googleAuthController = require('../controllers/google-auth.controller');
const { validateRequest } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

const registerValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('role').isIn(['admin', 'manager', 'client']).withMessage('Perfil inválido')
];

// Rotas de autenticação padrão
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.get('/me', authenticate, authController.getProfile);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

// Rotas de autenticação com Google
router.get('/google', googleAuthController.initiateGoogleAuth);
router.get('/google/callback', googleAuthController.handleGoogleCallback);
router.post('/google/disconnect', authenticate, googleAuthController.disconnectGoogle);
router.get('/google/status', authenticate, googleAuthController.checkGoogleConnection);

module.exports = router;
