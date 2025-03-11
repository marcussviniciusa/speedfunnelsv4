# Guia de Deploy - SpeedFunnels v4

Este guia explica como implantar o SpeedFunnels v4 usando Docker, Portainer e Traefik.

## Pré-requisitos

- Servidor com Docker e Docker Compose instalados
- Domínio configurado para apontar para o servidor (para ambiente de produção)
- Variáveis de ambiente configuradas

## 1. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Configuração do Banco de Dados
POSTGRES_HOST=postgres
POSTGRES_USER=speedfunnels
POSTGRES_PASSWORD=senha_segura_postgres
POSTGRES_DB=speedfunnels_db

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=senha_segura_redis

# JWT
JWT_SECRET=chave_secreta_muito_segura

# Meta Ads
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_ACCESS_TOKEN=seu_token_de_acesso
META_AD_ACCOUNT_ID=seu_id_da_conta_de_anuncios

# Google Analytics
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URL=https://api.seu-dominio.com/api/auth/google/callback
GOOGLE_SERVICE_ACCOUNT_KEY=chave_da_conta_de_servico
GA_VIEW_ID=seu_view_id
GA_CLIENT_EMAIL=email_da_conta_de_servico
GA_PRIVATE_KEY="chave_privada_da_conta_de_servico"

# Domínios (produção)
FRONTEND_DOMAIN=seu-dominio.com
API_DOMAIN=api.seu-dominio.com

# Traefik
ACME_EMAIL=seu-email@exemplo.com
TRAEFIK_DASHBOARD_AUTH=usuario:senha_hash  # Gere com htpasswd
```

Para gerar a senha do Traefik Dashboard:
```bash
htpasswd -nb usuario senha
```

## 2. Deploy Local para Testes

Para testar localmente antes de um deploy de produção:

1. Adicione os domínios locais ao arquivo `/etc/hosts`:

```
127.0.0.1 dashboard.speedfunnels.local api.speedfunnels.local portainer.speedfunnels.local
```

2. Execute o ambiente de desenvolvimento:

```bash
docker-compose up -d
```

3. Acesse:
   - **Dashboard**: http://dashboard.speedfunnels.local
   - **API**: http://api.speedfunnels.local
   - **Portainer**: http://portainer.speedfunnels.local
   - **Traefik Dashboard**: http://localhost:8080

## 3. Deploy de Produção

Para implantar em um ambiente de produção:

1. Clone o repositório no servidor:

```bash
git clone https://github.com/seu-usuario/speedfunnelsv4.git
cd speedfunnelsv4
```

2. Configure o arquivo `.env` com as variáveis para produção.

3. Implante usando o docker-compose de produção:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. O Traefik configurará automaticamente os certificados SSL usando Let's Encrypt.

5. Acesse os serviços nos respectivos domínios:
   - **Dashboard**: https://seu-dominio.com
   - **API**: https://api.seu-dominio.com
   - **Portainer**: https://portainer.seu-dominio.com
   - **Traefik Dashboard**: https://traefik.seu-dominio.com (protegido por auth)

## 4. Gerenciamento com Portainer

Após a implantação, você pode gerenciar os containers usando o Portainer:

1. Acesse o Portainer na URL configurada
2. Na primeira execução, configure uma senha de administrador
3. Conecte-se ao ambiente local do Docker
4. Usando o painel do Portainer, você pode:
   - Monitorar o estado dos containers
   - Visualizar logs em tempo real
   - Reiniciar containers quando necessário
   - Atualizar imagens
   - Gerenciar volumes e redes

## 5. Atualizações e Manutenção

Para atualizar a aplicação após alterações no código:

```bash
# Atualizar o código
git pull

# Recriar e reiniciar os containers
docker-compose -f docker-compose.prod.yml up -d --build
```

Para verificar os logs:

```bash
# Logs do container específico
docker-compose -f docker-compose.prod.yml logs -f api

# Logs de todos os containers
docker-compose -f docker-compose.prod.yml logs -f
```

## 6. Backup e Recuperação

### Backup do Banco de Dados

```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup_$(date +%Y%m%d).sql
```

### Restauração do Banco de Dados

```bash
cat backup_arquivo.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}
```

## 7. Testando as Integrações de Analytics

Para testar as integrações após o deploy:

1. Verifique a conexão com o Google Analytics:
```bash
docker-compose -f docker-compose.prod.yml exec api node src/scripts/test-ga-connection.js
```

2. Verifique a conexão com o Meta Ads:
```bash
docker-compose -f docker-compose.prod.yml exec api node src/scripts/test-meta-ads-connection.js
```

3. Verifique ambas as conexões:
```bash
docker-compose -f docker-compose.prod.yml exec api node src/scripts/test-analytics-connections.js
```

## 8. Solução de Problemas

### Problema: Containers não iniciam

Verifique os logs:
```bash
docker-compose -f docker-compose.prod.yml logs
```

### Problema: Erro de conexão com o banco de dados

Verifique se o container do postgres está em execução:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Problema: Certificados SSL não são gerados

Verifique os logs do Traefik:
```bash
docker-compose -f docker-compose.prod.yml logs traefik
```
Certifique-se de que o domínio está apontando corretamente para o servidor e que as portas 80 e 443 estão abertas.
