# 🚀 Deploy SilvaCollect no Railway

## 📋 Pré-requisitos
- Conta no Railway (https://railway.app/)
- Código do projeto no GitHub (ou upload direto)

## 🗄️ Passo 1: Criar o Banco de Dados PostgreSQL

1. Acesse o Railway: https://railway.app/
2. Clique em **"New Project"**
3. Selecione **"Provision PostgreSQL"**
4. Aguarde o PostgreSQL ser criado
5. Clique no serviço PostgreSQL criado
6. Vá na aba **"Variables"** e copie as seguintes informações:
   - `PGHOST` (DB_HOST)
   - `PGPORT` (DB_PORT) 
   - `PGUSER` (DB_USER)
   - `PGPASSWORD` (DB_PASSWORD)
   - `PGDATABASE` (DB_NAME)

## 🗃️ Passo 2: Criar as Tabelas no Banco

1. No Railway, clique no serviço PostgreSQL
2. Vá na aba **"Data"**
3. Clique em **"Query"**
4. Execute os seguintes comandos SQL:

```sql
-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS joaoafiune;

-- Definir schema padrão
SET search_path TO joaoafiune;

-- Criar tabela de apontamentos
CREATE TABLE IF NOT EXISTS apontamentos (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    hora_inicio TIME,
    hora_final TIME,
    prefixo VARCHAR(50),
    operador VARCHAR(100),
    codigo VARCHAR(50),
    servico VARCHAR(200),
    os VARCHAR(50),
    fazenda VARCHAR(100),
    talhao VARCHAR(50),
    setor VARCHAR(50),
    frente VARCHAR(50),
    produzido DECIMAL(10,2),
    restante DECIMAL(10,2),
    observacao TEXT,
    tipo VARCHAR(20),
    status VARCHAR(50),
    horimetro_inicial DECIMAL(10,1),
    horimetro_final DECIMAL(10,1),
    clone VARCHAR(50),
    plantadas INTEGER,
    descarte INTEGER,
    insumo1 VARCHAR(100),
    quantidade1 VARCHAR(50),
    insumo2 VARCHAR(100),
    quantidade2 VARCHAR(50),
    insumo3 VARCHAR(100),
    quantidade3 VARCHAR(50),
    insumo4 VARCHAR(100),
    quantidade4 VARCHAR(50),
    insumo5 VARCHAR(100),
    quantidade5 VARCHAR(50),
    anexo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de paradas
CREATE TABLE IF NOT EXISTS paradas_rendimento (
    id SERIAL PRIMARY KEY,
    id_apontamento INTEGER REFERENCES apontamentos(id) ON DELETE CASCADE,
    motivo VARCHAR(200),
    hora_inicio TIME,
    hora_fim TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data);
CREATE INDEX IF NOT EXISTS idx_apontamentos_tipo ON apontamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_apontamentos_operador ON apontamentos(operador);
CREATE INDEX IF NOT EXISTS idx_paradas_apontamento ON paradas_rendimento(id_apontamento);
```

## 🚀 Passo 3: Deploy da Aplicação

### Opção A: Deploy via GitHub (Recomendado)

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos do projeto
3. No Railway, clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório do SilvaCollect
6. Railway vai detectar automaticamente o Node.js

### Opção B: Deploy Direto (Upload)

1. No Railway, clique em **"New Project"**
2. Selecione **"Deploy from local directory"**
3. Selecione a pasta do projeto
4. Railway vai fazer o upload e deploy

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

1. Clique no serviço da aplicação (não no PostgreSQL)
2. Vá na aba **"Variables"**
3. Adicione as seguintes variáveis (use os valores do PostgreSQL criado):

```
DB_HOST=ballast.proxy.rlwy.net (ou o host do seu PostgreSQL)
DB_PORT=21526 (ou a porta do seu PostgreSQL)
DB_USER=postgres (ou o usuário do seu PostgreSQL)
DB_PASSWORD=sua_senha_aqui
DB_NAME=railway (ou o nome do seu database)
NODE_ENV=production
PORT=3000
```

4. Clique em **"Add Variable"** para cada uma
5. O Railway vai reiniciar automaticamente a aplicação

## 🔗 Passo 5: Conectar Aplicação ao Banco

1. No dashboard do projeto, você verá 2 serviços:
   - PostgreSQL
   - SilvaCollect (sua aplicação)

2. Clique na aplicação SilvaCollect
3. Vá em **"Settings"** → **"Service"**
4. Em **"Connect to Database"**, selecione o PostgreSQL criado
5. Isso vai adicionar automaticamente as variáveis de conexão

## ✅ Passo 6: Verificar Deploy

1. Clique no serviço da aplicação
2. Vá na aba **"Deployments"**
3. Aguarde o build completar (ícone verde ✅)
4. Clique em **"View Logs"** para ver se está tudo OK
5. Procure pelas mensagens:
   ```
   ✅ Conectado ao PostgreSQL com sucesso!
   🚀 Servidor rodando na porta 3000
   ```

## 🌐 Passo 7: Acessar a Aplicação

1. Vá na aba **"Settings"** do serviço da aplicação
2. Em **"Domains"**, clique em **"Generate Domain"**
3. Railway vai criar uma URL pública tipo: `silvacollect.up.railway.app`
4. Clique na URL para acessar o sistema!

## 📱 Passo 8: Configurar PWA (Opcional)

Para que o PWA funcione corretamente:

1. Acesse a aplicação pela URL do Railway
2. No Chrome/Edge mobile, clique nos 3 pontos
3. Selecione **"Adicionar à tela inicial"**
4. O app será instalado como aplicativo nativo!

## 🔧 Troubleshooting

### ❌ Erro: "Cannot connect to database"
- Verifique se as variáveis DB_* estão corretas
- Confirme que o PostgreSQL está rodando (ícone verde)
- Vá em Settings → Variables e redefina as variáveis

### ❌ Erro: "Application failed to respond"
- Verifique os logs na aba "Deployments" → "View Logs"
- Confirme que a porta está configurada como 3000
- Reinicie o serviço em Settings → "Restart Service"

### ❌ Tabelas não existem
- Execute os comandos SQL novamente no PostgreSQL
- Verifique se está no schema correto: `joaoafiune`

## 📊 Monitoramento

- **Logs**: Aba "Deployments" → "View Logs"
- **Métricas**: Aba "Metrics" mostra CPU, RAM, Network
- **Database**: PostgreSQL → aba "Data" para consultas

## 💰 Custos

- **Plano Hobby (Gratuito)**:
  - $5 de crédito mensal grátis
  - Ideal para testes e uso moderado
  
- **Plano Pro**:
  - $20/mês
  - Para uso em produção com tráfego maior

## 🔄 Atualizações Futuras

Para atualizar a aplicação:

1. **Via GitHub**: Apenas faça push das mudanças
2. **Via Upload**: Faça novo deploy pela CLI do Railway
3. Railway detecta mudanças e faz redeploy automático

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app/
- PostgreSQL Docs: https://www.postgresql.org/docs/

🎉 **Pronto! Seu SilvaCollect está no ar!**
