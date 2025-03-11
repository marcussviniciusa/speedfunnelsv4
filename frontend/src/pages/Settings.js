import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';
import MetaBusinessLogin from '../components/MetaBusinessLogin';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [generalSettings, setGeneralSettings] = useState({
    companyName: '',
    email: '',
    logoUrl: '',
    theme: 'light',
    language: 'pt-BR'
  });
  
  const [apiSettings, setApiSettings] = useState({
    googleAnalyticsEnabled: true,
    googleClientId: '',
    googleClientSecret: '',
    googleRedirectUrl: '',
    metaAdsEnabled: true,
    metaAccessToken: '',
    metaAdAccountId: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    reportFrequency: 'weekly',
    alertThreshold: 10
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Substitua pela URL correta da sua API
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings`);
        // setGeneralSettings(response.data.general);
        // setApiSettings(response.data.api);
        // setNotificationSettings(response.data.notifications);
        
        // Dados fictícios para demonstração
        setGeneralSettings({
          companyName: 'SpeedFunnels',
          email: 'contato@speedfunnels.com',
          logoUrl: '/logo.png',
          theme: 'light',
          language: 'pt-BR'
        });
        
        setApiSettings({
          googleAnalyticsEnabled: true,
          googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
          googleClientSecret: '************',
          googleRedirectUrl: `${window.location.origin}/auth/google/callback`,
          metaAdsEnabled: true,
          metaAccessToken: '************',
          metaAdAccountId: process.env.REACT_APP_META_AD_ACCOUNT_ID || ''
        });
        
        setNotificationSettings({
          emailNotifications: true,
          pushNotifications: false,
          reportFrequency: 'weekly',
          alertThreshold: 10
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar configurações:', err);
        setError('Falha ao carregar as configurações. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleGeneralChange = (e) => {
    const { name, value, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: name === 'theme' ? (checked ? 'dark' : 'light') : value
    });
  };
  
  const handleApiChange = (e) => {
    const { name, value, checked } = e.target;
    setApiSettings({
      ...apiSettings,
      [name]: e.target.type === 'checkbox' ? checked : value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, value, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: e.target.type === 'checkbox' ? checked : value
    });
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // await axios.post(`${process.env.REACT_APP_API_URL}/api/settings/general`, generalSettings);
      setSuccess('Configurações gerais salvas com sucesso!');
      setSaving(false);
    } catch (err) {
      console.error('Erro ao salvar configurações gerais:', err);
      setError('Falha ao salvar as configurações gerais. Por favor, tente novamente.');
      setSaving(false);
    }
  };
  
  const handleSaveApi = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // await axios.post(`${process.env.REACT_APP_API_URL}/api/settings/api`, apiSettings);
      setSuccess('Configurações de API salvas com sucesso!');
      setSaving(false);
    } catch (err) {
      console.error('Erro ao salvar configurações de API:', err);
      setError('Falha ao salvar as configurações de API. Por favor, tente novamente.');
      setSaving(false);
    }
  };
  
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // await axios.post(`${process.env.REACT_APP_API_URL}/api/settings/notifications`, notificationSettings);
      setSuccess('Configurações de notificações salvas com sucesso!');
      setSaving(false);
    } catch (err) {
      console.error('Erro ao salvar configurações de notificações:', err);
      setError('Falha ao salvar as configurações de notificações. Por favor, tente novamente.');
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
          Configurações
        </Typography>

        <Paper elevation={3} sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab label="Geral" />
              <Tab label="Integrações API" />
              <Tab label="Notificações" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleSaveGeneral} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome da Empresa"
                    name="companyName"
                    value={generalSettings.companyName}
                    onChange={handleGeneralChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email de Contato"
                    name="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={handleGeneralChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL do Logo"
                    name="logoUrl"
                    value={generalSettings.logoUrl}
                    onChange={handleGeneralChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={generalSettings.theme === 'dark'}
                        onChange={handleGeneralChange}
                        name="theme"
                      />
                    }
                    label="Tema Escuro"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Idioma"
                    name="language"
                    value={generalSettings.language}
                    onChange={handleGeneralChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </TextField>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleSaveApi} noValidate>
              <Typography variant="h6" gutterBottom>
                Google Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={apiSettings.googleAnalyticsEnabled}
                        onChange={handleApiChange}
                        name="googleAnalyticsEnabled"
                      />
                    }
                    label="Habilitar integração com Google Analytics"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Google Client ID"
                    name="googleClientId"
                    value={apiSettings.googleClientId}
                    onChange={handleApiChange}
                    disabled={!apiSettings.googleAnalyticsEnabled}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Google Client Secret"
                    name="googleClientSecret"
                    type="password"
                    value={apiSettings.googleClientSecret}
                    onChange={handleApiChange}
                    disabled={!apiSettings.googleAnalyticsEnabled}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL de Redirecionamento"
                    name="googleRedirectUrl"
                    value={apiSettings.googleRedirectUrl}
                    onChange={handleApiChange}
                    disabled={!apiSettings.googleAnalyticsEnabled}
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" gutterBottom>
                Facebook Ads
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" gutterBottom>
                    Use o Login do Facebook para Empresas para conectar sua conta do Facebook Ads e obter dados de campanhas e métricas automaticamente.
                  </Typography>
                  <MetaBusinessLogin
                    onLoginSuccess={(data) => {
                      setSuccess('Conectado com sucesso ao Facebook Ads!');
                      if (data && data.businessAccounts && data.businessAccounts.length > 0) {
                        const adAccounts = [];
                        data.businessAccounts.forEach(business => {
                          if (business.adAccounts && business.adAccounts.length > 0) {
                            adAccounts.push(...business.adAccounts);
                          }
                        });
                        
                        if (adAccounts.length > 0) {
                          setApiSettings({
                            ...apiSettings,
                            metaAdAccountId: adAccounts[0].id
                          });
                        }
                      }
                    }}
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
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box component="form" onSubmit={handleSaveNotifications} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange}
                        name="emailNotifications"
                      />
                    }
                    label="Notificações por Email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onChange={handleNotificationChange}
                        name="pushNotifications"
                      />
                    }
                    label="Notificações Push"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Frequência de Relatórios"
                    name="reportFrequency"
                    value={notificationSettings.reportFrequency}
                    onChange={handleNotificationChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="never">Nunca</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Limite de Alerta (%)"
                    name="alertThreshold"
                    type="number"
                    value={notificationSettings.alertThreshold}
                    onChange={handleNotificationChange}
                    InputProps={{
                      inputProps: { min: 0, max: 100 }
                    }}
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
                  {saving ? 'Salvando...' : 'Salvar Configurações de Notificações'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
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

export default Settings;
