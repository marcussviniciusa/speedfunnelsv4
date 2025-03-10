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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Facebook as FacebookIcon,
  Info as InfoIcon
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
  ResponsiveContainer 
} from 'recharts';
import { format, sub } from 'date-fns';
import axios from 'axios';

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

const MetaAdsAnalytics = () => {
  const [period, setPeriod] = useState('30d');
  const [client, setClient] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para armazenar dados
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [adSets, setAdSets] = useState([]);
  const [ads, setAds] = useState([]);
  const [performance, setPerformance] = useState([]);
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
        const summaryResponse = await axios.get('/api/analytics/meta/summary', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca dados de desempenho diário
        const performanceResponse = await axios.get('/api/analytics/meta/performance', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca campanhas
        const campaignsResponse = await axios.get('/api/analytics/meta/campaigns', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca conjuntos de anúncios
        const adSetsResponse = await axios.get('/api/analytics/meta/adsets', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        // Busca anúncios
        const adsResponse = await axios.get('/api/analytics/meta/ads', {
          params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            clientId: client !== 'all' ? client : undefined
          }
        });
        
        setSummary(summaryResponse.data);
        setPerformance(performanceResponse.data);
        setCampaigns(campaignsResponse.data);
        setAdSets(adSetsResponse.data);
        setAds(adsResponse.data);
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
      impressions: 543210,
      clicks: 32540,
      ctr: 5.99,
      spend: 15430.75,
      cpc: 0.47,
      conversions: 780,
      costPerConversion: 19.78,
      conversionRate: 2.40,
      roas: 3.2,
      revenue: 49378.40,
      impressionsChange: 12.3,
      clicksChange: 8.7,
      ctrChange: -3.5,
      spendChange: 15.2,
      cpcChange: 6.1,
      conversionsChange: 21.5,
      costPerConversionChange: -5.8,
      conversionRateChange: 11.8,
      roasChange: 4.3,
      revenueChange: 20.1
    });
    
    // Dados de desempenho diário
    const samplePerformance = [];
    const startDate = sub(new Date(), { days: 30 });
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      samplePerformance.push({
        date: format(date, 'dd/MM'),
        impressions: Math.floor(Math.random() * 20000) + 10000,
        clicks: Math.floor(Math.random() * 1500) + 500,
        spend: Math.floor(Math.random() * 500) + 300,
        conversions: Math.floor(Math.random() * 30) + 10
      });
    }
    
    setPerformance(samplePerformance);
    
    // Dados de campanhas
    const sampleCampaigns = [];
    for (let i = 1; i <= 15; i++) {
      const impressions = Math.floor(Math.random() * 100000) + 10000;
      const clicks = Math.floor(Math.random() * 5000) + 500;
      const spend = Math.floor(Math.random() * 2000) + 500;
      const conversions = Math.floor(Math.random() * 50) + 5;
      
      sampleCampaigns.push({
        id: `${i}`,
        name: `Campanha ${i}`,
        status: i % 5 === 0 ? 'PAUSED' : 'ACTIVE',
        objective: i % 3 === 0 ? 'LINK_CLICKS' : i % 3 === 1 ? 'CONVERSIONS' : 'REACH',
        impressions,
        clicks,
        ctr: ((clicks / impressions) * 100).toFixed(2),
        spend,
        cpc: (spend / clicks).toFixed(2),
        conversions,
        costPerConversion: (spend / conversions).toFixed(2),
        conversionRate: ((conversions / clicks) * 100).toFixed(2)
      });
    }
    
    setCampaigns(sampleCampaigns);
    
    // Dados de conjuntos de anúncios
    const sampleAdSets = [];
    for (let i = 1; i <= 30; i++) {
      const campaignId = Math.floor(Math.random() * 15) + 1;
      const impressions = Math.floor(Math.random() * 50000) + 5000;
      const clicks = Math.floor(Math.random() * 2500) + 250;
      const spend = Math.floor(Math.random() * 1000) + 200;
      const conversions = Math.floor(Math.random() * 30) + 2;
      
      sampleAdSets.push({
        id: `${i}`,
        name: `Conjunto de Anúncios ${i}`,
        campaignId: `${campaignId}`,
        campaignName: `Campanha ${campaignId}`,
        status: i % 4 === 0 ? 'PAUSED' : 'ACTIVE',
        impressions,
        clicks,
        ctr: ((clicks / impressions) * 100).toFixed(2),
        spend,
        cpc: (spend / clicks).toFixed(2),
        conversions,
        costPerConversion: (spend / conversions).toFixed(2),
        conversionRate: ((conversions / clicks) * 100).toFixed(2)
      });
    }
    
    setAdSets(sampleAdSets);
    
    // Dados de anúncios
    const sampleAds = [];
    for (let i = 1; i <= 60; i++) {
      const adSetId = Math.floor(Math.random() * 30) + 1;
      const impressions = Math.floor(Math.random() * 20000) + 2000;
      const clicks = Math.floor(Math.random() * 1000) + 100;
      const spend = Math.floor(Math.random() * 500) + 50;
      const conversions = Math.floor(Math.random() * 15) + 1;
      
      sampleAds.push({
        id: `${i}`,
        name: `Anúncio ${i}`,
        adSetId: `${adSetId}`,
        adSetName: `Conjunto de Anúncios ${adSetId}`,
        status: i % 3 === 0 ? 'PAUSED' : 'ACTIVE',
        impressions,
        clicks,
        ctr: ((clicks / impressions) * 100).toFixed(2),
        spend,
        cpc: (spend / clicks).toFixed(2),
        conversions,
        costPerConversion: (spend / conversions).toFixed(2),
        conversionRate: ((conversions / clicks) * 100).toFixed(2)
      });
    }
    
    setAds(sampleAds);
  };
  
  // Alterna entre abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };
  
  // Altera o período
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };
  
  // Altera o cliente
  const handleClientChange = (event) => {
    setClient(event.target.value);
  };
  
  // Paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Renderiza o status com chip colorido
  const renderStatus = (status) => {
    const color = status === 'ACTIVE' ? 'success' : 
                 status === 'PAUSED' ? 'warning' : 'error';
    
    return (
      <Chip 
        label={status === 'ACTIVE' ? 'Ativo' : 
              status === 'PAUSED' ? 'Pausado' : 'Inativo'} 
        size="small" 
        color={color} 
      />
    );
  };
  
  // Renderiza o objetivo da campanha
  const renderObjective = (objective) => {
    switch (objective) {
      case 'LINK_CLICKS':
        return 'Cliques no Link';
      case 'CONVERSIONS':
        return 'Conversões';
      case 'REACH':
        return 'Alcance';
      case 'BRAND_AWARENESS':
        return 'Reconhecimento de Marca';
      case 'APP_INSTALLS':
        return 'Instalações de App';
      default:
        return objective;
    }
  };
  
  // Renderiza a tabela de campanhas
  const renderCampaignsTable = () => {
    return (
      <Paper>
        <TableContainer>
          <Table aria-label="tabela de campanhas">
            <TableHead>
              <TableRow>
                <TableCell>Nome da Campanha</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Objetivo</TableCell>
                <TableCell align="right">Impressões</TableCell>
                <TableCell align="right">Cliques</TableCell>
                <TableCell align="right">CTR</TableCell>
                <TableCell align="right">Custo (R$)</TableCell>
                <TableCell align="right">CPC (R$)</TableCell>
                <TableCell align="right">Conversões</TableCell>
                <TableCell align="right">Custo/Conv. (R$)</TableCell>
                <TableCell align="right">Taxa Conv.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>{renderStatus(campaign.status)}</TableCell>
                    <TableCell>{renderObjective(campaign.objective)}</TableCell>
                    <TableCell align="right">{campaign.impressions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{campaign.clicks.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{campaign.ctr}%</TableCell>
                    <TableCell align="right">{campaign.spend.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{campaign.cpc}</TableCell>
                    <TableCell align="right">{campaign.conversions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{campaign.costPerConversion}</TableCell>
                    <TableCell align="right">{campaign.conversionRate}%</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={campaigns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </Paper>
    );
  };
  
  // Renderiza a tabela de conjuntos de anúncios
  const renderAdSetsTable = () => {
    return (
      <Paper>
        <TableContainer>
          <Table aria-label="tabela de conjuntos de anúncios">
            <TableHead>
              <TableRow>
                <TableCell>Nome do Conjunto</TableCell>
                <TableCell>Campanha</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Impressões</TableCell>
                <TableCell align="right">Cliques</TableCell>
                <TableCell align="right">CTR</TableCell>
                <TableCell align="right">Custo (R$)</TableCell>
                <TableCell align="right">CPC (R$)</TableCell>
                <TableCell align="right">Conversões</TableCell>
                <TableCell align="right">Custo/Conv. (R$)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adSets
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((adSet) => (
                  <TableRow key={adSet.id}>
                    <TableCell>{adSet.name}</TableCell>
                    <TableCell>{adSet.campaignName}</TableCell>
                    <TableCell>{renderStatus(adSet.status)}</TableCell>
                    <TableCell align="right">{adSet.impressions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{adSet.clicks.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{adSet.ctr}%</TableCell>
                    <TableCell align="right">{adSet.spend.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{adSet.cpc}</TableCell>
                    <TableCell align="right">{adSet.conversions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{adSet.costPerConversion}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={adSets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </Paper>
    );
  };
  
  // Renderiza a tabela de anúncios
  const renderAdsTable = () => {
    return (
      <Paper>
        <TableContainer>
          <Table aria-label="tabela de anúncios">
            <TableHead>
              <TableRow>
                <TableCell>Nome do Anúncio</TableCell>
                <TableCell>Conjunto de Anúncios</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Impressões</TableCell>
                <TableCell align="right">Cliques</TableCell>
                <TableCell align="right">CTR</TableCell>
                <TableCell align="right">Custo (R$)</TableCell>
                <TableCell align="right">CPC (R$)</TableCell>
                <TableCell align="right">Conversões</TableCell>
                <TableCell align="right">Custo/Conv. (R$)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ads
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>{ad.name}</TableCell>
                    <TableCell>{ad.adSetName}</TableCell>
                    <TableCell>{renderStatus(ad.status)}</TableCell>
                    <TableCell align="right">{ad.impressions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{ad.clicks.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{ad.ctr}%</TableCell>
                    <TableCell align="right">{ad.spend.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{ad.cpc}</TableCell>
                    <TableCell align="right">{ad.conversions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell align="right">{ad.costPerConversion}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={ads.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </Paper>
    );
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
                  Desempenho das Campanhas
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
                    <Line yAxisId="left" type="monotone" dataKey="impressions" name="Impressões" stroke="#8884d8" />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" name="Cliques" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversões" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Impressões" 
                value={summary?.impressions || 0} 
                change={summary?.impressionsChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Cliques" 
                value={summary?.clicks || 0} 
                change={summary?.clicksChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="CTR" 
                value={summary?.ctr || 0} 
                change={summary?.ctrChange || 0} 
                suffix="%" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Custo Total" 
                value={summary?.spend || 0} 
                change={summary?.spendChange || 0} 
                prefix="R$ " 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="CPC Médio" 
                value={summary?.cpc || 0} 
                change={summary?.cpcChange || 0} 
                prefix="R$ " 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Conversões" 
                value={summary?.conversions || 0} 
                change={summary?.conversionsChange || 0} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Custo por Conversão" 
                value={summary?.costPerConversion || 0} 
                change={summary?.costPerConversionChange || 0} 
                prefix="R$ " 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Taxa de Conversão" 
                value={summary?.conversionRate || 0} 
                change={summary?.conversionRateChange || 0} 
                suffix="%" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="ROAS" 
                value={summary?.roas || 0} 
                change={summary?.roasChange || 0} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Gastos Diários
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={performance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="spend" name="Custo (R$)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 1: // Campanhas
        return renderCampaignsTable();
        
      case 2: // Conjuntos de anúncios
        return renderAdSetsTable();
        
      case 3: // Anúncios
        return renderAdsTable();
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
            <FacebookIcon sx={{ mr: 1, color: '#1877F2' }} />
            Análise do Meta Ads
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
              <Tab label="Campanhas" />
              <Tab label="Conjuntos de Anúncios" />
              <Tab label="Anúncios" />
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

export default MetaAdsAnalytics;
