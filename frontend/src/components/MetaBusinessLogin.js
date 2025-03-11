import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Alert, CircularProgress, Paper } from '@mui/material';
import metaConfig from '../config/metaConfig';
import api from '../services/api';

/**
 * Componente para autenticação com o Login do Facebook para Empresas
 * Permite que usuários autorizem o aplicativo a acessar seus dados de anúncios
 */
const MetaBusinessLogin = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState([]);
  const [warningMessage, setWarningMessage] = useState(null);

  useEffect(() => {
    // Verificar status de conexão atual
    checkConnectionStatus();
  }, []);

  // Verificar status de conexão atual com a API
  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/api/meta-business-auth/connection-status');
      setConnected(response.data.connected);
      if (response.data.connected) {
        if (response.data.businessAccounts) {
          setBusinessAccounts(response.data.businessAccounts);
        }
        if (response.data.warningMessage) {
          setWarningMessage(response.data.warningMessage);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status de conexão:', err);
    }
  };

  // Iniciar fluxo de login do Facebook Business
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Solicitar URL de autenticação ao backend
      const response = await api.get('/api/meta-business-auth/login');
      
      // Redirecionar para URL de autenticação do Facebook
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao iniciar autenticação');
      setLoading(false);
      console.error('Erro ao iniciar autenticação:', err);
    }
  };

  // Desconectar da integração do Meta
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await api.post('/api/meta-business-auth/disconnect');
      setConnected(false);
      setBusinessAccounts([]);
      setWarningMessage(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao desconectar');
      console.error('Erro ao desconectar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Integração com Facebook Ads
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : connected ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Conectado com sucesso ao Facebook Ads
          </Alert>
          
          {warningMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {warningMessage}
            </Alert>
          )}
          
          {businessAccounts.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Contas de negócios conectadas:
              </Typography>
              {businessAccounts.map(account => (
                <Box key={account.id} mb={1}>
                  <Typography variant="body2" fontWeight="bold">
                    • {account.name}
                  </Typography>
                  {account.adAccounts && account.adAccounts.length > 0 && (
                    <Box ml={2}>
                      <Typography variant="caption" color="text.secondary">
                        Contas de anúncios: {account.adAccounts.length}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleDisconnect}
            sx={{ mt: 2 }}
          >
            Desconectar
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" paragraph>
            Conecte sua conta do Facebook Ads para importar dados de campanhas e métricas automaticamente.
          </Typography>
          <Typography variant="body2" paragraph>
            Usamos o Login do Facebook para Empresas para garantir segurança e controle total sobre os dados compartilhados.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogin}
          >
            Conectar com Facebook Ads
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MetaBusinessLogin;
