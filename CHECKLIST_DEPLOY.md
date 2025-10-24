# ✅ CHECKLIST - Deploy Railway SilvaCollect

## 📦 Arquivos Criados para Deploy

### ✅ Configuração Railway
- [x] `railway.json` - Configuração do Railway
- [x] `Procfile` - Comando de inicialização
- [x] `nixpacks.toml` - Build configuration
- [x] `.railwayignore` - Arquivos ignorados no deploy

### ✅ Configuração Git/GitHub
- [x] `.gitignore` - Arquivos ignorados no Git
- [x] `.env.example` - Template de variáveis de ambiente

### ✅ Documentação
- [x] `RAILWAY_DEPLOY.md` - Guia completo de deploy passo a passo
- [x] `README.md` - Atualizado com badges e info de produção
- [x] `package.json` - Atualizado com engines Node.js

---

## 🎯 PRÓXIMOS PASSOS PARA DEPLOY

### 1. Preparar Código para GitHub
```bash
# Inicializar Git (se ainda não inicializou)
git init

# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "🚀 SilvaCollect v1.0 - Pronto para produção"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/silvacollect.git
git branch -M main
git push -u origin main
```

### 2. Criar Projeto no Railway
1. Acesse: https://railway.app/new
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Provision PostgreSQL"**
5. Aguarde criar o banco

### 3. Criar Tabelas no PostgreSQL
Execute este SQL no Railway PostgreSQL (aba Data → Query):

```sql
CREATE SCHEMA IF NOT EXISTS joaoafiune;
SET search_path TO joaoafiune;

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

CREATE TABLE IF NOT EXISTS paradas_rendimento (
    id SERIAL PRIMARY KEY,
    id_apontamento INTEGER REFERENCES apontamentos(id) ON DELETE CASCADE,
    motivo VARCHAR(200),
    hora_inicio TIME,
    hora_fim TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data);
CREATE INDEX IF NOT EXISTS idx_apontamentos_tipo ON apontamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_paradas_apontamento ON paradas_rendimento(id_apontamento);
```

### 4. Deploy da Aplicação
1. No Railway, clique em **"New"** (no mesmo projeto)
2. Selecione **"GitHub Repo"**
3. Escolha o repositório **silvacollect**
4. Railway detecta Node.js automaticamente

### 5. Configurar Variáveis de Ambiente
No serviço da aplicação (não no PostgreSQL):

**Variáveis → Add Reference → PostgreSQL:**
- `DB_HOST` → PGHOST
- `DB_PORT` → PGPORT
- `DB_USER` → PGUSER
- `DB_PASSWORD` → PGPASSWORD
- `DB_NAME` → PGDATABASE

**Adicionar manualmente:**
- `NODE_ENV` = `production`
- `PORT` = `3000`

### 6. Gerar Domínio Público
1. Clique no serviço da aplicação
2. Settings → Domains
3. Clique em **"Generate Domain"**
4. Copie a URL: `https://silvacollect-production.up.railway.app`

### 7. Testar Aplicação
- [ ] Acessar URL gerada
- [ ] Fazer login (criar usuário)
- [ ] Criar apontamento AVULSO
- [ ] Criar apontamento PLANEJADO
- [ ] Ver relatório
- [ ] Testar offline (desconectar wifi)
- [ ] Instalar PWA no celular

---

## 🔍 Verificações Importantes

### ✅ Logs do Deploy
```
Railway → Seu Serviço → Deployments → View Logs
```

Procure por:
- ✅ `Conectado ao PostgreSQL com sucesso!`
- ✅ `Servidor rodando na porta 3000`
- ❌ Sem erros de conexão

### ✅ Testar Endpoints
```bash
# Teste de conexão
https://SEU-DOMINIO.up.railway.app/api/test

# Listar apontamentos
https://SEU-DOMINIO.up.railway.app/api/apontamentos
```

### ✅ Variáveis Configuradas
Railway → Serviço → Variables:
- [x] DB_HOST
- [x] DB_PORT
- [x] DB_USER
- [x] DB_PASSWORD
- [x] DB_NAME
- [x] NODE_ENV
- [x] PORT

---

## 🎉 TUDO PRONTO!

Seu sistema está configurado e pronto para deploy no Railway!

### 📱 Depois do Deploy

1. **Compartilhe a URL** com os operadores
2. **Instale o PWA** em cada dispositivo:
   - Chrome: Menu → "Adicionar à tela inicial"
   - Safari iOS: Compartilhar → "Adicionar à Tela de Início"
3. **Configure o banco de dados** com os dados iniciais (fazendas, máquinas, etc)

### 📞 Suporte
- Railway Docs: https://docs.railway.app/
- Ver guia completo: `RAILWAY_DEPLOY.md`

---

**Desenvolvido por:** Eduardo Ferreira  
**Versão:** 1.0.0  
**Data:** Outubro 2025
