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
  CircularProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Facebook as FacebookIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, sub } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const Dashboard = () => {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [client, setClient] = useState('all');
  
  // Estados para armazenar dados
  const [metaAdsData, setMetaAdsData] = useState(null);
  const [gaData, setGaData] = useState(null);
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
            startDate = sub(endDate, { days: 7 });
        }
        
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        // Busca dados do Meta Ads
        const metaResponse = await axios.get('/api/analytics/meta', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados do Google Analytics
        const gaResponse = await axios.get('/api/analytics/ga', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        setMetaAdsData(metaResponse.data);
        setGaData(gaResponse.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, client]);
  
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
  
  // Dados de exemplo para gráficos (enquanto API não está pronta)
  const samplePerformanceData = [
    { name: '01/03', impressions: 12000, clicks: 800, ctr: 6.67 },
    { name: '02/03', impressions: 13500, clicks: 950, ctr: 7.04 },
    { name: '03/03', impressions: 15000, clicks: 1100, ctr: 7.33 },
    { name: '04/03', impressions: 14200, clicks: 1050, ctr: 7.39 },
    { name: '05/03', impressions: 16800, clicks: 1250, ctr: 7.44 },
    { name: '06/03', impressions: 18500, clicks: 1400, ctr: 7.57 },
    { name: '07/03', impressions: 20000, clicks: 1600, ctr: 8.00 },
  ];
  
  const sampleChannelData = [
    { name: 'Orgânico', value: 4000 },
    { name: 'Social', value: 3000 },
    { name: 'Direto', value: 2000 },
    { name: 'Referência', value: 1500 },
    { name: 'Email', value: 1000 },
    { name: 'Outro', value: 500 },
  ];
  
  const sampleDeviceData = [
    { name: 'Desktop', value: 45 },
    { name: 'Mobile', value: 50 },
    { name: 'Tablet', value: 5 },
  ];
  
  // Renderiza o conteúdo com base nas abas
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
            {/* Métricas principais */}
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Impressões" 
                value={metaAdsData?.summary?.impressions || 125600} 
                change={12.5} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Cliques" 
                value={metaAdsData?.summary?.clicks || 9560} 
                change={8.2} 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="CTR" 
                value={metaAdsData?.summary?.ctr || 7.61} 
                change={-2.3} 
                suffix="%" 
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard 
                title="Custo" 
                value={metaAdsData?.summary?.spend || 3250.42} 
                change={5.1} 
                prefix="R$ " 
              />
            </Grid>
            
            {/* Gráfico de desempenho */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Desempenho das Campanhas
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={samplePerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressões" />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#82ca9d" name="Cliques" />
                    <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#ff7300" name="CTR (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            {/* Gráficos de métricas secundárias */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Fontes de Tráfego
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sampleChannelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sampleChannelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} visitantes`, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Dispositivos
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sampleDeviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sampleDeviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 1: // Meta Ads
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FacebookIcon sx={{ mr: 1 }} color="primary" />
                  Métricas do Meta Ads
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Impressões" 
                      value={metaAdsData?.summary?.impressions || 125600} 
                      change={12.5} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Cliques" 
                      value={metaAdsData?.summary?.clicks || 9560} 
                      change={8.2} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Conversões" 
                      value={metaAdsData?.summary?.conversions || 312} 
                      change={15.8} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="ROAS" 
                      value={metaAdsData?.summary?.roas || 3.45} 
                      change={4.2} 
                      prefix="" 
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={metaAdsData?.performance || samplePerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" name="Impressões" fill="#8884d8" />
                    <Bar dataKey="clicks" name="Cliques" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 2: // Google Analytics
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AnalyticsIcon sx={{ mr: 1 }} color="primary" />
                  Métricas do Google Analytics
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Sessões" 
                      value={gaData?.summary?.sessions || 18320} 
                      change={9.5} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Usuários" 
                      value={gaData?.summary?.users || 15240} 
                      change={11.2} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Taxa de Rejeição" 
                      value={gaData?.summary?.bounceRate || 32.5} 
                      change={-4.8} 
                      suffix="%" 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MetricCard 
                      title="Duração Média" 
                      value={gaData?.summary?.avgSessionDuration || "2:15"} 
                      change={7.3} 
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={gaData?.performance || samplePerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sessions" name="Sessões" stroke="#8884d8" />
                    <Line type="monotone" dataKey="users" name="Usuários" stroke="#82ca9d" />
                  </LineChart>
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
          <Typography variant="h4" gutterBottom>
            Dashboard de Marketing
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
              <Tab label="Meta Ads" />
              <Tab label="Google Analytics" />
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

export default Dashboard;
