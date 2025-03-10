# SpeedFunnels v4 - Dashboard para Análise de Marketing Digital

Sistema de dashboard para análise de dados de marketing digital, integrando dados do Meta Ads e Google Analytics.

## Componentes

- **Backend**: API REST em Node.js/Express
- **ETL**: Processamento de dados do Meta Ads e Google Analytics
- **Frontend**: Dashboard em React
- **Database**: PostgreSQL e Redis
- **Infraestrutura**: Docker, Portainer e Traefik

## Configuração de Desenvolvimento

1. Clone o repositório
2. Execute `npm install` nos diretórios `/backend`, `/etl`, e `/frontend`
3. Configure as variáveis de ambiente em `.env` (veja `.env.example`)
4. Inicie os serviços com `docker-compose up`

## Funcionalidades Principais

- Dashboard multi-cliente
- Integração com Meta Ads API
- Integração com Google Analytics
- Análise de ROI e performance de campanhas
- Geração de relatórios
