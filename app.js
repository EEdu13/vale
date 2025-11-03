// API Configuration - Usa a URL atual do navegador para funcionar com ngrok
const API_URL = `${window.location.protocol}//${window.location.host}/api`;
console.log('🌐 API_URL configurada para:', API_URL);

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('Service Worker registrado!');
                
                // Listener para mensagens do Service Worker
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'APP_UPDATED') {
                        // Mostrar notificação de atualização
                        if (confirm('🎉 App atualizado! Clique OK para recarregar e aplicar as melhorias.')) {
                            // Limpar todo o cache e recarregar
                            caches.keys().then(names => {
                                names.forEach(name => caches.delete(name));
                            }).then(() => {
                                window.location.reload(true);
                            });
                        }
                    }
                });
            })
            .catch(err => console.log('Erro ao registrar Service Worker:', err));
    });
}

// IndexedDB Setup
let db;
const dbName = 'SilvaCollectDB';
const dbVersion = 3; // Incrementado para adicionar store de paradas

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Store para apontamentos
            if (!db.objectStoreNames.contains('apontamentos')) {
                const apontamentosStore = db.createObjectStore('apontamentos', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                apontamentosStore.createIndex('data', 'data', { unique: false });
                apontamentosStore.createIndex('tipo', 'tipo', { unique: false });
                apontamentosStore.createIndex('status', 'status', { unique: false });
            }

            // Store para ordens de serviço (planejados)
            if (!db.objectStoreNames.contains('ordensServico')) {
                const osStore = db.createObjectStore('ordensServico', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para colaboradores
            if (!db.objectStoreNames.contains('colaboradores')) {
                db.createObjectStore('colaboradores', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para frotas
            if (!db.objectStoreNames.contains('frotas')) {
                db.createObjectStore('frotas', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para atividades
            if (!db.objectStoreNames.contains('atividades')) {
                db.createObjectStore('atividades', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para fazendas
            if (!db.objectStoreNames.contains('fazendas')) {
                db.createObjectStore('fazendas', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para insumos
            if (!db.objectStoreNames.contains('insumos')) {
                db.createObjectStore('insumos', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para viveiros
            if (!db.objectStoreNames.contains('viveiros')) {
                db.createObjectStore('viveiros', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para clones
            if (!db.objectStoreNames.contains('clones')) {
                db.createObjectStore('clones', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para paradas cadastradas
            if (!db.objectStoreNames.contains('paradas')) {
                db.createObjectStore('paradas', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }

            // Store para usuário logado
            if (!db.objectStoreNames.contains('usuario')) {
                db.createObjectStore('usuario', { keyPath: 'id' });
            }
        };
    });
}

// Database Operations
function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getData(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== API & CACHE FUNCTIONS ==========
const API_BASE_URL = API_URL; // Usa a mesma URL dinâmica
let isOnline = navigator.onLine;

// Verificar status online/offline
window.addEventListener('online', () => {
    isOnline = true;
    updateOnlineStatus();
    showToast('Conexão restaurada! Você pode sincronizar os dados.', 'success');
});

window.addEventListener('offline', () => {
    isOnline = false;
    updateOnlineStatus();
    showToast('Você está offline. Os dados serão salvos localmente.', 'warning');
});

// Função para fazer requisições à API
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// ========== SINCRONIZAÇÃO DE CACHE ==========

// Carregar dados do servidor e cachear localmente
async function syncCacheFromServer() {
    if (!isOnline) {
        showToast('Você está offline. Usando dados em cache.', 'warning');
        return false;
    }

    try {
        showToast('Sincronizando dados do servidor...', 'info');

        // 1. Fazendas
        console.log('📥 Carregando fazendas...');
        const fazendas = await fetchAPI('/fazendas');
        await clearStore('fazendas');
        for (const fazenda of fazendas) {
            await addData('fazendas', { 
                id: fazenda.fazenda + '_' + fazenda.talhao,
                fazenda: fazenda.fazenda, 
                talhao: fazenda.talhao, 
                area_total: fazenda.area_total 
            });
        }

        // 2. Frotas
        console.log('📥 Carregando frotas...');
        const frotas = await fetchAPI('/frotas');
        await clearStore('frotas');
        for (let i = 0; i < frotas.length; i++) {
            await addData('frotas', { 
                id: i + 1,
                ...frotas[i]
            });
        }

        // 3. Colaboradores (apenas operadores)
        console.log('📥 Carregando colaboradores...');
        const colaboradores = await fetchAPI('/colaboradores');
        await clearStore('colaboradores');
        const operadores = colaboradores.filter(c => c.funcao && c.funcao.toLowerCase().includes('operador'));
        for (let i = 0; i < operadores.length; i++) {
            await addData('colaboradores', { 
                id: i + 1,
                ...operadores[i]
            });
        }

        // 4. Atividades
        console.log('📥 Carregando atividades...');
        const atividades = await fetchAPI('/atividades');
        await clearStore('atividades');
        for (let i = 0; i < atividades.length; i++) {
            await addData('atividades', { 
                id: i + 1,
                ...atividades[i]
            });
        }

        // 5. Insumos
        console.log('📥 Carregando insumos...');
        const insumos = await fetchAPI('/insumos');
        await clearStore('insumos');
        for (let i = 0; i < insumos.length; i++) {
            await addData('insumos', { 
                id: i + 1,
                ...insumos[i]
            });
        }

        // 6. Cadastro de Paradas
        console.log('📥 Carregando paradas cadastradas...');
        const paradas = await fetchAPI('/cadastro-paradas');
        await clearStore('paradas');
        for (let i = 0; i < paradas.length; i++) {
            await addData('paradas', { 
                id: i + 1,
                nome_parada: paradas[i].nome_parada,
                tipo: paradas[i].tipo
            });
        }

        // 7. Planejados (Ordens de Serviço)
        console.log('📥 Carregando ordens de serviço...');
        const planejados = await fetchAPI('/planejado');
        await clearStore('ordensServico');
        for (const os of planejados) {
            await addData('ordensServico', { 
                id: os.id,
                prefixo: os.maquina,
                operador: os.operador,
                codigo: os.atividade,
                servico: os.atividade,
                fazenda: os.fazenda,
                talhao: os.talhao,
                areaTotal: os.area_total,
                status: os.status || 'Pendente'
            });
        }

        console.log('✅ Cache atualizado com sucesso!');
        showToast('Dados sincronizados com sucesso!', 'success');
        return true;

    } catch (error) {
        console.error('Erro ao sincronizar cache:', error);
        showToast('Erro ao sincronizar dados. Usando cache local.', 'error');
        return false;
    }
}

// Sincronizar apontamentos pendentes (offline → servidor)
async function syncPendingApontamentos() {
    if (!isOnline) {
        showToast('Você está offline. Conecte-se para sincronizar.', 'warning');
        return;
    }

    try {
        const apontamentos = await getAllData('apontamentos');
        const pendentes = apontamentos.filter(a => a.syncStatus === 'pending');

        if (pendentes.length === 0) {
            showToast('Nenhum apontamento pendente para sincronizar.', 'info');
            return;
        }

        showToast(`Sincronizando ${pendentes.length} apontamento(s)...`, 'info');

        let sucessos = 0;
        let erros = 0;

        for (const apontamento of pendentes) {
            try {
                // Enviar para o servidor
                await fetchAPI('/apontamentos', {
                    method: 'POST',
                    body: JSON.stringify(apontamento)
                });

                // Marcar como sincronizado
                await updateData('apontamentos', {
                    ...apontamento,
                    syncStatus: 'synced',
                    syncedAt: new Date().toISOString()
                });

                sucessos++;
            } catch (error) {
                console.error('Erro ao sincronizar apontamento:', error);
                erros++;
            }
        }

        if (sucessos > 0) {
            showToast(`${sucessos} apontamento(s) sincronizado(s) com sucesso!`, 'success');
        }
        if (erros > 0) {
            showToast(`${erros} apontamento(s) falharam na sincronização.`, 'error');
        }

        // Atualizar tabela
        await loadApontamentosTable();

    } catch (error) {
        console.error('Erro ao sincronizar apontamentos:', error);
        showToast('Erro ao sincronizar apontamentos!', 'error');
    }
}

// Sincronização completa (cache + apontamentos)
async function syncAll() {
    // ✅ DADOS MOCKADOS ATIVOS - Sistema em modo demonstração
    showToast('✅ Dados mockados carregados com sucesso!', 'success');
    await initSampleData(); // Carregar dados de exemplo
    return;
    
    /* API sync desabilitado para demo
    const cacheSync = await syncCacheFromServer();
    if (cacheSync) {
        await syncPendingApontamentos();
        await loadDropdowns(); // Recarregar dropdowns com novos dados
    }
    */
}

// Initialize sample data
async function initSampleData() {
    const colaboradores = await getAllData('colaboradores');
    if (colaboradores.length === 0) {
        await addData('colaboradores', { nome: 'João Silva', matricula: '001' });
        await addData('colaboradores', { nome: 'Maria Santos', matricula: '002' });
        await addData('colaboradores', { nome: 'Pedro Oliveira', matricula: '003' });
    }

    const atividades = await getAllData('atividades');
    if (atividades.length === 0) {
        // Serviços MANUAIS
        await addData('atividades', { codigo: 'PLT-001', nome: 'Plantio Manual', tarifa: 625.00, tipo: 'plantio' });
        await addData('atividades', { codigo: 'ADU-001', nome: 'Adubação Manual', tarifa: 390.00, tipo: 'manutencao' });
        await addData('atividades', { codigo: 'ROC-001', nome: 'Roçada', tarifa: 450.00, tipo: 'manutencao' });
        // Serviços MECANIZADOS
        await addData('atividades', { codigo: 'HER-001', nome: 'Herbicida Mecanizado', tarifa: 580.00, tipo: 'manutencao' });
        await addData('atividades', { codigo: 'ADU-002', nome: 'Adubação Mecanizada', tarifa: 720.00, tipo: 'manutencao' });
    }

    const fazendas = await getAllData('fazendas');
    if (fazendas.length === 0) {
        await addData('fazendas', { 
            nome: 'Fazenda São José', 
            talhoes: [
                { codigo: '0001', area: 25.5 },
                { codigo: '0002', area: 30.2 },
                { codigo: '0003', area: 18.7 }
            ]
        });
        await addData('fazendas', { 
            nome: 'Fazenda Boa Vista', 
            talhoes: [
                { codigo: '0001', area: 40.0 },
                { codigo: '0002', area: 35.8 }
            ]
        });
    }

    const insumos = await getAllData('insumos');
    if (insumos.length === 0) {
        await addData('insumos', { nome: 'Formicida' });
        await addData('insumos', { nome: 'Adubo NPK 20-05-20' });
        await addData('insumos', { nome: 'Herbicida Glifosato' });
        await addData('insumos', { nome: 'Calcário' });
        await addData('insumos', { nome: 'Sulfato de Amônio' });
    }

    const frotas = await getAllData('frotas');
    if (frotas.length === 0) {
        await addData('frotas', { prefixo: 'FL-001', tipo: 'Trator' });
        await addData('frotas', { prefixo: 'FL-002', tipo: 'Caminhão' });
    }

    // Adicionar viveiros
    const viveiros = await getAllData('viveiros');
    if (viveiros.length === 0) {
        await addData('viveiros', { nome: 'Viveiro Central' });
        await addData('viveiros', { nome: 'Viveiro Norte' });
        await addData('viveiros', { nome: 'Viveiro Sul' });
    }

    // Adicionar clones
    const clones = await getAllData('clones');
    if (clones.length === 0) {
        await addData('clones', { codigo: 'CL-001', nome: 'Eucalyptus Urograndis' });
        await addData('clones', { codigo: 'CL-002', nome: 'Eucalyptus Saligna' });
        await addData('clones', { codigo: 'CL-003', nome: 'Eucalyptus Grandis' });
    }

    const ordensServico = await getAllData('ordensServico');
    if (ordensServico.length === 0) {
        // OS MANUAIS (sem prefixo de máquina)
        await addData('ordensServico', {
            numero: 'OS-2025-001',
            tipo: 'manual',
            prefixo: null,
            operador: 'Equipe A',
            codigo: 'PLT-001',
            servico: 'Plantio Manual',
            fazenda: 'Fazenda São José',
            talhao: '0001',
            areaTotal: 25.5,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-002',
            tipo: 'manual',
            prefixo: null,
            operador: 'Equipe B',
            codigo: 'ADU-001',
            servico: 'Adubação Manual',
            fazenda: 'Fazenda Boa Vista',
            talhao: '0001',
            areaTotal: 40.0,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-003',
            tipo: 'manual',
            prefixo: null,
            operador: 'Equipe C',
            codigo: 'ROC-001',
            servico: 'Roçada',
            fazenda: 'Fazenda São José',
            talhao: '0002',
            areaTotal: 30.2,
            status: 'Pendente'
        });
        
        // OS MECANIZADAS (com prefixo de máquina)
        await addData('ordensServico', {
            numero: 'OS-2025-004',
            tipo: 'mecanizado',
            prefixo: 'FL-001',
            operador: 'João Silva',
            codigo: 'HER-001',
            servico: 'Herbicida Mecanizado',
            fazenda: 'Fazenda Boa Vista',
            talhao: '0002',
            areaTotal: 35.8,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-005',
            tipo: 'mecanizado',
            prefixo: 'FL-002',
            operador: 'Maria Santos',
            codigo: 'ADU-002',
            servico: 'Adubação Mecanizada',
            fazenda: 'Fazenda São José',
            talhao: '0003',
            areaTotal: 18.7,
            status: 'Pendente'
        });
        
        // Mais OS MANUAIS
        await addData('ordensServico', {
            numero: 'OS-2025-006',
            tipo: 'manual',
            prefixo: null,
            operador: 'Equipe D',
            codigo: 'PLT-001',
            servico: 'Plantio Manual',
            fazenda: 'Fazenda Boa Vista',
            talhao: '0002',
            areaTotal: 35.8,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-007',
            tipo: 'manual',
            prefixo: null,
            operador: 'Equipe A',
            codigo: 'ROC-001',
            servico: 'Roçada',
            fazenda: 'Fazenda Boa Vista',
            talhao: '0001',
            areaTotal: 40.0,
            status: 'Pendente'
        });
        
        // Mais OS MECANIZADAS
        await addData('ordensServico', {
            numero: 'OS-2025-008',
            tipo: 'mecanizado',
            prefixo: 'FL-001',
            operador: 'Pedro Oliveira',
            codigo: 'HER-001',
            servico: 'Herbicida Mecanizado',
            fazenda: 'Fazenda São José',
            talhao: '0001',
            areaTotal: 25.5,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-009',
            tipo: 'mecanizado',
            prefixo: 'FL-002',
            operador: 'João Silva',
            codigo: 'ADU-002',
            servico: 'Adubação Mecanizada',
            fazenda: 'Fazenda Boa Vista',
            talhao: '0002',
            areaTotal: 35.8,
            status: 'Pendente'
        });
        await addData('ordensServico', {
            numero: 'OS-2025-010',
            tipo: 'mecanizado',
            prefixo: 'FL-001',
            operador: 'Maria Santos',
            codigo: 'HER-001',
            servico: 'Herbicida Mecanizado',
            fazenda: 'Fazenda São José',
            talhao: '0002',
            areaTotal: 30.2,
            status: 'Pendente'
        });
    }

    // Adicionar paradas mockadas
    const paradas = await getAllData('paradas');
    if (paradas.length === 0) {
        await addData('paradas', { id: 1, nome_parada: 'Refeição', tipo: 'programada' });
        await addData('paradas', { id: 2, nome_parada: 'Manutenção', tipo: 'nao_programada' });
        await addData('paradas', { id: 3, nome_parada: 'Abastecimento', tipo: 'programada' });
        await addData('paradas', { id: 4, nome_parada: 'Chuva', tipo: 'climatica' });
        await addData('paradas', { id: 5, nome_parada: 'Quebra', tipo: 'nao_programada' });
        await addData('paradas', { id: 6, nome_parada: 'Falta de Insumo', tipo: 'nao_programada' });
        await addData('paradas', { id: 7, nome_parada: 'Treinamento', tipo: 'programada' });
        await addData('paradas', { id: 8, nome_parada: 'Outros', tipo: 'outros' });
    }
}

// Função para pegar nome do usuário logado
async function getLoggedUser() {
    const usuario = await getData('usuario', 1);
    return usuario?.nome || 'Operador';
}

// ============= CONFIGURAÇÃO DE CLIMA =============
const WEATHER_CONFIG = {
    DEFAULT_LOCATION: {
        lat: -24.3207,
        lon: -50.6153,
        city: 'Telêmaco Borba',
        state: 'PR'
    },
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutos
    TIMEOUT_GEOLOCATION: 8000,
    TIMEOUT_API: 5000
};

// Códigos WMO (World Meteorological Organization)
const WMO_CODES = {
    0: { icon: '☀️', desc: 'Céu limpo' },
    1: { icon: '🌤️', desc: 'Principalmente limpo' },
    2: { icon: '⛅', desc: 'Parcialmente nublado' },
    3: { icon: '☁️', desc: 'Nublado' },
    45: { icon: '🌫️', desc: 'Neblina' },
    48: { icon: '🌫️', desc: 'Nevoeiro' },
    51: { icon: '🌦️', desc: 'Garoa leve' },
    53: { icon: '🌦️', desc: 'Garoa moderada' },
    55: { icon: '🌦️', desc: 'Garoa densa' },
    61: { icon: '🌧️', desc: 'Chuva leve' },
    63: { icon: '🌧️', desc: 'Chuva moderada' },
    65: { icon: '🌧️', desc: 'Chuva forte' },
    71: { icon: '❄️', desc: 'Neve leve' },
    73: { icon: '❄️', desc: 'Neve moderada' },
    75: { icon: '❄️', desc: 'Neve forte' },
    80: { icon: '🌧️', desc: 'Pancadas leves' },
    81: { icon: '🌧️', desc: 'Pancadas moderadas' },
    82: { icon: '🌧️', desc: 'Pancadas fortes' },
    95: { icon: '⛈️', desc: 'Trovoada' },
    96: { icon: '⛈️', desc: 'Trovoada com granizo' },
    99: { icon: '⛈️', desc: 'Trovoada forte' }
};

// ============= FUNÇÃO PRINCIPAL =============
async function loadWeatherInfo() {
    console.log('🌤️ Iniciando sistema de clima...');
    
    try {
        // 1. Verificar cache primeiro
        const cachedWeather = getWeatherCache();
        if (cachedWeather) {
            console.log('💾 Usando clima do cache');
            displayWeather(cachedWeather);
            return;
        }

        // 2. Usar localização padrão (Telêmaco Borba)
        const location = WEATHER_CONFIG.DEFAULT_LOCATION;
        console.log(`📍 Usando localização: ${location.city}, ${location.state}`);

        // 3. Buscar dados do clima
        const weatherData = await fetchWeatherData(location);
        
        if (weatherData) {
            displayWeather(weatherData);
            saveWeatherCache(weatherData);
        } else {
            // Fallback para cache antigo
            const oldCache = getWeatherCache(true);
            if (oldCache) {
                console.log('💾 Usando clima do cache antigo');
                displayWeather(oldCache);
            } else {
                throw new Error('Nenhuma fonte de dados disponível');
            }
        }
    } catch (error) {
        console.error('❌ Erro fatal no sistema de clima:', error);
        updateWeatherDisplay('🌤️', '24°C', 'Clima agradável');
    }
}

// Função para pedir permissão explícita
async function requestWeatherPermission() {
    try {
        const location = await getUserLocation();
        console.log(`✅ Localização do usuário obtida: ${location.lat}, ${location.lon}`);
        
        const weatherData = await fetchWeatherData(location);
        if (weatherData) {
            displayWeather(weatherData);
            saveWeatherCache(weatherData);
        }
        
        // Esconder botão
        document.getElementById('weatherPermissionBtn').style.display = 'none';
    } catch (error) {
        console.error('❌ Erro ao obter localização:', error);
        showToast('Não foi possível obter sua localização. Usando Telêmaco Borba.', 'warning');
    }
}

// ============= GEOLOCALIZAÇÃO =============
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada'));
            return;
        }

        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout na geolocalização'));
        }, WEATHER_CONFIG.TIMEOUT_GEOLOCATION);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timeoutId);
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
            { 
                timeout: WEATHER_CONFIG.TIMEOUT_GEOLOCATION,
                enableHighAccuracy: false,
                maximumAge: 600000 // 10 minutos
            }
        );
    });
}

// ============= BUSCAR CLIMA (CASCATA) =============
async function fetchWeatherData(location) {
    console.log(`🌍 Buscando clima para: ${location.lat}, ${location.lon}`);
    
    // Tentar Open-Meteo (API principal)
    const openMeteoData = await tryOpenMeteo(location.lat, location.lon);
    if (openMeteoData) return openMeteoData;

    // Tentar wttr.in (fallback)
    const wttrData = await tryWttrIn(location.lat, location.lon);
    if (wttrData) return wttrData;

    console.error('❌ Todas as APIs falharam');
    return null;
}

// ============= API 1: OPEN-METEO (PRINCIPAL) =============
async function tryOpenMeteo(lat, lon) {
    try {
        console.log('🌐 Tentando Open-Meteo...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEATHER_CONFIG.TIMEOUT_API);
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=America/Sao_Paulo`;
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Open-Meteo respondeu:', data);
        
        const weatherCode = data.current_weather.weathercode;
        const wmoData = WMO_CODES[weatherCode] || WMO_CODES[0];
        
        return {
            temperature: Math.round(data.current_weather.temperature),
            condition: wmoData.desc,
            icon: wmoData.icon,
            location: `${WEATHER_CONFIG.DEFAULT_LOCATION.city}, ${WEATHER_CONFIG.DEFAULT_LOCATION.state}`,
            timestamp: Date.now(),
            source: 'open-meteo'
        };
    } catch (error) {
        console.log('❌ Open-Meteo falhou:', error.message);
        return null;
    }
}

// ============= API 2: WTTR.IN (FALLBACK) =============
async function tryWttrIn(lat, lon) {
    try {
        console.log('� Tentando wttr.in...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEATHER_CONFIG.TIMEOUT_API);
        
        const url = `https://wttr.in/${lat},${lon}?format=j1`;
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ wttr.in respondeu:', data);
        
        const current = data.current_condition[0];
        
        return {
            temperature: parseInt(current.temp_C),
            condition: translateWeatherCondition(current.weatherDesc[0].value),
            icon: getWeatherIcon(current.weatherCode),
            location: `${WEATHER_CONFIG.DEFAULT_LOCATION.city}, ${WEATHER_CONFIG.DEFAULT_LOCATION.state}`,
            timestamp: Date.now(),
            source: 'wttr.in'
        };
    } catch (error) {
        console.log('❌ wttr.in falhou:', error.message);
        return null;
    }
}

// ============= CACHE =============
function getWeatherCache(ignoreExpiration = false) {
    try {
        const cached = localStorage.getItem('weather_cache');
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        if (!ignoreExpiration && age > WEATHER_CONFIG.CACHE_DURATION) {
            console.log('💾 Cache expirado (idade: ' + Math.round(age / 60000) + ' min)');
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao ler cache:', error);
        return null;
    }
}

function saveWeatherCache(data) {
    try {
        localStorage.setItem('weather_cache', JSON.stringify(data));
        console.log('💾 Cache salvo com sucesso');
    } catch (error) {
        console.error('❌ Erro ao salvar cache:', error);
    }
}

// ============= EXIBIÇÃO =============
function displayWeather(data) {
    console.log(`✅ ${data.temperature}°C • ${data.condition} (fonte: ${data.source})`);
    updateWeatherDisplay(data.icon, `${data.temperature}°C`, data.condition);
}

function updateWeatherDisplay(icon, temp, desc) {
    const iconEl = document.getElementById('weatherIcon');
    const tempEl = document.getElementById('weatherTemp');
    const descEl = document.getElementById('weatherDesc');
    
    if (iconEl) iconEl.textContent = icon;
    if (tempEl) tempEl.textContent = temp;
    if (descEl) descEl.textContent = desc;
}

// ============= TRADUÇÕES =============
function translateWeatherCondition(englishCondition) {
    const translations = {
        'Clear': 'Limpo',
        'Sunny': 'Ensolarado',
        'Partly cloudy': 'Parcialmente nublado',
        'Cloudy': 'Nublado',
        'Overcast': 'Encoberto',
        'Mist': 'Névoa',
        'Fog': 'Neblina',
        'Light rain': 'Chuva leve',
        'Moderate rain': 'Chuva moderada',
        'Heavy rain': 'Chuva forte',
        'Light snow': 'Neve leve',
        'Heavy snow': 'Neve forte',
        'Thundery outbreaks possible': 'Possível trovoada'
    };
    return translations[englishCondition] || englishCondition;
}

function getWeatherIcon(code) {
    const codeMap = {
        113: '☀️', 116: '⛅', 119: '☁️', 122: '☁️',
        143: '🌫️', 176: '🌦️', 200: '⛈️', 227: '🌨️',
        248: '🌫️', 260: '🌫️', 263: '🌦️', 266: '🌧️',
        293: '🌧️', 296: '🌧️', 299: '🌧️', 302: '🌧️',
        305: '🌧️', 308: '🌧️', 311: '🌧️', 314: '🌧️',
        317: '🌨️', 320: '🌨️', 323: '🌨️', 326: '🌨️',
        329: '🌨️', 332: '🌨️', 335: '🌨️', 338: '🌨️',
        350: '🌧️', 353: '🌦️', 356: '🌧️', 359: '🌧️',
        362: '🌨️', 365: '🌨️', 368: '🌨️', 371: '🌨️',
        374: '🌨️', 377: '🌨️', 386: '⛈️', 389: '⛈️',
        392: '⛈️', 395: '⛈️'
    };
    return codeMap[code] || '🌤️';
}

// Load dropdown options
async function loadDropdowns() {
    // Carregar operadores - TODOS OS FORMULÁRIOS
    const colaboradores = await getAllData('colaboradores');
    const operadorSelects = document.querySelectorAll('#avulso_operador, #manual_operador, #mecanizada_operador, #plan_operador');
    operadorSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        colaboradores.forEach(col => {
            const option = document.createElement('option');
            option.value = col.nome;
            option.textContent = col.nome;
            select.appendChild(option);
        });
    });

    // Carregar prefixos (frotas) - TODOS OS FORMULÁRIOS
    const frotas = await getAllData('frotas');
    const prefixoSelects = document.querySelectorAll('#avulso_prefixo, #manual_prefixo, #mecanizada_prefixo, #plan_prefixo');
    prefixoSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        frotas.forEach(frota => {
            const option = document.createElement('option');
            option.value = frota.prefixo;
            option.textContent = `${frota.prefixo} - ${frota.tipo}`;
            select.appendChild(option);
        });
    });

    // Carregar serviços - TODOS OS FORMULÁRIOS
    const atividades = await getAllData('atividades');
    const servicoSelects = document.querySelectorAll('#avulso_servico, #manual_servico, #mecanizada_servico, #plan_servico');
    servicoSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        atividades.forEach(atv => {
            const option = document.createElement('option');
            option.value = atv.nome;
            option.textContent = `${atv.codigo} - ${atv.nome}`;
            option.dataset.codigo = atv.codigo;
            option.dataset.tipo = atv.tipo;
            select.appendChild(option);
        });
    });

    // Carregar fazendas - TODOS OS FORMULÁRIOS
    const fazendas = await getAllData('fazendas');
    const fazendaSelects = document.querySelectorAll('#avulso_fazenda, #manual_fazenda, #mecanizada_fazenda, #plan_fazenda');
    fazendaSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        fazendas.forEach(faz => {
            const option = document.createElement('option');
            option.value = faz.nome;
            option.textContent = faz.nome;
            option.dataset.id = faz.id;
            select.appendChild(option);
        });
    });

    // Carregar insumos (sem unidade) - TODOS OS FORMULÁRIOS
    const insumos = await getAllData('insumos');
    const insumoSelects = document.querySelectorAll('[id^="avulso_insumo"], [id^="manual_insumo"], [id^="mecanizada_insumo"], [id^="plan_insumo"]');
    insumoSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        insumos.forEach(ins => {
            const option = document.createElement('option');
            option.value = ins.insumo || ins.nome;
            option.textContent = ins.insumo || ins.nome;
            select.appendChild(option);
        });
    });

    // Carregar paradas cadastradas - TODOS OS FORMULÁRIOS
    const paradas = await getAllData('paradas');
    const paradaSelects = document.querySelectorAll('[id^="avulso_parada_motivo"], [id^="manual_parada_motivo"], [id^="mecanizada_parada_motivo"], [id^="plan_parada_motivo"]');
    paradaSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        paradas.forEach(parada => {
            const option = document.createElement('option');
            option.value = parada.nome_parada;
            option.textContent = parada.nome_parada;
            select.appendChild(option);
        });
    });

    // Carregar viveiros - TODOS OS FORMULÁRIOS
    const viveiros = await getAllData('viveiros');
    const viveiroSelects = document.querySelectorAll('#avulso_viveiro, #manual_viveiro, #mecanizada_viveiro, #plan_viveiro');
    viveiroSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        viveiros.forEach(viv => {
            const option = document.createElement('option');
            option.value = viv.nome;
            option.textContent = viv.nome;
            select.appendChild(option);
        });
    });

    // Carregar clones - TODOS OS FORMULÁRIOS
    const clones = await getAllData('clones');
    const cloneSelects = document.querySelectorAll('#avulso_clone, #manual_clone, #mecanizada_clone, #plan_clone');
    cloneSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione...</option>';
        clones.forEach(clone => {
            const option = document.createElement('option');
            option.value = clone.codigo;
            option.textContent = `${clone.codigo} - ${clone.nome}`;
            select.appendChild(option);
        });
    });

    // Carregar ordens de serviço
    const ordensServico = await getAllData('ordensServico');
    const osSelect = document.getElementById('ordem_servico');
    if (osSelect) {
        osSelect.innerHTML = '<option value="">Selecione uma OS...</option>';
        ordensServico.forEach(os => {
            const option = document.createElement('option');
            option.value = os.id;
            option.textContent = `${os.numero} - ${os.servico} - ${os.fazenda}`;
            osSelect.appendChild(option);
        });
    }
}

// Load fazenda talhoes - AVULSO
document.getElementById('avulso_fazenda')?.addEventListener('change', async function() {
    const fazendaId = this.selectedOptions[0]?.dataset.id;
    if (fazendaId) {
        const fazenda = await getData('fazendas', parseInt(fazendaId));
        const talhaoSelect = document.getElementById('avulso_talhao');
        talhaoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        if (fazenda && fazenda.talhoes) {
            fazenda.talhoes.forEach(talhao => {
                const option = document.createElement('option');
                option.value = talhao.codigo;
                option.textContent = talhao.codigo;
                option.dataset.area = talhao.area;
                talhaoSelect.appendChild(option);
            });
        }
    }
});

// Load fazenda talhoes - MANUAL
document.getElementById('manual_fazenda')?.addEventListener('change', async function() {
    const fazendaId = this.selectedOptions[0]?.dataset.id;
    if (fazendaId) {
        const fazenda = await getData('fazendas', parseInt(fazendaId));
        const talhaoSelect = document.getElementById('manual_talhao');
        talhaoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        if (fazenda && fazenda.talhoes) {
            fazenda.talhoes.forEach(talhao => {
                const option = document.createElement('option');
                option.value = talhao.codigo;
                option.textContent = talhao.codigo;
                option.dataset.area = talhao.area;
                talhaoSelect.appendChild(option);
            });
        }
    }
});

// Load fazenda talhoes - MECANIZADA
document.getElementById('mecanizada_fazenda')?.addEventListener('change', async function() {
    const fazendaId = this.selectedOptions[0]?.dataset.id;
    if (fazendaId) {
        const fazenda = await getData('fazendas', parseInt(fazendaId));
        const talhaoSelect = document.getElementById('mecanizada_talhao');
        talhaoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        if (fazenda && fazenda.talhoes) {
            fazenda.talhoes.forEach(talhao => {
                const option = document.createElement('option');
                option.value = talhao.codigo;
                option.textContent = talhao.codigo;
                option.dataset.area = talhao.area;
                talhaoSelect.appendChild(option);
            });
        }
    }
});

// Load talhao area
document.getElementById('avulso_talhao')?.addEventListener('change', function() {
    const area = this.selectedOptions[0]?.dataset.area;
    if (area) {
        document.getElementById('avulso_area_total').value = area;
    }
});

document.getElementById('manual_talhao')?.addEventListener('change', function() {
    const area = this.selectedOptions[0]?.dataset.area;
    if (area) {
        document.getElementById('manual_area_total').value = area;
    }
});

document.getElementById('mecanizada_talhao')?.addEventListener('change', function() {
    const area = this.selectedOptions[0]?.dataset.area;
    if (area) {
        document.getElementById('mecanizada_area_total').value = area;
    }
});

// Calculate restante e verificar estouro
document.getElementById('avulso_produzido')?.addEventListener('input', function() {
    const areaTotal = parseFloat(document.getElementById('avulso_area_total').value) || 0;
    const produzido = parseFloat(this.value) || 0;
    const restante = areaTotal - produzido;
    document.getElementById('avulso_restante').value = restante.toFixed(2);
    
    // Verificar estouro de talhão
    const alertaEstouro = document.getElementById('estouro_alerta_avulso');
    if (produzido > areaTotal && areaTotal > 0) {
        alertaEstouro.style.display = 'block';
    } else {
        alertaEstouro.style.display = 'none';
    }
});

// Auto-fill codigo when servico is selected
document.getElementById('avulso_servico')?.addEventListener('change', function() {
    const codigo = this.selectedOptions[0]?.dataset.codigo;
    const tipo = this.selectedOptions[0]?.dataset.tipo;
    
    if (codigo) {
        document.getElementById('avulso_codigo').value = codigo;
    }
    
    // Mostrar/esconder seção de plantio
    const plantioSection = document.getElementById('avulso_plantio_section');
    if (tipo === 'plantio') {
        plantioSection.style.display = 'block';
    } else {
        plantioSection.style.display = 'none';
    }
});

// MANUAL - Auto-preencher código do serviço e controlar seção de plantio
document.getElementById('manual_servico')?.addEventListener('change', function() {
    const selectedOption = this.selectedOptions[0];
    const codigo = selectedOption?.dataset.codigo;
    const tipo = selectedOption?.dataset.tipo;
    
    if (codigo) {
        document.getElementById('manual_codigo').value = codigo;
    }
    
    // Mostrar/esconder seção de plantio
    const plantioSection = document.getElementById('manual_plantio_section');
    if (plantioSection) {
        plantioSection.style.display = tipo === 'plantio' ? 'block' : 'none';
    }
});

// Calcular total de mudas (plantadas + descarte)
document.getElementById('avulso_plantadas')?.addEventListener('input', calcularTotalMudas);
document.getElementById('avulso_descarte')?.addEventListener('input', calcularTotalMudas);

function calcularTotalMudas() {
    const plantadas = parseInt(document.getElementById('avulso_plantadas')?.value) || 0;
    const descarte = parseInt(document.getElementById('avulso_descarte')?.value) || 0;
    const total = plantadas + descarte;
    document.getElementById('avulso_total_mudas').value = total;
}

// Calcular total de mudas PLANEJADO
document.getElementById('plan_plantadas')?.addEventListener('input', calcularTotalMudasPlan);
document.getElementById('plan_descarte')?.addEventListener('input', calcularTotalMudasPlan);

function calcularTotalMudasPlan() {
    const plantadas = parseInt(document.getElementById('plan_plantadas')?.value) || 0;
    const descarte = parseInt(document.getElementById('plan_descarte')?.value) || 0;
    const total = plantadas + descarte;
    document.getElementById('plan_total_mudas').value = total;
}

// Gerenciar insumos dinâmicos
let insumoCount = 1;

async function addInsumoField() {
    insumoCount++;
    const container = document.getElementById('insumos_container');
    const insumos = await getAllData('insumos');
    
    const newRow = document.createElement('div');
    newRow.className = 'insumo-row';
    newRow.dataset.index = insumoCount;
    
    let insumosOptions = '<option value="">Selecione...</option>';
    insumos.forEach(ins => {
        insumosOptions += `<option value="${ins.nome}">${ins.nome}</option>`;
    });
    
    newRow.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; align-items: end;">
            <div class="form-group">
                <label for="avulso_insumo${insumoCount}">Insumo</label>
                <select id="avulso_insumo${insumoCount}">
                    ${insumosOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="avulso_quantidade${insumoCount}">Quantidade</label>
                <input type="number" id="avulso_quantidade${insumoCount}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-insumo-btn" onclick="removeInsumoField(${insumoCount})" style="background: var(--danger); color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Mostrar botão de remover do primeiro item se houver mais de 1
    if (insumoCount > 1) {
        const firstRemoveBtn = document.querySelector('.insumo-row[data-index="1"] .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'inline-block';
        }
    }
}

function removeInsumoField(index) {
    const row = document.querySelector(`.insumo-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
    
    // Se sobrar apenas 1, esconder o botão de remover
    const remainingRows = document.querySelectorAll('.insumo-row');
    if (remainingRows.length === 1) {
        const firstRemoveBtn = document.querySelector('.insumo-row .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

// Gerenciar insumos dinâmicos PLANEJADO
let insumoCountPlan = 1;

async function addInsumoFieldPlan() {
    insumoCountPlan++;
    const container = document.getElementById('insumos_container_plan');
    const insumos = await getAllData('insumos');
    
    const newRow = document.createElement('div');
    newRow.className = 'insumo-row';
    newRow.dataset.index = insumoCountPlan;
    
    let insumosOptions = '<option value="">Selecione...</option>';
    insumos.forEach(ins => {
        insumosOptions += `<option value="${ins.nome}">${ins.nome}</option>`;
    });
    
    newRow.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; align-items: end;">
            <div class="form-group">
                <label for="plan_insumo${insumoCountPlan}">Insumo</label>
                <select id="plan_insumo${insumoCountPlan}">
                    ${insumosOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="plan_quantidade${insumoCountPlan}">Quantidade</label>
                <input type="number" id="plan_quantidade${insumoCountPlan}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-insumo-btn" onclick="removeInsumoFieldPlan(${insumoCountPlan})" style="background: var(--danger); color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Mostrar botão de remover do primeiro item se houver mais de 1
    if (insumoCountPlan > 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_plan .insumo-row[data-index="1"] .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'inline-block';
        }
    }
}

function removeInsumoFieldPlan(index) {
    const row = document.querySelector(`#insumos_container_plan .insumo-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
    
    // Se sobrar apenas 1, esconder o botão de remover
    const remainingRows = document.querySelectorAll('#insumos_container_plan .insumo-row');
    if (remainingRows.length === 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_plan .insumo-row .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

// Gerenciar insumos dinâmicos MANUAL
let insumoCountManual = 1;

async function addInsumoFieldManual() {
    insumoCountManual++;
    const container = document.getElementById('insumos_container_manual');
    const insumos = await getAllData('insumos');
    
    const newRow = document.createElement('div');
    newRow.className = 'insumo-row';
    newRow.dataset.index = insumoCountManual;
    
    let insumosOptions = '<option value="">Selecione...</option>';
    insumos.forEach(ins => {
        insumosOptions += `<option value="${ins.nome}">${ins.nome}</option>`;
    });
    
    newRow.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; align-items: end;">
            <div class="form-group">
                <label for="manual_insumo${insumoCountManual}">Insumo</label>
                <select id="manual_insumo${insumoCountManual}">
                    ${insumosOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="manual_quantidade${insumoCountManual}">Quantidade</label>
                <input type="number" id="manual_quantidade${insumoCountManual}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-insumo-btn" onclick="removeInsumoFieldManual(${insumoCountManual})" style="background: var(--danger); color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Mostrar botão de remover do primeiro item se houver mais de 1
    if (insumoCountManual > 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_manual .insumo-row[data-index="1"] .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'inline-block';
        }
    }
}

function removeInsumoFieldManual(index) {
    const row = document.querySelector(`#insumos_container_manual .insumo-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
    
    // Se sobrar apenas 1, esconder o botão de remover
    const remainingRows = document.querySelectorAll('#insumos_container_manual .insumo-row');
    if (remainingRows.length === 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_manual .insumo-row .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

// Gerenciar insumos dinâmicos MECANIZADA
let insumoCountMecanizada = 1;

async function addInsumoFieldMecanizada() {
    insumoCountMecanizada++;
    const container = document.getElementById('insumos_container_mecanizada');
    const insumos = await getAllData('insumos');
    
    const newRow = document.createElement('div');
    newRow.className = 'insumo-row';
    newRow.dataset.index = insumoCountMecanizada;
    
    let insumosOptions = '<option value="">Selecione...</option>';
    insumos.forEach(ins => {
        insumosOptions += `<option value="${ins.nome}">${ins.nome}</option>`;
    });
    
    newRow.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; align-items: end;">
            <div class="form-group">
                <label for="mecanizada_insumo${insumoCountMecanizada}">Insumo</label>
                <select id="mecanizada_insumo${insumoCountMecanizada}">
                    ${insumosOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="mecanizada_quantidade${insumoCountMecanizada}">Quantidade</label>
                <input type="number" id="mecanizada_quantidade${insumoCountMecanizada}" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-insumo-btn" onclick="removeInsumoFieldMecanizada(${insumoCountMecanizada})" style="background: var(--danger); color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Mostrar botão de remover do primeiro item se houver mais de 1
    if (insumoCountMecanizada > 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_mecanizada .insumo-row[data-index="1"] .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'inline-block';
        }
    }
}

function removeInsumoFieldMecanizada(index) {
    const row = document.querySelector(`#insumos_container_mecanizada .insumo-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
    
    // Se sobrar apenas 1, esconder o botão de remover
    const remainingRows = document.querySelectorAll('#insumos_container_mecanizada .insumo-row');
    if (remainingRows.length === 1) {
        const firstRemoveBtn = document.querySelector('#insumos_container_mecanizada .insumo-row .remove-insumo-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

// Calculate planejado restante e verificar estouro
document.getElementById('plan_produzido')?.addEventListener('input', function() {
    const areaTotal = parseFloat(document.getElementById('plan_area_total').value) || 0;
    const produzido = parseFloat(this.value) || 0;
    const restante = areaTotal - produzido;
    document.getElementById('plan_restante').value = restante.toFixed(2);
    
    // Verificar estouro de talhão
    const alertaEstouro = document.getElementById('estouro_alerta_plan');
    if (produzido > areaTotal && areaTotal > 0) {
        alertaEstouro.style.display = 'block';
    } else {
        alertaEstouro.style.display = 'none';
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple validation (in production, validate against backend)
    if (username && password) {
        await updateData('usuario', { id: 1, nome: username, logado: true });
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').classList.add('active');
        document.getElementById('userName').textContent = username;
        
        // Usando dados mockados para demonstração
        showToast('Carregando dados mockados...', 'info');
        // await syncCacheFromServer();
        await loadDropdowns();
        showToast('Login realizado com sucesso!', 'success');
    } else {
        showToast('Usuário ou senha inválidos!', 'error');
    }
});

// Logout
async function logout() {
    await updateData('usuario', { id: 1, logado: false });
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showToast('Você saiu da plataforma', 'success');
}

// Navigation
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('avulsoForm').classList.remove('active');
    document.getElementById('manualForm').classList.remove('active');
    document.getElementById('mecanizadaForm').classList.remove('active');
    document.getElementById('buscaOSScreen').classList.remove('active');
    document.getElementById('planejadoForm').classList.remove('active');
    document.getElementById('relatorioTable').classList.remove('active');
}

function showAvulsoForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('avulsoForm').classList.add('active');
    document.getElementById('avulso_data').valueAsDate = new Date();
}

// Mostrar formulário de Operação Manual
function showManualForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('manualForm').classList.add('active');
    document.getElementById('manual_data').valueAsDate = new Date();
}

// Mostrar formulário de Operação Mecanizada
function showMecanizadaForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('mecanizadaForm').classList.add('active');
    document.getElementById('mecanizada_data').valueAsDate = new Date();
}

// Mostrar tela de busca de OS (Tela 1)
function showPlaneadoManualForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('buscaOSScreen').classList.add('active');
    document.getElementById('planejadoForm').classList.remove('active');
    
    // Definir tipo de OS para filtrar
    window.tipoOSAtual = 'manual';
    
    // Carregar lista de OS no select da tela de busca
    loadOrdemServicoSelect('manual');
}

function showPlaneadoMecanizadoForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('buscaOSScreen').classList.add('active');
    document.getElementById('planejadoForm').classList.remove('active');
    
    // Definir tipo de OS para filtrar
    window.tipoOSAtual = 'mecanizado';
    
    // Carregar lista de OS no select da tela de busca
    loadOrdemServicoSelect('mecanizado');
}

// Função antiga mantida para compatibilidade
function showPlaneadoForm() {
    showPlaneadoManualForm();
}

// Carregar lista de OS no select de busca
async function loadOrdemServicoSelect(tipoFiltro = null) {
    const select = document.getElementById('busca_ordem_servico');
    select.innerHTML = '<option value="">Selecione uma OS...</option>';
    
    const ordens = await getAllData('ordensServico');
    
    // Filtrar ordens por tipo se especificado
    const ordensFiltradas = tipoFiltro 
        ? ordens.filter(os => os.tipo === tipoFiltro)
        : ordens;
    
    ordensFiltradas.forEach(os => {
        const option = document.createElement('option');
        option.value = os.id;
        const tipoLabel = os.tipo === 'manual' ? '👷 Manual' : '🚜 Mecanizado';
        option.textContent = `${tipoLabel} | OS ${os.id} - ${os.prefixo || 'S/P'} - ${os.operador} - ${os.fazenda}/${os.talhao}`;
        select.appendChild(option);
    });
}

// Variável global para armazenar a OS selecionada
let osSelecionada = null;

// Selecionar OS e ir para tela de apontamento (Tela 2)
async function selecionarOS() {
    const osId = parseInt(document.getElementById('busca_ordem_servico').value);
    
    if (!osId) {
        showToast('Por favor, selecione uma Ordem de Serviço!', 'error');
        return;
    }
    
    const os = await getData('ordensServico', osId);
    if (!os) {
        showToast('Ordem de Serviço não encontrada!', 'error');
        return;
    }
    
    // Armazenar OS selecionada
    osSelecionada = os;
    
    // Ocultar tela de busca e mostrar formulário de apontamento
    document.getElementById('buscaOSScreen').classList.remove('active');
    document.getElementById('planejadoForm').classList.add('active');
    
    // Preencher informações da OS selecionada
    document.getElementById('os_selecionada_info').textContent = 
        `OS ${os.id} - ${os.prefixo} - ${os.operador} - ${os.fazenda}/${os.talhao}`;
    
    // Pré-preencher formulário
    document.getElementById('plan_data').valueAsDate = new Date();
    document.getElementById('plan_prefixo').value = os.prefixo || '';
    document.getElementById('plan_operador').value = os.operador || '';
    document.getElementById('plan_codigo').value = os.codigo || '';
    document.getElementById('plan_servico').value = os.servico || '';
    document.getElementById('plan_fazenda').value = os.fazenda || '';
    document.getElementById('plan_talhao').value = os.talhao || '';
    document.getElementById('plan_area_total').value = os.areaTotal || '';
    document.getElementById('plan_status').value = os.status || 'Em Andamento';
    
    // Verificar se é serviço de plantio
    const codigo = os.codigo || '';
    const plantioSection = document.getElementById('plan_plantio_section');
    if (codigo.startsWith('PLT')) {
        plantioSection.style.display = 'block';
    } else {
        plantioSection.style.display = 'none';
    }
    
    showToast('OS carregada com sucesso! Preencha os campos necessários.', 'success');
}

// Voltar para tela de busca de OS
function voltarParaBuscaOS() {
    document.getElementById('planejadoForm').classList.remove('active');
    document.getElementById('buscaOSScreen').classList.add('active');
    
    // Limpar formulário
    document.getElementById('planejadoFormData').reset();
    osSelecionada = null;
}

async function showRelatorio() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('relatorioTable').classList.add('active');
    await loadApontamentosTable();
}

// Submit Avulso Form
document.getElementById('avulsoFormData')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Verificar estouro de talhão
    const areaTotal = parseFloat(document.getElementById('avulso_area_total').value) || 0;
    const produzido = parseFloat(document.getElementById('avulso_produzido').value) || 0;
    
    if (produzido > areaTotal && areaTotal > 0) {
        showToast('❌ ESTOURO DE TALHÃO! O produzido não pode ser maior que a área total.', 'error');
        document.getElementById('estouro_alerta_avulso').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Coletar insumos dinamicamente
    const insumos = [];
    const insumoRows = document.querySelectorAll('.insumo-row');
    insumoRows.forEach(row => {
        const index = row.dataset.index;
        const insumo = document.getElementById(`avulso_insumo${index}`)?.value;
        const quantidade = parseFloat(document.getElementById(`avulso_quantidade${index}`)?.value) || 0;
        
        if (insumo && quantidade > 0) {
            insumos.push({ insumo, quantidade });
        }
    });

    // Coletar paradas dinamicamente
    const paradas = [];
    const paradaRows = document.querySelectorAll('#paradas_container_avulso .parada-row');
    paradaRows.forEach(row => {
        const index = row.dataset.index;
        const motivo = document.getElementById(`avulso_parada_motivo${index}`)?.value;
        const inicio = document.getElementById(`avulso_parada_inicio${index}`)?.value;
        const fim = document.getElementById(`avulso_parada_fim${index}`)?.value;
        
        if (motivo && inicio && fim) {
            paradas.push({ motivo, inicio, fim });
        }
    });

    const formData = {
        tipo: 'Avulso',
        data: document.getElementById('avulso_data').value,
        prefixo: document.getElementById('avulso_prefixo').value,
        operador: document.getElementById('avulso_operador').value,
        codigo: document.getElementById('avulso_codigo').value,
        status: document.getElementById('avulso_status').value,
        servico: document.getElementById('avulso_servico').value,
        fazenda: document.getElementById('avulso_fazenda').value,
        talhao: document.getElementById('avulso_talhao').value,
        produzido: parseFloat(document.getElementById('avulso_produzido').value),
        areaTotal: parseFloat(document.getElementById('avulso_area_total').value),
        restante: parseFloat(document.getElementById('avulso_restante').value),
        observacao: document.getElementById('avulso_observacao').value,
        horaInicio: document.getElementById('avulso_hora_inicio').value,
        horaFinal: document.getElementById('avulso_hora_final').value,
        paradas: paradas,
        horimetroInicial: horimetroData.inicial,
        horimetroFinal: horimetroData.final,
        viveiro: document.getElementById('avulso_viveiro').value,
        clone: document.getElementById('avulso_clone').value,
        plantadas: parseInt(document.getElementById('avulso_plantadas').value) || 0,
        descarte: parseInt(document.getElementById('avulso_descarte').value) || 0,
        totalMudas: parseInt(document.getElementById('avulso_total_mudas').value) || 0,
        insumos: insumos,
        timestamp: new Date().toISOString(),
        syncStatus: isOnline ? 'synced' : 'pending', // Status de sincronização
        createdOffline: !isOnline
    };

    try {
        // Pegar usuário logado
        const usuarioLogado = await getLoggedUser();
        
        // Buscar tarifa do serviço selecionado
        const atividades = await getAllData('atividades');
        const atividadeSelecionada = atividades.find(a => a.nome === document.getElementById('avulso_servico').value);
        const tarifa = atividadeSelecionada?.tarifa || null;
        
        // Preparar dados para envio ao banco
        const dbData = {
            data: document.getElementById('avulso_data').value,
            os: 'AVULSO', // Avulso envia "AVULSO"
            faturado: 'a faturar',
            supervisor: usuarioLogado,
            equipe: usuarioLogado,
            nome_lider: usuarioLogado,
            operador: document.getElementById('avulso_operador').value,
            maquina: document.getElementById('avulso_prefixo').value,
            fazenda: document.getElementById('avulso_fazenda').value,
            talhao: document.getElementById('avulso_talhao').value,
            atividade: document.getElementById('avulso_servico').value,
            codigo: document.getElementById('avulso_codigo').value || null,
            modalidade: document.getElementById('avulso_status').value,
            produzido: parseFloat(document.getElementById('avulso_produzido').value) || 0,
            area_total: parseFloat(document.getElementById('avulso_area_total').value) || 0,
            status: document.getElementById('avulso_status').value,
            tarifa: tarifa,
            qtd_colaboradores: parseInt(document.getElementById('avulso_qtd_colaboradores').value) || null,
            observacao: document.getElementById('avulso_observacao').value,
            hi: horimetroData.inicial || null,
            hf: horimetroData.final || null,
            hora_inicio: document.getElementById('avulso_hora_inicio').value || null,
            hora_final: document.getElementById('avulso_hora_final').value || null,
            nf_lotemudas: null,
            viveiro: document.getElementById('avulso_viveiro').value || null,
            clone: document.getElementById('avulso_clone').value || null,
            plantadas: parseInt(document.getElementById('avulso_plantadas').value) || null,
            descarte: parseInt(document.getElementById('avulso_descarte').value) || null,
            insumo1: insumos[0]?.insumo || null,
            quantidade1: insumos[0]?.quantidade || null,
            insumo2: insumos[1]?.insumo || null,
            quantidade2: insumos[1]?.quantidade || null,
            insumo3: insumos[2]?.insumo || null,
            quantidade3: insumos[2]?.quantidade || null,
            insumo4: insumos[3]?.insumo || null,
            quantidade4: insumos[3]?.quantidade || null,
            insumo5: insumos[4]?.insumo || null,
            quantidade5: insumos[4]?.quantidade || null,
            anexo: null
        };

        // Enviar apontamento para o banco
        const response = await fetch(`${API_URL}/apontamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        if (!response.ok) throw new Error('Erro ao salvar apontamento');
        
        const apontamentoSalvo = await response.json();
        
        // Se houver paradas, enviar para o banco
        if (paradas.length > 0) {
            const paradasData = paradas.map(p => ({
                motivo: p.motivo,
                hora_inicio: p.inicio,
                hora_fim: p.fim
            }));

            await fetch(`${API_URL}/paradas-rendimento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_apontamento: apontamentoSalvo.id,
                    paradas: paradasData,
                    apontamento_data: {
                        data: document.getElementById('avulso_data').value,
                        supervisor: usuarioLogado,
                        equipe: usuarioLogado,
                        nome_lider: usuarioLogado,
                        maquina: document.getElementById('avulso_prefixo').value,
                        atividade: document.getElementById('avulso_servico').value,
                        producao: parseFloat(document.getElementById('avulso_produzido').value) || 0
                    }
                })
            });
        }

        showToast('✅ Apontamento AVULSO salvo com sucesso!', 'success');
        
        this.reset();
        
        // Resetar horímetro
        horimetroData = { inicial: 0, final: 0 };
        
        // Resetar paradas para apenas 1 campo
        const paradasContainer = document.getElementById('paradas_container_avulso');
        const firstParadaRow = paradasContainer.querySelector('.parada-row[data-index="1"]');
        paradasContainer.innerHTML = '';
        paradasContainer.appendChild(firstParadaRow);
        document.getElementById('avulso_parada_motivo1').value = '';
        document.getElementById('avulso_parada_inicio1').value = '';
        document.getElementById('avulso_parada_fim1').value = '';
        const firstParadaRemoveBtn = firstParadaRow.querySelector('.remove-parada-btn');
        if (firstParadaRemoveBtn) firstParadaRemoveBtn.style.display = 'none';
        paradaCountAvulso = 1;
        
        // Resetar insumos para apenas 1 campo
        const container = document.getElementById('insumos_container');
        const firstRow = container.querySelector('.insumo-row[data-index="1"]');
        container.innerHTML = '';
        container.appendChild(firstRow);
        document.getElementById('avulso_insumo1').value = '';
        document.getElementById('avulso_quantidade1').value = '';
        const firstRemoveBtn = firstRow.querySelector('.remove-insumo-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
        insumoCount = 1;
        
        // Esconder seção de plantio
        document.getElementById('avulso_plantio_section').style.display = 'none';
        
        showMainMenu();
    } catch (error) {
        showToast('Erro ao salvar apontamento!', 'error');
        console.error(error);
    }
});

// Submit Planejado Form
document.getElementById('planejadoFormData')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Verificar estouro de talhão
    const areaTotal = parseFloat(document.getElementById('plan_area_total').value) || 0;
    const produzido = parseFloat(document.getElementById('plan_produzido').value) || 0;
    
    if (produzido > areaTotal && areaTotal > 0) {
        showToast('❌ ESTOURO DE TALHÃO! O produzido não pode ser maior que a área total.', 'error');
        document.getElementById('estouro_alerta_plan').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Coletar insumos dinamicamente do planejado
    const insumos = [];
    const insumoRows = document.querySelectorAll('#insumos_container_plan .insumo-row');
    insumoRows.forEach(row => {
        const index = row.dataset.index;
        const insumo = document.getElementById(`plan_insumo${index}`)?.value;
        const quantidade = parseFloat(document.getElementById(`plan_quantidade${index}`)?.value) || 0;
        
        if (insumo && quantidade > 0) {
            insumos.push({ insumo, quantidade });
        }
    });

    // Coletar paradas dinamicamente
    const paradas = [];
    const paradaRows = document.querySelectorAll('#paradas_container_plan .parada-row');
    paradaRows.forEach(row => {
        const index = row.dataset.index;
        const motivo = document.getElementById(`plan_parada_motivo${index}`)?.value;
        const inicio = document.getElementById(`plan_parada_inicio${index}`)?.value;
        const fim = document.getElementById(`plan_parada_fim${index}`)?.value;
        
        if (motivo && inicio && fim) {
            paradas.push({ motivo, inicio, fim });
        }
    });

    // Verificar se tem OS selecionada
    if (!osSelecionada) {
        showToast('Erro: Nenhuma OS selecionada!', 'error');
        return;
    }

    const formData = {
        tipo: 'Planejado',
        osId: osSelecionada.id,
        data: document.getElementById('plan_data').value,
        prefixo: document.getElementById('plan_prefixo').value,
        operador: document.getElementById('plan_operador').value,
        codigo: document.getElementById('plan_codigo').value,
        status: document.getElementById('plan_status').value,
        servico: document.getElementById('plan_servico').value,
        fazenda: document.getElementById('plan_fazenda').value,
        talhao: document.getElementById('plan_talhao').value,
        produzido: parseFloat(document.getElementById('plan_produzido').value),
        areaTotal: parseFloat(document.getElementById('plan_area_total').value),
        restante: parseFloat(document.getElementById('plan_restante').value),
        observacao: document.getElementById('plan_observacao').value,
        horaInicio: document.getElementById('plan_hora_inicio').value,
        horaFinal: document.getElementById('plan_hora_final').value,
        paradas: paradas,
        horimetroInicial: horimetroData.inicial,
        horimetroFinal: horimetroData.final,
        viveiro: document.getElementById('plan_viveiro').value,
        clone: document.getElementById('plan_clone').value,
        plantadas: parseInt(document.getElementById('plan_plantadas').value) || 0,
        descarte: parseInt(document.getElementById('plan_descarte').value) || 0,
        totalMudas: parseInt(document.getElementById('plan_total_mudas').value) || 0,
        insumos: insumos,
        timestamp: new Date().toISOString(),
        syncStatus: isOnline ? 'synced' : 'pending',
        createdOffline: !isOnline
    };

    try {
        // Pegar usuário logado
        const usuarioLogado = await getLoggedUser();
        
        // Buscar tarifa do serviço selecionado
        const atividades = await getAllData('atividades');
        const atividadeSelecionada = atividades.find(a => a.nome === document.getElementById('plan_servico').value);
        const tarifa = atividadeSelecionada?.tarifa || null;
        
        // Preparar dados para envio ao banco
        const dbData = {
            data: document.getElementById('plan_data').value,
            os: osSelecionada?.numero || null, // Número da OS
            faturado: 'a faturar',
            supervisor: usuarioLogado,
            equipe: usuarioLogado,
            nome_lider: usuarioLogado,
            operador: document.getElementById('plan_operador').value,
            maquina: document.getElementById('plan_prefixo').value,
            fazenda: document.getElementById('plan_fazenda').value,
            talhao: document.getElementById('plan_talhao').value,
            atividade: document.getElementById('plan_servico').value,
            codigo: document.getElementById('plan_codigo').value || null,
            modalidade: document.getElementById('plan_status').value,
            produzido: parseFloat(document.getElementById('plan_produzido').value) || 0,
            area_total: parseFloat(document.getElementById('plan_area_total').value) || 0,
            status: document.getElementById('plan_status').value,
            tarifa: tarifa,
            qtd_colaboradores: parseInt(document.getElementById('plan_qtd_colaboradores').value) || null,
            observacao: document.getElementById('plan_observacao').value,
            hi: horimetroData.inicial || null,
            hf: horimetroData.final || null,
            hora_inicio: document.getElementById('plan_hora_inicio').value || null,
            hora_final: document.getElementById('plan_hora_final').value || null,
            nf_lotemudas: null,
            viveiro: document.getElementById('plan_viveiro').value || null,
            clone: document.getElementById('plan_clone').value || null,
            plantadas: parseInt(document.getElementById('plan_plantadas').value) || null,
            descarte: parseInt(document.getElementById('plan_descarte').value) || null,
            insumo1: insumos[0]?.insumo || null,
            quantidade1: insumos[0]?.quantidade || null,
            insumo2: insumos[1]?.insumo || null,
            quantidade2: insumos[1]?.quantidade || null,
            insumo3: insumos[2]?.insumo || null,
            quantidade3: insumos[2]?.quantidade || null,
            insumo4: insumos[3]?.insumo || null,
            quantidade4: insumos[3]?.quantidade || null,
            insumo5: insumos[4]?.insumo || null,
            quantidade5: insumos[4]?.quantidade || null,
            anexo: null
        };

        // Enviar apontamento para o banco
        const response = await fetch(`${API_URL}/apontamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        if (!response.ok) throw new Error('Erro ao salvar apontamento');
        
        const apontamentoSalvo = await response.json();
        
        // Se houver paradas, enviar para o banco
        if (paradas.length > 0) {
            const paradasData = paradas.map(p => ({
                motivo: p.motivo,
                hora_inicio: p.inicio,
                hora_fim: p.fim
            }));

            await fetch(`${API_URL}/paradas-rendimento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_apontamento: apontamentoSalvo.id,
                    paradas: paradasData,
                    apontamento_data: {
                        data: document.getElementById('plan_data').value,
                        supervisor: usuarioLogado,
                        equipe: usuarioLogado,
                        nome_lider: usuarioLogado,
                        maquina: document.getElementById('plan_prefixo').value,
                        atividade: document.getElementById('plan_servico').value,
                        producao: parseFloat(document.getElementById('plan_produzido').value) || 0
                    }
                })
            });
        }

        showToast('✅ Apontamento PLANEJADO salvo com sucesso!', 'success');
        
        this.reset();
        osSelecionada = null;
        
        // Resetar horímetro
        horimetroData = { inicial: 0, final: 0 };
        
        // Resetar paradas para apenas 1 campo
        const paradasContainer = document.getElementById('paradas_container_plan');
        const firstParadaRow = paradasContainer.querySelector('.parada-row[data-index="1"]');
        paradasContainer.innerHTML = '';
        paradasContainer.appendChild(firstParadaRow);
        document.getElementById('plan_parada_motivo1').value = '';
        document.getElementById('plan_parada_inicio1').value = '';
        document.getElementById('plan_parada_fim1').value = '';
        const firstParadaRemoveBtn = firstParadaRow.querySelector('.remove-parada-btn');
        if (firstParadaRemoveBtn) firstParadaRemoveBtn.style.display = 'none';
        paradaCountPlan = 1;
        
        // Resetar insumos para apenas 1 campo
        const container = document.getElementById('insumos_container_plan');
        const firstRow = container.querySelector('.insumo-row[data-index="1"]');
        container.innerHTML = '';
        container.appendChild(firstRow);
        document.getElementById('plan_insumo1').value = '';
        document.getElementById('plan_quantidade1').value = '';
        const firstRemoveBtn = firstRow.querySelector('.remove-insumo-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
        insumoCountPlan = 1;
        
        // Esconder seção de plantio
        document.getElementById('plan_plantio_section').style.display = 'none';
        
        showMainMenu();
    } catch (error) {
        showToast('Erro ao salvar apontamento!', 'error');
        console.error(error);
    }
});

// Load Apontamentos Table
async function loadApontamentosTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">⏳ Carregando apontamentos...</td></tr>';

    let apontamentos = [];

    // Tentar buscar da API primeiro
    try {
        console.log('🔍 Buscando apontamentos em:', `${API_URL}/apontamentos`);
        const response = await fetch(`${API_URL}/apontamentos`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Apontamentos carregados da API:', data.length);
            apontamentos = data;
            
            // Sincronizar com IndexedDB para uso offline
            const tx = db.transaction(['apontamentos'], 'readwrite');
            const store = tx.objectStore('apontamentos');
            await store.clear(); // Limpar cache antigo
            
            for (const apt of data) {
                await store.put(apt);
            }
            await tx.complete;
            console.log('✅ Cache atualizado com apontamentos da API');
        } else {
            throw new Error('API não disponível');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao buscar da API, usando cache local:', error);
        // Fallback para IndexedDB
        apontamentos = await getAllData('apontamentos');
    }

    tbody.innerHTML = '';

    if (apontamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">Nenhum apontamento registrado ainda</td></tr>';
        return;
    }

    // Ordenar por data mais recente
    apontamentos.sort((a, b) => {
        const dateA = new Date(a.data || a.timestamp);
        const dateB = new Date(b.data || b.timestamp);
        return dateB - dateA;
    });

    apontamentos.forEach(apt => {
        const tr = document.createElement('tr');
        
        const statusClass = apt.status === 'Finalizado Total' ? 'badge-success' : 
                           apt.status === 'Finalizado Parcial' ? 'badge-warning' : 'badge-info';
        
        const tipoClass = apt.tipo === 'Avulso' ? 'badge-warning' : 'badge-info';

        // Usar os campos corretos do banco (os, tipo podem vir diferentes)
        const tipoDisplay = apt.tipo || (apt.os === 'AVULSO' ? 'Avulso' : 'Planejado');
        const dataDisplay = apt.data ? new Date(apt.data).toLocaleDateString('pt-BR') : 
                           apt.timestamp ? new Date(apt.timestamp).toLocaleDateString('pt-BR') : 'N/A';

        tr.innerHTML = `
            <td>${dataDisplay}</td>
            <td><span class="badge ${tipoClass}">${tipoDisplay}</span></td>
            <td>${apt.prefixo || apt.maquina || 'N/A'}</td>
            <td>${apt.operador || apt.nome_lider || 'N/A'}</td>
            <td>${apt.servico || apt.atividade || 'N/A'}</td>
            <td>${apt.fazenda || 'N/A'}</td>
            <td>${apt.talhao || 'N/A'}</td>
            <td>${parseFloat(apt.produzido || apt.producao || 0).toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${apt.status || 'Em andamento'}</span></td>
            <td>
                <button onclick="viewApontamento(${apt.id})" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">👁️ Ver</button>
                <button onclick="deleteApontamento(${apt.id})" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">🗑️ Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// View Apontamento
async function viewApontamento(id) {
    let apt = null;

    // Tentar buscar da API primeiro
    try {
        const response = await fetch(`${API_URL}/apontamentos`);
        if (response.ok) {
            const data = await response.json();
            apt = data.find(a => a.id === id);
        }
    } catch (error) {
        console.warn('⚠️ Erro ao buscar da API, tentando cache:', error);
    }

    // Fallback para IndexedDB
    if (!apt) {
        apt = await getData('apontamentos', id);
    }

    if (!apt) {
        showToast('❌ Apontamento não encontrado', 'error');
        return;
    }

    // Determinar tipo baseado em múltiplos campos possíveis
    const tipoDisplay = apt.tipo || (apt.os === 'AVULSO' ? 'Avulso' : 'Planejado');
    const isAvulso = tipoDisplay === 'Avulso' || apt.os === 'AVULSO';

    const tipoBadge = isAvulso ? 
        '<span class="detail-badge badge-avulso">Avulso</span>' : 
        '<span class="detail-badge badge-planejado">Planejado</span>';

    const status = apt.status || 'Em andamento';
    const statusBadge = status === 'Finalizado Total' ? 
        '<span class="badge badge-success">' + status + '</span>' : 
        status === 'Finalizado Parcial' ? 
        '<span class="badge badge-warning">' + status + '</span>' : 
        '<span class="badge badge-info">' + status + '</span>';

    let content = `
        <div class="detail-group">
            <div class="detail-label">Tipo</div>
            <div class="detail-value">${tipoBadge}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Status</div>
            <div class="detail-value">${statusBadge}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Data</div>
            <div class="detail-value">${new Date(apt.data).toLocaleDateString('pt-BR')}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Horário</div>
            <div class="detail-value">${apt.hora_inicio || apt.horaInicio || '--:--'} até ${apt.hora_final || apt.horaFinal || '--:--'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Equipamento</div>
            <div class="detail-value">${apt.prefixo || apt.maquina || 'N/A'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Operador</div>
            <div class="detail-value">${apt.operador || apt.nome_lider || 'N/A'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Código</div>
            <div class="detail-value">${apt.codigo || 'N/A'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Serviço</div>
            <div class="detail-value">${apt.servico || apt.atividade || 'N/A'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Fazenda / Talhão</div>
            <div class="detail-value">${apt.fazenda || 'N/A'} - Talhão ${apt.talhao || 'N/A'}</div>
        </div>

        <div class="detail-group">
            <div class="detail-label">Produção</div>
            <div class="detail-value">
                Produzido: <strong>${parseFloat(apt.produzido || apt.producao || 0).toFixed(2)} ha</strong><br>
                Área Total: ${parseFloat(apt.areaTotal || apt.area_total || 0).toFixed(2)} ha<br>
                Restante: ${parseFloat(apt.restante || 0).toFixed(2)} ha
            </div>
        </div>
    `;

    // Adicionar Grupo do Plantio se existir
    if (apt.clone || apt.plantadas || apt.descarte) {
        content += `
            <div class="detail-group">
                <div class="detail-label">📋 Grupo do Plantio</div>
                <div class="detail-value">
                    ${apt.clone ? `Clone: <strong>${apt.clone}</strong><br>` : ''}
                    ${apt.plantadas ? `Plantadas: <strong>${apt.plantadas}</strong><br>` : ''}
                    ${apt.descarte ? `Descarte: <strong>${apt.descarte}</strong>` : ''}
                </div>
            </div>
        `;
    }

    // Adicionar Insumos se existirem
    let insumos = [];
    for (let i = 1; i <= 5; i++) {
        const insumo = apt[`insumo${i}`];
        const quantidade = apt[`quantidade${i}`];
        if (insumo && quantidade) {
            insumos.push({ insumo, quantidade });
        }
    }

    if (insumos.length > 0) {
        content += `
            <div class="detail-group">
                <div class="detail-label">🧪 Insumos Utilizados</div>
                <div class="detail-value">
        `;
        insumos.forEach((item, index) => {
            content += `${index + 1}. <strong>${item.insumo}</strong> - ${item.quantidade}<br>`;
        });
        content += `
                </div>
            </div>
        `;
    }

    if (apt.observacao || apt.observacoes) {
        content += `
            <div class="detail-group">
                <div class="detail-label">Observação</div>
                <div class="detail-value">${apt.observacao || apt.observacoes}</div>
            </div>
        `;
    }

    document.getElementById('popupContent').innerHTML = content;
    document.getElementById('apontamentoPopup').classList.add('active');
}

function closeApontamentoPopup() {
    document.getElementById('apontamentoPopup').classList.remove('active');
}

// Delete Apontamento
async function deleteApontamento(id) {
    if (confirm('Tem certeza que deseja excluir este apontamento?')) {
        try {
            await deleteData('apontamentos', id);
            showToast('Apontamento excluído com sucesso!', 'success');
            await loadApontamentosTable();
        } catch (error) {
            showToast('Erro ao excluir apontamento!', 'error');
        }
    }
}

// Filter Table
function filterTable(searchTerm) {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    searchTerm = searchTerm.toLowerCase();
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span style="font-size: 20px;">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Update Date and Time
function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', dateOptions);
    
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Online/Offline Status
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    const statusDot = document.querySelector('.status-dot');
    
    if (!statusElement || !statusDot) {
        console.log('Elementos de status não encontrados');
        return;
    }
    
    if (navigator.onLine) {
        statusElement.textContent = 'Online';
        statusDot.style.background = '#4caf50';
    } else {
        statusElement.textContent = 'Offline';
        statusDot.style.background = '#ff9800';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// File preview
document.getElementById('avulso_anexos')?.addEventListener('change', function(e) {
    const preview = document.getElementById('avulso_files_preview');
    preview.innerHTML = '';
    
    for (let file of e.target.files) {
        const fileDiv = document.createElement('div');
        fileDiv.style.cssText = 'margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;';
        fileDiv.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        preview.appendChild(fileDiv);
    }
});

// Initialize App
async function initApp() {
    try {
        await initDB();
        await initSampleData(); // Dados mockados para demonstração rápida
        
        // Check if user is logged in
        const usuario = await getData('usuario', 1);
        if (usuario && usuario.logado) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appContainer').classList.add('active');
            document.getElementById('userName').textContent = usuario.nome;
            
            // Usando dados mockados para demonstração
            // await syncCacheFromServer();
            await loadDropdowns();
        }
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
        updateOnlineStatus();
        
    } catch (error) {
        console.error('Erro ao inicializar app:', error);
        showToast('Erro ao inicializar aplicação!', 'error');
    }
}

// Start App
initApp();

// ========== FUNÇÕES DE PARADAS ==========
let paradaCountAvulso = 1;
let paradaCountPlan = 1;

// Adicionar campo de parada - Avulso
async function addParadaFieldAvulso() {
    paradaCountAvulso++;
    const container = document.getElementById('paradas_container_avulso');
    
    // Buscar paradas cadastradas
    const paradas = await getAllData('paradas');
    let paradaOptions = '<option value="">Selecione...</option>';
    paradas.forEach(parada => {
        paradaOptions += `<option value="${parada.nome_parada}">${parada.nome_parada}</option>`;
    });
    
    const paradaRow = document.createElement('div');
    paradaRow.className = 'parada-row';
    paradaRow.dataset.index = paradaCountAvulso;
    
    paradaRow.innerHTML = `
        <div class="form-group">
            <label for="avulso_parada_motivo${paradaCountAvulso}">Motivo da Parada</label>
            <select id="avulso_parada_motivo${paradaCountAvulso}">
                ${paradaOptions}
            </select>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr auto; align-items: end; margin-top: 10px;">
            <div class="form-group">
                <label for="avulso_parada_inicio${paradaCountAvulso}">Hora Início</label>
                <input type="time" id="avulso_parada_inicio${paradaCountAvulso}">
            </div>
            <div class="form-group">
                <label for="avulso_parada_fim${paradaCountAvulso}">Hora Fim</label>
                <input type="time" id="avulso_parada_fim${paradaCountAvulso}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-parada-btn" onclick="removeParadaFieldAvulso(${paradaCountAvulso})">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(paradaRow);
}

// Remover campo de parada - Avulso
function removeParadaFieldAvulso(index) {
    const row = document.querySelector(`#paradas_container_avulso .parada-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
}

// Adicionar campo de parada - Planejado
async function addParadaFieldPlan() {
    paradaCountPlan++;
    const container = document.getElementById('paradas_container_plan');
    
    // Buscar paradas cadastradas
    const paradas = await getAllData('paradas');
    let paradaOptions = '<option value="">Selecione...</option>';
    paradas.forEach(parada => {
        paradaOptions += `<option value="${parada.nome_parada}">${parada.nome_parada}</option>`;
    });
    
    const paradaRow = document.createElement('div');
    paradaRow.className = 'parada-row';
    paradaRow.dataset.index = paradaCountPlan;
    
    paradaRow.innerHTML = `
        <div class="form-group">
            <label for="plan_parada_motivo${paradaCountPlan}">Motivo da Parada</label>
            <select id="plan_parada_motivo${paradaCountPlan}">
                ${paradaOptions}
            </select>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr auto; align-items: end; margin-top: 10px;">
            <div class="form-group">
                <label for="plan_parada_inicio${paradaCountPlan}">Hora Início</label>
                <input type="time" id="plan_parada_inicio${paradaCountPlan}">
            </div>
            <div class="form-group">
                <label for="plan_parada_fim${paradaCountPlan}">Hora Fim</label>
                <input type="time" id="plan_parada_fim${paradaCountPlan}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <button type="button" class="remove-parada-btn" onclick="removeParadaFieldPlan(${paradaCountPlan})">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(paradaRow);
}

// Remover campo de parada - Planejado
function removeParadaFieldPlan(index) {
    const row = document.querySelector(`#paradas_container_plan .parada-row[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
}

// Close popup when clicking outside
document.addEventListener('click', function(e) {
    const popup = document.getElementById('apontamentoPopup');
    if (e.target === popup) {
        closeApontamentoPopup();
    }
});

// ========== FUNÇÕES DE HORÍMETRO ==========
let tipoFormularioAtual = ''; // 'avulso' ou 'planejado'
let horimetroData = {
    inicial: 0,
    final: 0
};

// Abrir modal de horímetro ao selecionar prefixo - Avulso
document.getElementById('avulso_prefixo')?.addEventListener('change', function() {
    if (this.value) {
        tipoFormularioAtual = 'avulso';
        abrirHorimetroModal();
    }
});

// Abrir modal de horímetro ao selecionar prefixo - MECANIZADA
document.getElementById('mecanizada_prefixo')?.addEventListener('change', function() {
    if (this.value) {
        tipoFormularioAtual = 'mecanizada';
        abrirHorimetroModal();
    }
});

// Abrir modal de horímetro ao selecionar prefixo - Planejado (quando pré-preenchido)
function abrirHorimetroModal() {
    document.getElementById('horimetroModal').classList.add('active');
    document.getElementById('horimetro_inicial').value = '';
    document.getElementById('horimetro_final').value = '';
}

function fecharHorimetroModal() {
    document.getElementById('horimetroModal').classList.remove('active');
    // Se cancelar, limpar o prefixo
    if (tipoFormularioAtual === 'avulso' && !horimetroData.inicial) {
        document.getElementById('avulso_prefixo').value = '';
    }
}

function salvarHorimetro() {
    const inicial = parseFloat(document.getElementById('horimetro_inicial').value);
    const final = parseFloat(document.getElementById('horimetro_final').value);
    
    if (!inicial || !final) {
        showToast('Preencha ambos os campos de horímetro!', 'error');
        return;
    }
    
    if (final <= inicial) {
        showToast('O horímetro final deve ser maior que o inicial!', 'error');
        return;
    }
    
    horimetroData.inicial = inicial;
    horimetroData.final = final;
    
    fecharHorimetroModal();
    showToast('Horímetro registrado com sucesso!', 'success');
}

// Fechar modal ao clicar fora
document.getElementById('horimetroModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        fecharHorimetroModal();
    }
});