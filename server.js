const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve arquivos estáticos (HTML, CSS, JS)

// Configuração do PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

// Testar conexão
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar ao PostgreSQL:', err.stack);
    } else {
        console.log('✅ Conectado ao PostgreSQL com sucesso!');
        release();
    }
});

// ========== ROTAS DE TESTE ==========

// Testar conexão
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Conexão com PostgreSQL OK!',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao conectar',
            error: error.message
        });
    }
});

// ========== ROTAS - FAZENDAS ==========

// Listar todas as fazendas
app.get('/api/fazendas', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT fazenda FROM joaoafiune.fazenda ORDER BY fazenda');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar fazendas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar talhões de uma fazenda
app.get('/api/fazendas/:fazenda/talhoes', async (req, res) => {
    try {
        const { fazenda } = req.params;
        const result = await pool.query(
            'SELECT talhao, area_total FROM joaoafiune.fazenda WHERE fazenda = $1 ORDER BY talhao',
            [fazenda]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar talhões:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - FROTAS ==========

// Listar todas as frotas
app.get('/api/frotas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM joaoafiune.frotas ORDER BY prefixo');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar frotas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - COLABORADORES ==========

// Listar todos os colaboradores
app.get('/api/colaboradores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM joaoafiune.colaborador ORDER BY nome');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - INSUMOS ==========

// Listar todos os insumos
app.get('/api/insumos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM joaoafiune.cad_insumos ORDER BY insumo');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar insumos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - ATIVIDADES ==========

// Listar todas as atividades
app.get('/api/atividades', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM joaoafiune.atividades ORDER BY atividade');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - APONTAMENTOS ==========

// Listar todos os apontamentos
app.get('/api/apontamentos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM joaoafiune.apontamentos 
            ORDER BY data DESC, id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar apontamentos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar novo apontamento
app.post('/api/apontamentos', async (req, res) => {
    try {
        const {
            data, os, faturado, supervisor, equipe, nome_lider, operador,
            maquina, fazenda, talhao, atividade, modalidade, produzido,
            area_total, status, tarifa, qtd_colaboradores, observacao,
            hi, hf, hora_inicio, hora_final, nf_lotemudas, viveiro, clone, plantadas, descarte,
            insumo1, quantidade1, insumo2, quantidade2, insumo3, quantidade3,
            insumo4, quantidade4, insumo5, quantidade5, anexo
        } = req.body;

        const result = await pool.query(`
            INSERT INTO joaoafiune.apontamentos (
                data, os, faturado, supervisor, equipe, nome_lider, operador,
                maquina, fazenda, talhao, atividade, modalidade, produzido,
                area_total, status, tarifa, qtd_colaboradores, observacao,
                hi, hf, hora_inicio, hora_final, nf_lotemudas, viveiro, clone, plantadas, descarte,
                insumo1, quantidade1, insumo2, quantidade2, insumo3, quantidade3,
                insumo4, quantidade4, insumo5, quantidade5, anexo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34, $35, $36, $37, $38
            ) RETURNING *
        `, [
            data, os, faturado, supervisor, equipe, nome_lider, operador,
            maquina, fazenda, talhao, atividade, modalidade, produzido,
            area_total, status, tarifa, qtd_colaboradores, observacao,
            hi, hf, hora_inicio, hora_final, nf_lotemudas, viveiro, clone, plantadas, descarte,
            insumo1, quantidade1, insumo2, quantidade2, insumo3, quantidade3,
            insumo4, quantidade4, insumo5, quantidade5, anexo
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar apontamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - PLANEJADO (ORDENS DE SERVIÇO) ==========

// Listar todas as OS
app.get('/api/planejado', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM joaoafiune.planejado 
            ORDER BY data_criacao DESC, id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar planejados:', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar nova OS
app.post('/api/planejado', async (req, res) => {
    try {
        const {
            data_criacao, os, supervisor, equipe, nome_lider, operador,
            maquina, fazenda, talhao, atividade, modalidade, produzido,
            area_total, restante, status, tarifa, nf_lotemudas, viveiro,
            clone, plantadas, descarte, insumo1, quantidade1, insumo2,
            quantidade2, insumo3, quantidade3, insumo4, quantidade4,
            insumo5, quantidade5, anexo
        } = req.body;

        const result = await pool.query(`
            INSERT INTO joaoafiune.planejado (
                data_criacao, os, supervisor, equipe, nome_lider, operador,
                maquina, fazenda, talhao, atividade, modalidade, produzido,
                area_total, restante, status, tarifa, nf_lotemudas, viveiro,
                clone, plantadas, descarte, insumo1, quantidade1, insumo2,
                quantidade2, insumo3, quantidade3, insumo4, quantidade4,
                insumo5, quantidade5, anexo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31
            ) RETURNING *
        `, [
            data_criacao, os, supervisor, equipe, nome_lider, operador,
            maquina, fazenda, talhao, atividade, modalidade, produzido,
            area_total, restante, status, tarifa, nf_lotemudas, viveiro,
            clone, plantadas, descarte, insumo1, quantidade1, insumo2,
            quantidade2, insumo3, quantidade3, insumo4, quantidade4,
            insumo5, quantidade5, anexo
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar planejado:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - CADASTRO DE PARADAS ==========

// Listar todas as paradas cadastradas
app.get('/api/cadastro-paradas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM joaoafiune.cadastro_paradas ORDER BY nome_parada');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar paradas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS - PARADAS DE RENDIMENTO ==========

// Criar paradas de rendimento para um apontamento
app.post('/api/paradas-rendimento', async (req, res) => {
    try {
        const { id_apontamento, paradas, apontamento_data } = req.body;
        
        if (!paradas || paradas.length === 0) {
            return res.status(201).json({ message: 'Nenhuma parada para inserir' });
        }

        const results = [];
        for (const parada of paradas) {
            // Calcular total de horas (diferença entre início e fim)
            let total = null;
            if (parada.hora_inicio && parada.hora_fim) {
                const [h1, m1] = parada.hora_inicio.split(':').map(Number);
                const [h2, m2] = parada.hora_fim.split(':').map(Number);
                const minutos1 = h1 * 60 + m1;
                const minutos2 = h2 * 60 + m2;
                const diffMinutos = minutos2 - minutos1;
                const horas = Math.floor(Math.abs(diffMinutos) / 60);
                const minutos = Math.abs(diffMinutos) % 60;
                total = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
            }

            const result = await pool.query(`
                INSERT INTO joaoafiune.paradas_rendimento (
                    id_apontamento, data, supervisor, equipe, nome_lider, 
                    maquina, atividade, tipo_parada, producao, hora_inicio, hora_final, total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
            `, [
                id_apontamento,
                apontamento_data?.data || null,
                apontamento_data?.supervisor || null,
                apontamento_data?.equipe || null,
                apontamento_data?.nome_lider || null,
                apontamento_data?.maquina || null,
                apontamento_data?.atividade || null, // Serviço do apontamento (Plantio, Adubação, etc)
                parada.motivo || null, // Motivo da parada vai para tipo_parada
                apontamento_data?.producao || null, // Produção do apontamento
                parada.hora_inicio,
                parada.hora_fim,
                total
            ]);
            
            results.push(result.rows[0]);
        }

        res.status(201).json(results);
    } catch (error) {
        console.error('Erro ao criar paradas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 API disponível em http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponível em http://localhost:${PORT}\n`);
});
