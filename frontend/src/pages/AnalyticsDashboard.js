import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
    <Container fluid className="my-4">
      <h1 className="mb-4">Dashboard de Analytics</h1>
      
      {/* Seletor de datas */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="mb-3">
                <label className="form-label">Data de início</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </Col>
            <Col md={3}>
              <div className="mb-3">
                <label className="form-label">Data de fim</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  minDate={startDate}
                />
              </div>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={handleDateChange}
                disabled={loading}
                className="mb-3"
              >
                {loading ? 'Carregando...' : 'Atualizar Dados'}
              </Button>
              
              {!googleConnected && (
                <Button
                  variant="outline-primary"
                  onClick={handleConnectGoogle}
                  className="mb-3 ms-2"
                >
                  Conectar com Google
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Exibir erros */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center my-5">
          <LoadingSpinner />
          <p className="mt-3">Carregando dados de analytics...</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="google" className="mb-4">
          {/* Tab do Google Analytics */}
          <Tab eventKey="google" title="Google Analytics">
            {!googleConnected ? (
              <Alert variant="warning" className="my-4">
                <Alert.Heading>Conta Google não conectada</Alert.Heading>
                <p>
                  Para visualizar os dados do Google Analytics, você precisa conectar sua conta Google.
                </p>
                <Button variant="primary" onClick={handleConnectGoogle}>
                  Conectar com Google
                </Button>
              </Alert>
            ) : (
              <>
                {/* Resumo do GA */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="h-100">
                      <Card.Body className="text-center">
                        <h5>Sessões</h5>
                        <h3>{gaSummary?.sessions || 0}</h3>
                        <p>{formatPercentChange(gaSummary?.sessionsChange)}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="h-100">
                      <Card.Body className="text-center">
                        <h5>Usuários</h5>
                        <h3>{gaSummary?.users || 0}</h3>
                        <p>{formatPercentChange(gaSummary?.usersChange)}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="h-100">
                      <Card.Body className="text-center">
                        <h5>Taxa de Rejeição</h5>
                        <h3>{gaSummary?.bounceRate?.toFixed(2) || 0}%</h3>
                        <p>{formatPercentChange(gaSummary?.bounceRateChange)}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="h-100">
                      <Card.Body className="text-center">
                        <h5>Taxa de Conversão</h5>
                        <h3>{gaSummary?.goalConversionRate?.toFixed(2) || 0}%</h3>
                        <p>{formatPercentChange(gaSummary?.goalConversionRateChange)}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                {/* Gráficos do GA */}
                <Row className="mb-4">
                  <Col md={8}>
                    <Card className="h-100">
                      <Card.Header>Desempenho no Período</Card.Header>
                      <Card.Body>
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
                          <p className="text-center">Nenhum dado disponível</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100">
                      <Card.Header>Fontes de Tráfego</Card.Header>
                      <Card.Body>
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
                          <p className="text-center">Nenhum dado disponível</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                {/* Tabelas do GA */}
                <Row>
                  <Col>
                    <Card>
                      <Card.Header>Páginas Mais Visitadas</Card.Header>
                      <Card.Body>
                        {gaTopPages && gaTopPages.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-striped">
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
                          </div>
                        ) : (
                          <p className="text-center">Nenhum dado disponível</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Tab>
          
          {/* Tab do Meta Ads */}
          <Tab eventKey="meta" title="Meta Ads">
            {/* Resumo do Meta Ads */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <h5>Impressões</h5>
                    <h3>{metaSummary?.impressions || 0}</h3>
                    <p>{formatPercentChange(metaSummary?.impressionsChange)}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <h5>Cliques</h5>
                    <h3>{metaSummary?.clicks || 0}</h3>
                    <p>{formatPercentChange(metaSummary?.clicksChange)}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <h5>CTR</h5>
                    <h3>{metaSummary?.ctr?.toFixed(2) || 0}%</h3>
                    <p>{formatPercentChange(metaSummary?.ctrChange)}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <h5>Gastos</h5>
                    <h3>{formatCurrency(metaSummary?.spend)}</h3>
                    <p>{formatPercentChange(metaSummary?.spendChange)}</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Gráficos do Meta Ads */}
            <Row className="mb-4">
              <Col md={8}>
                <Card className="h-100">
                  <Card.Header>Desempenho no Período</Card.Header>
                  <Card.Body>
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
                      <p className="text-center">Nenhum dado disponível</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Header>Campanhas</Card.Header>
                  <Card.Body>
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
                      <p className="text-center">Nenhum dado disponível</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Tabelas do Meta Ads */}
            <Row>
              <Col>
                <Card>
                  <Card.Header>Campanhas Ativas</Card.Header>
                  <Card.Body>
                    {metaCampaigns && metaCampaigns.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
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
                                  <span className={`badge bg-${campaign.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                                    {campaign.status}
                                  </span>
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
                      </div>
                    ) : (
                      <p className="text-center">Nenhum dado disponível</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
