import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    avatar: '',
    phone: '',
    company: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Substitua pela URL correta da sua API
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/profile`);
        // setUser(response.data);
        
        // Dados fictícios para demonstração
        setUser({
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Administrador',
          avatar: 'https://via.placeholder.com/150',
          phone: '(11) 98765-4321',
          company: 'SpeedFunnels',
          bio: 'Especialista em marketing digital com mais de 10 anos de experiência em campanhas de e-commerce e SaaS.'
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar perfil do usuário:', err);
        setError('Falha ao carregar os dados do perfil. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      // await axios.put(`${process.env.REACT_APP_API_URL}/api/user/profile`, user);
      setSuccess('Perfil atualizado com sucesso!');
      setSaving(false);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Falha ao atualizar o perfil. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    try {
      setSaving(true);
      // await axios.put(`${process.env.REACT_APP_API_URL}/api/user/password`, {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      setSuccess('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSaving(false);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError('Falha ao atualizar a senha. Por favor, verifique sua senha atual e tente novamente.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meu Perfil
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Typography variant="h5">{user.name}</Typography>
              <Typography variant="body1" color="textSecondary">
                {user.role}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          
          <Box component="form" onSubmit={handleProfileSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nome"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="phone"
                  value={user.phone || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Empresa"
                  name="company"
                  value={user.company || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da foto de perfil"
                  name="avatar"
                  value={user.avatar || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  multiline
                  rows={4}
                  value={user.bio || ''}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Atualizar Perfil'}
              </Button>
            </Box>
          </Box>
        </Paper>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Alterar Senha
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Senha Atual"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nova Senha"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirmar Nova Senha"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Atualizar Senha'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
