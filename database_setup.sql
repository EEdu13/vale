-- ========================================
-- SCRIPT SQL - SilvaCollect Database
-- Railway PostgreSQL Setup
-- ========================================

-- Criar schema
CREATE SCHEMA IF NOT EXISTS joaoafiune;

-- Definir schema padrão
SET search_path TO joaoafiune;

-- ========================================
-- TABELA: apontamentos
-- ========================================
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

-- ========================================
-- TABELA: paradas_rendimento
-- ========================================
CREATE TABLE IF NOT EXISTS paradas_rendimento (
    id SERIAL PRIMARY KEY,
    id_apontamento INTEGER REFERENCES apontamentos(id) ON DELETE CASCADE,
    motivo VARCHAR(200) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES para Performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data);
CREATE INDEX IF NOT EXISTS idx_apontamentos_tipo ON apontamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_apontamentos_operador ON apontamentos(operador);
CREATE INDEX IF NOT EXISTS idx_apontamentos_status ON apontamentos(status);
CREATE INDEX IF NOT EXISTS idx_apontamentos_fazenda ON apontamentos(fazenda);
CREATE INDEX IF NOT EXISTS idx_paradas_apontamento ON paradas_rendimento(id_apontamento);

-- ========================================
-- VERIFICAÇÃO: Tabelas criadas com sucesso
-- ========================================
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'joaoafiune';

-- ========================================
-- VERIFICAÇÃO: Colunas da tabela apontamentos
-- ========================================
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'joaoafiune' 
AND table_name = 'apontamentos'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAÇÃO: Índices criados
-- ========================================
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'joaoafiune'
ORDER BY tablename, indexname;

-- ========================================
-- QUERY DE TESTE: Contar registros
-- ========================================
SELECT 
    'apontamentos' as tabela,
    COUNT(*) as total_registros
FROM apontamentos
UNION ALL
SELECT 
    'paradas_rendimento' as tabela,
    COUNT(*) as total_registros
FROM paradas_rendimento;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
