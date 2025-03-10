import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Public as PublicIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, sub } from 'date-fns';
import axios from 'axios';

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Componente de métrica única
const MetricCard = ({ title, value, change, prefix = '', suffix = '' }) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="metric-card">
      <CardContent>
        <Typography className="metric-title" gutterBottom>
          {title}
        </Typography>
        <Typography className="metric-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
        </Typography>
        <div className={`metric-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
          {isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {isPositive ? '+' : ''}{change}%
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
};

const GoogleAnalytics = () => {
  const [period, setPeriod] = useState('30d');
  const [client, setClient] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para armazenar dados
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [devices, setDevices] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [geography, setGeography] = useState([]);
  const [clientList, setClientList] = useState([]);
  
  // Busca a lista de clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('/api/clients');
        setClientList(response.data);
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
      }
    };
    
    fetchClients();
  }, []);
  
  // Busca dados com base no período e cliente selecionados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Define datas com base no período selecionado
        const endDate = new Date();
        let startDate;
        
        switch (period) {
          case '7d':
            startDate = sub(endDate, { days: 7 });
            break;
          case '30d':
            startDate = sub(endDate, { days: 30 });
            break;
          case '90d':
            startDate = sub(endDate, { days: 90 });
            break;
          default:
            startDate = sub(endDate, { days: 30 });
        }
        
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        // Busca dados resumidos
        const summaryResponse = await axios.get('/api/analytics/ga/summary', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados de desempenho diário
        const performanceResponse = await axios.get('/api/analytics/ga/performance', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados de dispositivos
        const devicesResponse = await axios.get('/api/analytics/ga/devices', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados de tráfego
        const trafficResponse = await axios.get('/api/analytics/ga/traffic', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados geográficos
        const geoResponse = await axios.get('/api/analytics/ga/geography', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        setSummary(summaryResponse.data);
        setPerformance(performanceResponse.data);
        setDevices(devicesResponse.data);
        setTraffic(trafficResponse.data);
        setGeography(geoResponse.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
        
        // Carrega dados de exemplo para desenvolvimento
        loadSampleData();
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, client]);
  
  // Carrega dados de exemplo para desenvolvimento
  const loadSampleData = () => {
    // Dados resumidos
    setSummary({
      sessions: 28540,
      users: 22120,
      newUsers: 18245,
      sessionsPerUser: 1.29,
      pageviews: 68320,
      pagesPerSession: 2.39,
      avgSessionDuration: 145, // em segundos
      bounceRate: 42.5,
      goalCompletions: 680,
      goalConversionRate: 2.38,
      sessionsChange: 15.2,
      usersChange: 12.8,
      newUsersChange: 10.5,
      sessionsPerUserChange: 2.1,
      pageviewsChange: 18.3,
      pagesPerSessionChange: 2.7,
      avgSessionDurationChange: 5.4,
      bounceRateChange: -3.8,
      goalCompletionsChange: 22.5,
      goalConversionRateChange: 6.2
    });
    
    // Dados de desempenho diário
    const samplePerformance = [];
    const startDate = sub(new Date(), { days: 30 });
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      samplePerformance.push({
        date: format(date, 'dd/MM'),
        sessions: Math.floor(Math.random() * 1500) + 500,
        users: Math.floor(Math.random() * 1200) + 400,
        pageviews: Math.floor(Math.random() * 3000) + 1000,
        goalCompletions: Math.floor(Math.random() * 30) + 5
      });
    }
    
    setPerformance(samplePerformance);
    
    // Dados de dispositivos
    setDevices([
      { name: 'Desktop', value: 42 },
      { name: 'Mobile', value: 51 },
      { name: 'Tablet', value: 7 }
    ]);
    
    // Dados de tráfego (fontes)
    setTraffic([
      { name: 'Orgânico', value: 32 },
      { name: 'Direto', value: 18 },
      { name: 'Social', value: 22 },
      { name: 'Referência', value: 12 },
      { name: 'Email', value: 10 },
      { name: 'Outros', value: 6 }
    ]);
    
    // Dados geográficos
    setGeography([
      { country: 'Brasil', value: 78 },
      { country: 'Estados Unidos', value: 8 },
      { country: 'Portugal', value: 5 },
      { country: 'México', value: 3 },
      { country: 'Argentina', value: 2 },
      { country: 'Outros', value: 4 }
    ]);
  };
  
  // Alterna entre abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Altera o período
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };
  
  // Altera o cliente
  const handleClientChange = (event) => {
    setClient(event.target.value);
  };
  
  // Formata a duração em segundos para formato legível
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Renderiza o conteúdo com base na aba selecionada
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }
    
    switch (tabValue) {
      case 0: // Visão geral
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Desempenho do Site
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={performance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sessions" name="Sessões" stroke="#8884d8" />
                    <Line yAxisId="left" type="monotone" dataKey="users" name="Usuários" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="goalCompletions" name="Conversões" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Sessões" 
                value={summary?.sessions || 0} 
                change={summary?.sessionsChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Usuários" 
                value={summary?.users || 0} 
                change={summary?.usersChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Novos Usuários" 
                value={summary?.newUsers || 0} 
                change={summary?.newUsersChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Sessões por Usuário" 
                value={summary?.sessionsPerUser || 0} 
                change={summary?.sessionsPerUserChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Visualizações de Página" 
                value={summary?.pageviews || 0} 
                change={summary?.pageviewsChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Páginas por Sessão" 
                value={summary?.pagesPerSession || 0} 
                change={summary?.pagesPerSessionChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Duração Média da Sessão" 
                value={summary?.avgSessionDuration ? formatDuration(summary.avgSessionDuration) : '0:00'} 
                change={summary?.avgSessionDurationChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Taxa de Rejeição" 
                value={summary?.bounceRate || 0} 
                change={summary?.bounceRateChange || 0} 
                suffix="%" 
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Dispositivos
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={devices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Grid container spacing={2} justifyContent="center">
                    <Grid item>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ComputerIcon sx={{ color: COLORS[0], mr: 1 }} />
                        <Typography variant="body2">Desktop</Typography>
                      </Box>
                    </Grid>
                    <Grid item>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SmartphoneIcon sx={{ color: COLORS[1], mr: 1 }} />
                        <Typography variant="body2">Mobile</Typography>
                      </Box>
                    </Grid>
                    <Grid item>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TabletIcon sx={{ color: COLORS[2], mr: 1 }} />
                        <Typography variant="body2">Tablet</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Fontes de Tráfego
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={traffic}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {traffic.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 1: // Comportamento
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Visualizações de Página
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={performance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="pageviews" name="Visualizações de Página" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Métricas de Engajamento
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ShowChartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Duração Média da Sessão" 
                        secondary={summary?.avgSessionDuration ? formatDuration(summary.avgSessionDuration) : '0:00'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ShowChartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Páginas por Sessão" 
                        secondary={summary?.pagesPerSession || 0} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ShowChartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Taxa de Rejeição" 
                        secondary={`${summary?.bounceRate || 0}%`} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversões
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Total de Conversões: <strong>{summary?.goalCompletions || 0}</strong>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Taxa de Conversão: <strong>{summary?.goalConversionRate || 0}%</strong>
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    A taxa de conversão teve uma variação de {
                      summary?.goalConversionRateChange >= 0 ? 
                      <span className="change-positive">+{summary?.goalConversionRateChange}%</span> : 
                      <span className="change-negative">{summary?.goalConversionRateChange}%</span>
                    } em relação ao período anterior.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
        
      case 2: // Geografia
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PublicIcon sx={{ mr: 1 }} color="primary" />
                  Distribuição Geográfica
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={geography}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={150} />
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                    <Legend />
                    <Bar dataKey="value" name="Usuários (%)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1 }} />
            Análise do Google Analytics
          </Typography>
        </Grid>
        
        {/* Filtros */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="period-select-label">Período</InputLabel>
                  <Select
                    labelId="period-select-label"
                    id="period-select"
                    value={period}
                    label="Período"
                    onChange={handlePeriodChange}
                  >
                    <MenuItem value="7d">Últimos 7 dias</MenuItem>
                    <MenuItem value="30d">Últimos 30 dias</MenuItem>
                    <MenuItem value="90d">Últimos 90 dias</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="client-select-label">Cliente</InputLabel>
                  <Select
                    labelId="client-select-label"
                    id="client-select"
                    value={client}
                    label="Cliente"
                    onChange={handleClientChange}
                  >
                    <MenuItem value="all">Todos os Clientes</MenuItem>
                    {clientList.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Abas */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Visão Geral" />
              <Tab label="Comportamento" />
              <Tab label="Geografia" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {renderContent()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoogleAnalytics;
