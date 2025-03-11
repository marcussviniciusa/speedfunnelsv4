import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
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

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    status: 'Ativo'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchClientDetails = async () => {
      // Se for um novo cliente (id === 'new'), não precisamos buscar dados
      if (id === 'new') {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Substitua pela URL correta da sua API
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${id}`);
        setClient(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar detalhes do cliente:', err);
        setError('Falha ao carregar os detalhes do cliente. Por favor, tente novamente.');
        setLoading(false);
        
        // Dados fictícios para demonstração caso a API não esteja disponível
        setClient({
          id: parseInt(id),
          name: 'Cliente Exemplo',
          email: 'cliente@exemplo.com',
          phone: '(11) 98765-4321',
          company: 'Empresa Exemplo Ltda',
          address: 'Av. Paulista, 1000 - São Paulo, SP',
          notes: 'Notas sobre o cliente',
          status: 'Ativo'
        });
      }
    };
    
    fetchClientDetails();
  }, [id]);

  const handleChange = (e) => {
    setClient({
      ...client,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (id === 'new') {
        // Criar novo cliente
        await axios.post(`${process.env.REACT_APP_API_URL}/api/clients`, client);
        setSuccess('Cliente criado com sucesso!');
      } else {
        // Atualizar cliente existente
        await axios.put(`${process.env.REACT_APP_API_URL}/api/clients/${id}`, client);
        setSuccess('Cliente atualizado com sucesso!');
      }
      
      setSaving(false);
      
      // Redirecionar para a lista de clientes após alguns segundos
      setTimeout(() => {
        navigate('/clients');
      }, 2000);
      
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Falha ao salvar os dados do cliente. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
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
          {id === 'new' ? 'Novo Cliente' : 'Detalhes do Cliente'}
        </Typography>

        <Paper elevation={3} sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="client tabs">
              <Tab label="Informações Básicas" />
              <Tab label="Analytics" />
              <Tab label="Configurações" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Nome"
                    name="name"
                    value={client.name}
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
                    value={client.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    name="phone"
                    value={client.phone || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Empresa"
                    name="company"
                    value={client.company || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Endereço"
                    name="address"
                    value={client.address || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    name="notes"
                    multiline
                    rows={4}
                    value={client.notes || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    value={client.status || 'Ativo'}
                    onChange={handleChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Pendente">Pendente</option>
                  </TextField>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  onClick={handleCancel}
                  sx={{ mr: 1 }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Dados de Analytics
            </Typography>
            <Typography paragraph>
              Esta seção mostrará dados de analytics específicos para este cliente.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/analytics/${id}`)}
            >
              Ver Dashboard Completo
            </Button>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Configurações do Cliente
            </Typography>
            <Typography paragraph>
              Configurações adicionais para este cliente serão exibidas aqui.
            </Typography>
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

export default ClientDetails;
