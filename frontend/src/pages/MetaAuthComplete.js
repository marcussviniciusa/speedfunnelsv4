import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import api from '../services/api';

/**
 * Página de callback para concluir o processo de autenticação do Meta Business
 * Esta página recebe o parâmetro 'state' e 'code' da URL e os utiliza para trocar o código de autorização
 * por um token de acesso através da API do backend
 */
const MetaAuthComplete = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Extrair os parâmetros da URL
        const params = new URLSearchParams(location.search);
        const state = params.get('state');
        const code = params.get('code');
        const error_reason = params.get('error_reason');
        
        if (error_reason) {
          setError(`Autenticação cancelada: ${error_reason}`);
          setLoading(false);
          return;
        }
        
        if (!state || !code) {
          setError('Parâmetros de autenticação ausentes. Não foi possível completar a autenticação.');
          setLoading(false);
          return;
        }

        // Enviar o código e estado para o backend para completar a autenticação
        const authResponse = await api.post('/api/meta-business-auth/complete', { state, code });
        
        if (authResponse.data.success) {
          setSuccess(true);
          
          // Redirecionar para a página de configurações após um breve atraso
          setTimeout(() => {
            navigate('/settings');
          }, 3000);
        } else {
          setError(authResponse.data.message || 'Não foi possível completar a autenticação.');
        }
      } catch (err) {
        console.error('Erro ao completar autenticação:', err);
        setError(err.response?.data?.message || 'Erro ao processar autenticação com Meta Business.');
      } finally {
        setLoading(false);
      }
    };

    completeAuth();
  }, [location, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 600,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Autenticação com Facebook Ads
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Processando autenticação...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mt: 2 }}>
              Autenticação completada com sucesso!
            </Alert>
            <Typography variant="body2" sx={{ mt: 3, fontStyle: 'italic' }}>
              Você será redirecionado para a página de configurações em alguns segundos...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MetaAuthComplete;
