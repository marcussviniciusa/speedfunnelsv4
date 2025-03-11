import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert, 
  Tabs, 
  Tab, 
  Box,
  TextField
} from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';

import googleAnalyticsService from '../services/googleAnalyticsService';
import metaAdsService from '../services/metaAdsService';
import LoadingSpinner from '../components/LoadingSpinner';

// Registrar componentes Chart.js necessários
Chart.register(...registerables);

const AnalyticsDashboard = () => {
  // Estados para datas
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  
  // Estados para dados
  const [gaSummary, setGaSummary] = useState(null);
  const [gaPerformance, setGaPerformance] = useState(null);
  const [gaTrafficSources, setGaTrafficSources] = useState(null);
  const [gaTopPages, setGaTopPages] = useState(null);
  
  const [metaSummary, setMetaSummary] = useState(null);
  const [metaPerformance, setMetaPerformance] = useState(null);
  const [metaCampaigns, setMetaCampaigns] = useState(null);
  
  // Estado para controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  
  // Formatação de datas para API
  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Verificar conexão com Google Analytics
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const isConnected = await googleAnalyticsService.checkConnection();
        setGoogleConnected(isConnected);
      } catch (error) {
        console.error('Erro ao verificar conexão com Google:', error);
        setGoogleConnected(false);
      }
    };
    
    checkGoogleConnection();
  }, []);
  
  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedStartDate = formatDateForApi(startDate);
      const formattedEndDate = formatDateForApi(endDate);
      
      // Carregar dados do Google Analytics
      if (googleConnected) {
        const [summary, performance, trafficSources, topPages] = await Promise.all([
          googleAnalyticsService.getSummary(formattedStartDate, formattedEndDate),
          googleAnalyticsService.getPerformance(formattedStartDate, formattedEndDate),
          googleAnalyticsService.getTrafficSources(formattedStartDate, formattedEndDate),
          googleAnalyticsService.getTopPages(formattedStartDate, formattedEndDate, null, 10)
        ]);
        
        setGaSummary(summary);
        setGaPerformance(performance);
        setGaTrafficSources(trafficSources);
        setGaTopPages(topPages);
      }
      
      // Carregar dados do Meta Ads
      const [metaSummaryData, metaPerformanceData, metaCampaignsData] = await Promise.all([
        metaAdsService.getSummary(formattedStartDate, formattedEndDate),
        metaAdsService.getPerformance(formattedStartDate, formattedEndDate),
        metaAdsService.getCampaigns(formattedStartDate, formattedEndDate)
      ]);
      
      setMetaSummary(metaSummaryData);
      setMetaPerformance(metaPerformanceData);
      setMetaCampaigns(metaCampaignsData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Iniciar carregamento ao montar o componente
  useEffect(() => {
    loadData();
  }, [googleConnected]);
  
  // Preparar dados para os gráficos do Google Analytics
  const prepareGAPerformanceChart = () => {
    if (!gaPerformance) return null;
    
    return {
      labels: gaPerformance.map(item => item.date),
      datasets: [
        {
          label: 'Sessões',
          data: gaPerformance.map(item => item.sessions),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true
        },
        {
          label: 'Usuários',
          data: gaPerformance.map(item => item.users),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true
        },
        {
          label: 'Pageviews',
          data: gaPerformance.map(item => item.pageviews),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true
        }
      ]
    };
  };
  
  const prepareGATrafficSourcesChart = () => {
    if (!gaTrafficSources) return null;
    
    // Pegar os 5 principais
    const topSources = gaTrafficSources.slice(0, 5);
    
    return {
      labels: topSources.map(item => `${item.source}/${item.medium}`),
      datasets: [
        {
          data: topSources.map(item => item.sessions),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Preparar dados para os gráficos do Meta Ads
  const prepareMetaPerformanceChart = () => {
    if (!metaPerformance) return null;
    
    return {
      labels: metaPerformance.map(item => item.date),
      datasets: [
        {
          label: 'Impressões',
          data: metaPerformance.map(item => item.impressions),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true
        },
        {
          label: 'Cliques',
          data: metaPerformance.map(item => item.clicks),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true
        }
      ]
    };
  };
  
  const prepareMetaCampaignsChart = () => {
    if (!metaCampaigns) return null;
    
    // Pegar os 5 principais
    const topCampaigns = metaCampaigns.slice(0, 5);
    
    return {
      labels: topCampaigns.map(item => item.name),
      datasets: [
        {
          label: 'Gastos',
          data: topCampaigns.map(item => item.spend),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Cliques',
          data: topCampaigns.map(item => item.clicks),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Calcular mudança percentual
  const formatPercentChange = (value) => {
    if (value === undefined || value === null) return '-';
    
    const isPositive = value >= 0;
    const icon = isPositive ? '▲' : '▼';
    const colorClass = isPositive ? 'text-success' : 'text-danger';
    
    return (
      <span className={colorClass}>
        {icon} {Math.abs(value).toFixed(2)}%
      </span>
    );
  };
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  // Manipuladores de eventos
  const handleDateChange = () => {
    loadData();
  };
  
  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google';
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" mb={4}>Dashboard de Analytics</Typography>
      
      {/* Seletor de datas */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data de início"
                  value={startDate}
                  onChange={(newValue) => {
                    setStartDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data de fim"
                  value={endDate}
                  onChange={(newValue) => {
                    setEndDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} />}
                  minDate={startDate}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={handleDateChange}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? 'Carregando...' : 'Atualizar Dados'}
              </Button>
              
              {!googleConnected && (
                <Button
                  variant="outlined"
                  onClick={handleConnectGoogle}
                >
                  Conectar com Google
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Exibir erros */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <LoadingSpinner />
          <Typography variant="h6" sx={{ mt: 2 }}>Carregando dados de analytics...</Typography>
        </Box>
      ) : (
        <Tabs defaultActiveKey="google" sx={{ mb: 4 }}>
          {/* Tab do Google Analytics */}
          <Tab eventKey="google" title="Google Analytics">
            {!googleConnected ? (
              <Alert severity="warning" sx={{ my: 4 }}>
                <Alert.Heading>Conta Google não conectada</Alert.Heading>
                <Typography>
                  Para visualizar os dados do Google Analytics, você precisa conectar sua conta Google.
                </Typography>
                <Button variant="contained" onClick={handleConnectGoogle}>
                  Conectar com Google
                </Button>
              </Alert>
            ) : (
              <>
                {/* Resumo do GA */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6">Sessões</Typography>
                        <Typography variant="h4">{gaSummary?.sessions || 0}</Typography>
                        <Typography>{formatPercentChange(gaSummary?.sessionsChange)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6">Usuários</Typography>
                        <Typography variant="h4">{gaSummary?.users || 0}</Typography>
                        <Typography>{formatPercentChange(gaSummary?.usersChange)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6">Taxa de Rejeição</Typography>
                        <Typography variant="h4">{gaSummary?.bounceRate?.toFixed(2) || 0}%</Typography>
                        <Typography>{formatPercentChange(gaSummary?.bounceRateChange)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6">Taxa de Conversão</Typography>
                        <Typography variant="h4">{gaSummary?.goalConversionRate?.toFixed(2) || 0}%</Typography>
                        <Typography>{formatPercentChange(gaSummary?.goalConversionRateChange)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Gráficos do GA */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        {gaPerformance ? (
                          <Line 
                            data={prepareGAPerformanceChart()} 
                            options={{ 
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { position: 'top' } }
                            }} 
                            height={300}
                          />
                        ) : (
                          <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        {gaTrafficSources ? (
                          <Pie 
                            data={prepareGATrafficSourcesChart()}
                            options={{ 
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { position: 'bottom' } }
                            }}
                            height={250}
                          />
                        ) : (
                          <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Tabelas do GA */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      {gaTopPages && gaTopPages.length > 0 ? (
                        <Box sx={{ overflowX: 'auto' }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Página</th>
                                <th>Visualizações</th>
                                <th>Tempo Médio (segundos)</th>
                                <th>Entradas</th>
                                <th>Taxa de Rejeição</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gaTopPages.map((page, index) => (
                                <tr key={index}>
                                  <td>{page.path}</td>
                                  <td>{page.pageviews}</td>
                                  <td>{page.avgTimeOnPage.toFixed(2)}</td>
                                  <td>{page.entrances}</td>
                                  <td>{page.bounceRate.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      ) : (
                        <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Tab>
          
          {/* Tab do Meta Ads */}
          <Tab eventKey="meta" title="Meta Ads">
            {/* Resumo do Meta Ads */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6">Impressões</Typography>
                    <Typography variant="h4">{metaSummary?.impressions || 0}</Typography>
                    <Typography>{formatPercentChange(metaSummary?.impressionsChange)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6">Cliques</Typography>
                    <Typography variant="h4">{metaSummary?.clicks || 0}</Typography>
                    <Typography>{formatPercentChange(metaSummary?.clicksChange)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6">CTR</Typography>
                    <Typography variant="h4">{metaSummary?.ctr?.toFixed(2) || 0}%</Typography>
                    <Typography>{formatPercentChange(metaSummary?.ctrChange)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6">Gastos</Typography>
                    <Typography variant="h4">{formatCurrency(metaSummary?.spend)}</Typography>
                    <Typography>{formatPercentChange(metaSummary?.spendChange)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Gráficos do Meta Ads */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    {metaPerformance ? (
                      <Line 
                        data={prepareMetaPerformanceChart()} 
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'top' } }
                        }} 
                        height={300}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    {metaCampaigns ? (
                      <Bar 
                        data={prepareMetaCampaignsChart()}
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } }
                        }}
                        height={250}
                      />
                    ) : (
                      <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Tabelas do Meta Ads */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  {metaCampaigns && metaCampaigns.length > 0 ? (
                    <Box sx={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Impressões</th>
                            <th>Cliques</th>
                            <th>CTR</th>
                            <th>Gastos</th>
                            <th>CPC</th>
                            <th>Conversões</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metaCampaigns.map((campaign, index) => (
                            <tr key={index}>
                              <td>{campaign.name}</td>
                              <td>
                                <Typography sx={{ color: campaign.status === 'ACTIVE' ? 'green' : 'gray' }}>
                                  {campaign.status}
                                </Typography>
                              </td>
                              <td>{campaign.impressions}</td>
                              <td>{campaign.clicks}</td>
                              <td>{campaign.ctr?.toFixed(2)}%</td>
                              <td>{formatCurrency(campaign.spend)}</td>
                              <td>{formatCurrency(campaign.cpc)}</td>
                              <td>{campaign.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  ) : (
                    <Typography variant="h6" sx={{ textAlign: 'center' }}>Nenhum dado disponível</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Tab>
        </Tabs>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
