import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        // Substitua pela URL correta da sua API
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`);
        setClients(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        setError('Falha ao carregar a lista de clientes. Por favor, tente novamente.');
        setLoading(false);
        setShowAlert(true);
        
        // Dados fictícios para demonstração caso a API não esteja disponível
        setClients([
          { id: 1, name: 'Cliente Exemplo 1', email: 'cliente1@exemplo.com', status: 'Ativo' },
          { id: 2, name: 'Cliente Exemplo 2', email: 'cliente2@exemplo.com', status: 'Inativo' },
          { id: 3, name: 'Cliente Exemplo 3', email: 'cliente3@exemplo.com', status: 'Ativo' }
        ]);
      }
    };
    
    fetchClients();
  }, []);

  const handleAddClient = () => {
    navigate('/clients/new');
  };

  const handleEditClient = (id) => {
    navigate(`/clients/edit/${id}`);
  };

  const handleViewAnalytics = (id) => {
    navigate(`/analytics/${id}`);
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Lista de Clientes
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddClient}
          >
            Adicionar Cliente
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.status}</TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          onClick={() => handleEditClient(client.id)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small" 
                          color="secondary"
                          onClick={() => handleViewAnalytics(client.id)}
                        >
                          Analytics
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={() => setShowAlert(false)}
      >
        <Alert onClose={() => setShowAlert(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClientList;
