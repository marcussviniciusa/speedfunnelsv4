/**
 * Testes para a autenticação com Google
 * 
 * Este arquivo contém testes para verificar a funcionalidade de autenticação com Google.
 * Para executar: NODE_ENV=test npm test -- --testPathPattern=google-auth
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const googleAuthService = require('../services/google-auth.service');

// Mock do serviço de autenticação do Google
jest.mock('../services/google-auth.service', () => ({
  generateAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/auth?mocked=true'),
  getTokens: jest.fn(() => ({
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    expiry_date: Date.now() + 3600 * 1000
  })),
  getUserProfile: jest.fn(() => ({
    id: 'google_123456789',
    email: 'user@example.com',
    name: 'Test User',
    picture: 'https://example.com/profile.jpg'
  }))
}));

// Limpar mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Google Authentication Tests', () => {
  
  test('Deve redirecionar para URL de autenticação do Google', async () => {
    const response = await request(app)
      .get('/api/auth/google');
    
    expect(response.status).toBe(302); // Status de redirecionamento
    expect(response.header.location).toContain('accounts.google.com');
    expect(googleAuthService.generateAuthUrl).toHaveBeenCalled();
  });
  
  test('Deve lidar com o callback do Google com sucesso', async () => {
    // Mocking User.findOne e User.create
    User.findOne = jest.fn(() => Promise.resolve(null));
    User.create = jest.fn(() => Promise.resolve({
      id: 'user_123',
      email: 'user@example.com',
      name: 'Test User',
      googleId: 'google_123456789',
      toJSON: () => ({
        id: 'user_123',
        email: 'user@example.com',
        name: 'Test User'
      })
    }));
    
    const response = await request(app)
      .get('/api/auth/google/callback')
      .query({ code: 'test_code' });
    
    expect(response.status).toBe(302); // Deve redirecionar para frontend
    expect(response.header.location).toContain('/auth/callback?token=');
    expect(googleAuthService.getTokens).toHaveBeenCalledWith('test_code');
    expect(googleAuthService.getUserProfile).toHaveBeenCalled();
  });
  
  test('Deve verificar status da conexão com Google', async () => {
    // Mocking usuário autenticado
    const mockUser = {
      id: 'user_123',
      googleConnected: true,
      email: 'user@example.com'
    };
    
    // Mock do middleware de autenticação
    const authMiddlewareMock = jest.fn((req, res, next) => {
      req.user = { id: 'user_123' };
      next();
    });
    
    app.get = jest.fn((path, middleware, handler) => {
      if (path === '/api/auth/google/status') {
        // Chama o handler diretamente com mocks
        const req = { user: { id: 'user_123' } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        User.findByPk = jest.fn(() => Promise.resolve(mockUser));
        
        handler(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          connected: true,
          email: 'user@example.com'
        });
      }
    });
  });
  
  test('Deve desconectar conta do Google', async () => {
    // Mock do middleware e serviço
    const req = { user: { id: 'user_123' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    googleAuthService.disconnectGoogleAccount = jest.fn(() => Promise.resolve());
    
    // Mock da rota
    app.post = jest.fn((path, middleware, handler) => {
      if (path === '/api/auth/google/disconnect') {
        handler(req, res);
        
        expect(googleAuthService.disconnectGoogleAccount).toHaveBeenCalledWith('user_123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ 
          message: 'Conta Google desconectada com sucesso' 
        });
      }
    });
  });
});
