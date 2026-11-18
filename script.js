// ============================================================
// BISCA CAPIXABA ONLINE - LOGICA PRINCIPAL (script.js)
// Vanilla JS - Regras Oficiais Capixabas & Simulação Completa
// ============================================================

// --- DADOS E CONSTANTES DO BARALHO (40 CARTAS) ---
const NAIPES = ['Ouros', 'Copas', 'Espadas', 'Paus'];

const ICONES_NAIPES = {
    'Copas': '♥',
    'Ouros': '♦',
    'Espadas': '♠',
    'Paus': '♣'
};

// Mapeamento de naipes contrários para a regra do CORTAR (Ás e 7)
const NAIPES_CONTRARIOS = {
    'Ouros': 'Copas',
    'Copas': 'Ouros',
    'Espadas': 'Paus',
    'Paus': 'Espadas'
};

// Ordem de força: Ás > 7 > Rei > Valete > Dama > 6 > 5 > 4 > 3 > 2
// Pontuação: Ás=11, 7=10, Rei=4, Valete=3, Dama=2, 6..2=0
const DEFINICAO_CARTAS = [
    { valor: 'Ás', pontos: 11, forca: 10 },
    { valor: '7', pontos: 10, forca: 9 },
    { valor: 'Rei', pontos: 4, forca: 8 },
    { valor: 'Valete', pontos: 3, forca: 7 },
    { valor: 'Dama', pontos: 2, forca: 6 },
    { valor: '6', pontos: 0, forca: 5 },
    { valor: '5', pontos: 0, forca: 4 },
    { valor: '4', pontos: 0, forca: 3 },
    { valor: '3', pontos: 0, forca: 2 },
    { valor: '2', pontos: 0, forca: 1 }
];

// --- ESTADO GLOBAL DO JOGO ---
const gameState = {
    // Placar Acumulado da Partida (meta: 4 pontos)
    placarPartida: {
        dupla1: 0, // Jogador 0 (Você) + Jogador 2 (Parceiro)
        dupla2: 0  // Jogador 1 (Adversário 1) + Jogador 3 (Adversário 2)
    },
    partidaEncerrada: false,

    // Estado da Mão Atual
    maoAtiva: false,
    baralho: [],
    monte: [],            // Cartas restantes para compra
    cartaTrunfoMesa: null,// Carta indicadora do trunfo (fundo do monte)
    naipeTrunfo: null,
    metodoEscolha: null,  // 'cortar' | 'bater'
    multiplicador: 1,     // 1 (normal) ou 2 (copas batida)
    rodadaAtual: 0,       // Contador de 1 a 10 rodadas
    seteDeTrunfoJogado: false, // Rastreia se o 7 de trunfo já saiu na partida
    
    // Jogadores: 0 = Você, 1 = Adv 1, 2 = Parceiro, 3 = Adv 2
    jogadores: [
        { id: 0, nome: 'Você', dupla: 1, mao: [] },
        { id: 1, nome: 'Adversário 1', dupla: 2, mao: [] },
        { id: 2, nome: 'Parceiro', dupla: 1, mao: [] },
        { id: 3, nome: 'Adversário 2', dupla: 2, mao: [] }
    ],

    // Pontos de cartas conquistados na mão atual (soma até 120)
    pontosCartasMao: {
        dupla1: 0,
        dupla2: 0
    },

    // Controle da Vaza (Rodada de 4 cartas)
    jogadorVez: 0,
    primeiroDaVaza: 0,
    cartasNaMesa: [], // Array de { jogadorId, carta }
    primeiraJogadaDaMaoFeita: false,
    vazaProcessando: false
};

// --- CONTROLE DO TEMPORIZADOR DE 30 SEGUNDOS ---
let timerInterval = null;
let tempoRestante = 30;
let jogadorTimerAtual = null;
let jogadaEmExecucao = false; // Trava contra race conditions

// --- ELEMENTOS DO DOM ---
const dom = (typeof document !== 'undefined') ? {
    matchScore1: document.getElementById('matchScore1'),
    matchScore2: document.getElementById('matchScore2'),
    handCards1: document.getElementById('handCards1'),
    handCards2: document.getElementById('handCards2'),
    
    trumpSuitIcon: document.getElementById('trumpSuitIcon'),
    trumpSuitName: document.getElementById('trumpSuitName'),
    multiplierTag: document.getElementById('multiplierTag'),
    
    deckPileWrap: document.getElementById('deckPileWrap'),
    deckPile: document.getElementById('deckPile'),
    deckCount: document.getElementById('deckCount'),
    trumpCardSlot: document.getElementById('trumpCardSlot'),
    preHandPanel: document.getElementById('preHandPanel'),
    btnCortar: document.getElementById('btnCortar'),
    btnBater: document.getElementById('btnBater'),
    
    trocaDoisContainer: document.getElementById('trocaDoisContainer'),
    btnTrocaDois: document.getElementById('btnTrocaDois'),
    
    slotPlayer0: document.getElementById('slotPlayer0'),
    userHandContainer: document.querySelector('.user-hand-container'),
    userCardsRow: document.getElementById('userCardsRow'),
    emptyHandHint: document.getElementById('emptyHandHint'),
    
    handP1: document.getElementById('handP1'),
    handP2: document.getElementById('handP2'),
    handP3: document.getElementById('handP3'),
    
    infoP0: document.getElementById('infoP0'),
    infoP1: document.getElementById('infoP1'),
    infoP2: document.getElementById('infoP2'),
    infoP3: document.getElementById('infoP3'),
    
    timerP0: document.getElementById('timerP0'),
    timerP1: document.getElementById('timerP1'),
    timerP2: document.getElementById('timerP2'),
    timerP3: document.getElementById('timerP3'),
    
    trickSpot0: document.getElementById('trickSpot0'),
    trickSpot1: document.getElementById('trickSpot1'),
    trickSpot2: document.getElementById('trickSpot2'),
    trickSpot3: document.getElementById('trickSpot3'),
    
    announcementBanner: document.getElementById('announcementBanner'),
    announcementText: document.getElementById('announcementText'),
    
    victoryModal: document.getElementById('victoryModal'),
    modalWinnerTitle: document.getElementById('modalWinnerTitle'),
    modalWinnerDesc: document.getElementById('modalWinnerDesc'),
    modalFinalScore: document.getElementById('modalFinalScore'),
    btnNovaPartida: document.getElementById('btnNovaPartida'),
    
    btnRulesToggle: document.getElementById('btnRulesToggle'),
    rulesModal: document.getElementById('rulesModal'),
    btnCloseRules: document.getElementById('btnCloseRules')
} : {};

// ============================================================
// 1. CRIAÇÃO E EMBARALHAMENTO DO BARALHO (40 CARTAS SEM REPETIÇÃO)
// ============================================================
function criarBaralho() {
    const baralho = [];
    for (const naipe of NAIPES) {
        for (const item of DEFINICAO_CARTAS) {
            baralho.push({
                id: `${item.valor}_${naipe}`,
                valor: item.valor,
                naipe: naipe,
                pontos: item.pontos,
                forca: item.forca
            });
        }
    }
    return baralho;
}

function embaralhar(baralho) {
    const copia = [...baralho];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// ============================================================
// 2. ESCOLHA DO TRUNFO: BOTOES CORTAR E BATER
// ============================================================

/**
 * Regra para o botão CORTAR:
 * Se a carta retirada for um Ás ou um 7, o naipe da partida será o naipe contrário:
 * - Ouros ♦ <-> Copas ♥
 * - Espadas ♠ <-> Paus ♣
 * Se não for Ás nem 7, mantém o próprio naipe da carta.
 */
function determinarNaipeCorte(carta) {
    if (carta.valor === 'Ás' || carta.valor === '7') {
        return NAIPES_CONTRARIOS[carta.naipe];
    }
    return carta.naipe;
}

function executarCortar() {
    if (gameState.maoAtiva) return;

    const baralhoCompleto = embaralhar(criarBaralho());
    
    // Escolhe uma carta para ser a carta indicadora do corte (fundo do monte)
    const indexSorteado = Math.floor(Math.random() * baralhoCompleto.length);
    const cartaTrunfo = baralhoCompleto[indexSorteado];
    
    // Coloca a carta na posição 0 (fundo do monte)
    baralhoCompleto.splice(indexSorteado, 1);
    baralhoCompleto.unshift(cartaTrunfo);

    // Aplica a regra de inversão de naipe para Ás e 7
    const naipeDefinido = determinarNaipeCorte(cartaTrunfo);

    gameState.cartaTrunfoMesa = cartaTrunfo;
    gameState.naipeTrunfo = naipeDefinido;
    gameState.metodoEscolha = 'cortar';
    gameState.multiplicador = 1; // Corte mantém pontos normais (x1)
    gameState.baralho = baralhoCompleto;

    iniciarDistribuicaoEMao();

    if (cartaTrunfo.valor === 'Ás' || cartaTrunfo.valor === '7') {
        mostrarNotificacao(`✂️ Corte: Saiu ${cartaTrunfo.valor} de ${cartaTrunfo.naipe}! Regra do Corte (Ás/7): o trunfo é o naipe contrário (${naipeDefinido.toUpperCase()})!`);
    } else {
        mostrarNotificacao(`✂️ Corte realizado! Trunfo: ${cartaTrunfo.valor} de ${cartaTrunfo.naipe}. Pontos normais (x1).`);
    }
}

/**
 * Botão BATER:
 * - Copas é definido automaticamente como trunfo.
 * - Ativa o multiplicador dobrado (Copas Batida = 2).
 */
function executarBater() {
    if (gameState.maoAtiva) return;

    const baralhoCompleto = embaralhar(criarBaralho());
    
    // Encontra uma carta de Copas para servir de indicadora no fundo do monte
    const indexCopas = baralhoCompleto.findIndex(c => c.naipe === 'Copas');
    const cartaTrunfo = baralhoCompleto.splice(indexCopas, 1)[0];
    baralhoCompleto.unshift(cartaTrunfo);

    gameState.cartaTrunfoMesa = cartaTrunfo;
    gameState.naipeTrunfo = 'Copas';
    gameState.metodoEscolha = 'bater';
    gameState.multiplicador = 2; // Copas Batida dobra os pontos!
    gameState.baralho = baralhoCompleto;

    iniciarDistribuicaoEMao();
    mostrarNotificacao(`💥 PARTIDA BATIDA! Trunfo: COPAS. Todos os pontos valem o DOBRO (x2)!`);
}

// ============================================================
// 3. DISTRIBUIÇÃO DAS CARTAS & PROGRESSÃO (40 CARTAS, 10 RODADAS)
// ============================================================

function iniciarDistribuicaoEMao() {
    gameState.maoAtiva = true;
    gameState.primeiraJogadaDaMaoFeita = false;
    gameState.cartasNaMesa = [];
    gameState.pontosCartasMao = { dupla1: 0, dupla2: 0 };
    gameState.rodadaAtual = 0;
    gameState.seteDeTrunfoJogado = false; // Reinicia rastreio do 7 de trunfo

    // Limpa mãos anteriores
    gameState.jogadores.forEach(j => j.mao = []);

    // Distribui 3 cartas para cada um dos 4 participantes (12 cartas)
    for (let r = 0; r < 3; r++) {
        for (let j = 0; j < 4; j++) {
            const carta = gameState.baralho.pop();
            gameState.jogadores[j].mao.push(carta);
        }
    }

    // O restante das 40 cartas (exatamente 28 cartas) forma o monte
    gameState.monte = gameState.baralho;

    // Esconde painel de escolha
    dom.preHandPanel.style.display = 'none';

    // Atualiza exibições
    atualizarDisplayTrunfo();
    atualizarDisplayMonte();
    renderizarMaoJogador(true);
    renderizarMaosOponentes();
    atualizarPlacarInterface();

    // Inicia pelo Jogador 0 (Você) ou vencedor anterior
    destacarJogadorVez(gameState.jogadorVez);

    // Verifica a possibilidade de Troca do 2 de trunfo
    verificarTrocaDoDois();

    // Se o primeiro a jogar for bot, agenda a jogada dele
    if (gameState.jogadorVez !== 0) {
        agendarJogadaBot();
    }
}

/**
 * Regra da Troca do 2 de Trunfo:
 * Quem tiver o 2 do naipe de trunfo da partida pode trocá-lo pela
 * carta indicadora do trunfo antes da primeira jogada da mão.
 */
function verificarTrocaDoDois() {
    if (gameState.primeiraJogadaDaMaoFeita) {
        dom.trocaDoisContainer.style.display = 'none';
        return;
    }

    // Jogador 0 (Você)
    const temDoisVoce = gameState.jogadores[0].mao.some(
        c => c.valor === '2' && c.naipe === gameState.naipeTrunfo
    );

    if (temDoisVoce && gameState.cartaTrunfoMesa && gameState.cartaTrunfoMesa.valor !== '2') {
        dom.trocaDoisContainer.style.display = 'block';
    } else {
        dom.trocaDoisContainer.style.display = 'none';
    }

    // Bots também realizam a troca se tiverem o 2 e a carta da mesa tiver valor maior
    for (let i = 1; i < 4; i++) {
        const bot = gameState.jogadores[i];
        const idxDois = bot.mao.findIndex(c => c.valor === '2' && c.naipe === gameState.naipeTrunfo);
        if (idxDois !== -1 && gameState.cartaTrunfoMesa && gameState.cartaTrunfoMesa.forca > 1) {
            const cartaDois = bot.mao[idxDois];
            bot.mao[idxDois] = gameState.cartaTrunfoMesa;
            gameState.cartaTrunfoMesa = cartaDois;
            if (gameState.monte.length > 0) {
                gameState.monte[0] = cartaDois;
            }
            atualizarDisplayTrunfo();
            mostrarNotificacao(`🔄 ${bot.nome} trocou o 2 de trunfo pela carta da mesa!`);
            break;
        }
    }
}

function executarTrocaDoisJogador() {
    if (gameState.primeiraJogadaDaMaoFeita) return;
    const mao = gameState.jogadores[0].mao;
    const idxDois = mao.findIndex(c => c.valor === '2' && c.naipe === gameState.naipeTrunfo);

    if (idxDois !== -1 && gameState.cartaTrunfoMesa) {
        const cartaDois = mao[idxDois];
        const antigaMesa = gameState.cartaTrunfoMesa;

        mao[idxDois] = antigaMesa;
        gameState.cartaTrunfoMesa = cartaDois;
        if (gameState.monte.length > 0) {
            gameState.monte[0] = cartaDois;
        }

        dom.trocaDoisContainer.style.display = 'none';
        renderizarMaoJogador(false);
        atualizarDisplayTrunfo();
        mostrarNotificacao(`🔄 Você trocou o 2 de trunfo pelo ${antigaMesa.valor} de ${antigaMesa.naipe}!`);
    }
}

// ============================================================
// 4. VALIDAÇÃO DE REGRAS DE JOGADA (MOTOR DE VALIDAÇÃO)
// ============================================================

/**
 * Validação centralizada de jogada:
 * 1. Deve ser a vez do jogador e a partida deve estar ativa.
 * 2. A carta deve pertencer à mão do participante.
 * 3. Regra do Ás de trunfo:
 *    - Só pode ser jogado após o 7 de trunfo já ter saído.
 *    - Se o 7 de trunfo não tiver saído e o jogador possui outras cartas, o Ás está bloqueado.
 * 4. Regra do 7 de trunfo (Não pode sair de fundo):
 *    - Não pode ser jogado como 4ª carta da rodada (cartasNaMesa.length === 3).
 *    - Exceção: última mão da partida, quando possui somente 1 carta restante.
 */
function validarJogada(jogadorId, carta, mao) {
    if (!gameState.maoAtiva) {
        return { valido: false, motivo: 'A partida não está ativa.' };
    }
    if (gameState.vazaProcessando) {
        return { valido: false, motivo: 'A rodada anterior está sendo processada.' };
    }
    if (gameState.jogadorVez !== jogadorId) {
        return { valido: false, motivo: 'Não é a sua vez de jogar.' };
    }
    if (!mao.some(c => c.id === carta.id)) {
        return { valido: false, motivo: 'A carta selecionada não está na sua mão.' };
    }

    // REGRA 3: Ás do naipe de trunfo só pode ser jogado depois que o 7 de trunfo sair
    if (carta.valor === 'Ás' && carta.naipe === gameState.naipeTrunfo) {
        if (!gameState.seteDeTrunfoJogado) {
            // Se o jogador possui outras cartas na mão, ele é obrigado a jogar outra
            const outrasCartas = mao.filter(c => !(c.valor === 'Ás' && c.naipe === gameState.naipeTrunfo));
            if (outrasCartas.length > 0) {
                return { 
                    valido: false, 
                    motivo: 'O Ás de trunfo só pode ser jogado depois que o 7 de trunfo sair.' 
                };
            }
        }
    }

    // REGRA 4: 7 de trunfo não pode sair de fundo (4ª carta da rodada)
    if (carta.valor === '7' && carta.naipe === gameState.naipeTrunfo) {
        if (gameState.cartasNaMesa.length === 3) {
            // Exceção: na última mão (quando resta apenas 1 carta), a restrição deixa de existir
            if (mao.length > 1) {
                return { 
                    valido: false, 
                    motivo: 'O 7 de trunfo não pode ser jogado de fundo.' 
                };
            }
        }
    }

    return { valido: true };
}

// ============================================================
// 5. TEMPORIZADOR DE 30 SEGUNDOS
// ============================================================

function iniciarTemporizador(jogadorId) {
    pararTemporizador();

    if (!gameState.maoAtiva || gameState.vazaProcessando) return;

    jogadorTimerAtual = jogadorId;
    tempoRestante = 30;

    atualizarDisplayTimer(jogadorId, tempoRestante);

    timerInterval = setInterval(() => {
        tempoRestante--;

        if (tempoRestante >= 0) {
            atualizarDisplayTimer(jogadorId, tempoRestante);
        }

        if (tempoRestante <= 0) {
            pararTemporizador();
            executarJogadaAutomaticaPorTempo(jogadorId);
        }
    }, 1000);
}

function pararTemporizador() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    for (let i = 0; i < 4; i++) {
        const elTimer = document.getElementById(`timerP${i}`);
        if (elTimer) {
            elTimer.className = 'player-timer';
            elTimer.style.display = 'none';
        }
    }
    jogadorTimerAtual = null;
}

function atualizarDisplayTimer(jogadorId, segundos) {
    for (let i = 0; i < 4; i++) {
        const elTimer = document.getElementById(`timerP${i}`);
        if (elTimer) {
            if (i === jogadorId) {
                elTimer.style.display = 'inline-block';
                elTimer.textContent = `${segundos}s`;
                if (segundos <= 10) {
                    elTimer.className = 'player-timer active timer-warning';
                } else {
                    elTimer.className = 'player-timer active';
                }
            } else {
                elTimer.className = 'player-timer';
                elTimer.style.display = 'none';
            }
        }
    }
}

/**
 * Quando o tempo esgota, o sistema seleciona automaticamente uma carta
 * aleatória que respeite as regras da Bisca Capixaba.
 */
function executarJogadaAutomaticaPorTempo(jogadorId) {
    if (jogadaEmExecucao || !gameState.maoAtiva || gameState.vazaProcessando || gameState.jogadorVez !== jogadorId) return;

    const mao = gameState.jogadores[jogadorId].mao;
    if (mao.length === 0) return;

    jogadaEmExecucao = true;

    // Filtra estritamente as cartas válidas pelas regras
    let cartasValidas = mao.filter(c => validarJogada(jogadorId, c, mao).valido);
    if (cartasValidas.length === 0) {
        cartasValidas = mao; // Fallback extremo de segurança
    }

    const cartaEscolhida = cartasValidas[Math.floor(Math.random() * cartasValidas.length)];
    const idx = mao.indexOf(cartaEscolhida);
    mao.splice(idx, 1);

    mostrarNotificacao(`⏰ Tempo esgotado! Uma carta foi selecionada automaticamente.`);
    processarJogada(jogadorId, cartaEscolhida);
    jogadaEmExecucao = false;
}

// ============================================================
// 6. JOGADAS E EXECUÇÃO DAS RODADAS (VAZAS)
// ============================================================

/**
 * Jogador humano clica em uma de suas cartas
 */
function jogarCartaHumano(indexNaMao) {
    if (jogadaEmExecucao || !gameState.maoAtiva || gameState.vazaProcessando) return;
    if (gameState.jogadorVez !== 0) {
        mostrarNotificacao('Aguarde sua vez de jogar!');
        return;
    }

    const mao = gameState.jogadores[0].mao;
    if (indexNaMao < 0 || indexNaMao >= mao.length) return;

    const carta = mao[indexNaMao];
    const validacao = validarJogada(0, carta, mao);

    if (!validacao.valido) {
        mostrarNotificacao(validacao.motivo);
        return;
    }

    jogadaEmExecucao = true;
    pararTemporizador();

    // Retira a carta da mão e joga
    mao.splice(indexNaMao, 1);
    processarJogada(0, carta);
    jogadaEmExecucao = false;
}

/**
 * Processa a jogada de qualquer participante (humano ou bot)
 */
function processarJogada(jogadorId, carta) {
    gameState.primeiraJogadaDaMaoFeita = true;
    dom.trocaDoisContainer.style.display = 'none';
    pararTemporizador(); // Cancela o timer imediatamente

    // Rastreia se o 7 de trunfo foi jogado (liberando o Ás de trunfo)
    if (carta.valor === '7' && carta.naipe === gameState.naipeTrunfo) {
        gameState.seteDeTrunfoJogado = true;
    }

    // Registra na mesa
    gameState.cartasNaMesa.push({ jogadorId, carta });

    // Renderiza no centro da mesa com animação
    renderizarCartaNaMesa(jogadorId, carta);

    // Atualiza a mão visual do jogador
    if (jogadorId === 0) {
        renderizarMaoJogador(false);
    } else {
        renderizarMaosOponentes();
    }

    // Se completou 4 cartas na vaza:
    if (gameState.cartasNaMesa.length === 4) {
        gameState.vazaProcessando = true;
        setTimeout(avaliarFimDaVaza, 900);
    } else {
        // Passa a vez para o próximo jogador
        gameState.jogadorVez = (gameState.jogadorVez + 1) % 4;
        destacarJogadorVez(gameState.jogadorVez);

        if (gameState.jogadorVez !== 0) {
            agendarJogadaBot();
        }
    }
}

/**
 * Simulação automática para os 3 adversários/parceiro
 */
function agendarJogadaBot() {
    if (!gameState.maoAtiva || gameState.vazaProcessando) return;
    const botId = gameState.jogadorVez;
    if (botId === 0) return;

    setTimeout(() => {
        if (!gameState.maoAtiva || gameState.vazaProcessando || gameState.jogadorVez !== botId) return;

        const mao = gameState.jogadores[botId].mao;
        if (mao.length === 0) return;

        // Filtra apenas cartas válidas pelas regras
        const cartasValidas = mao.filter(c => validarJogada(botId, c, mao).valido);
        const listaOpcoes = cartasValidas.length > 0 ? cartasValidas : mao;

        const cartaEscolhida = escolherCartaBot(botId, listaOpcoes, gameState.cartasNaMesa, gameState.naipeTrunfo);
        const idx = mao.indexOf(cartaEscolhida);
        mao.splice(idx, 1);

        processarJogada(botId, cartaEscolhida);
    }, 650);
}

function escolherCartaBot(botId, cartasValidas, cartasNaMesa, trunfo) {
    const duplaBot = gameState.jogadores[botId].dupla;

    if (cartasNaMesa.length === 0) {
        const descartes = cartasValidas.filter(c => c.pontos === 0 && c.naipe !== trunfo);
        if (descartes.length > 0) return descartes[0];
        return cartasValidas.slice().sort((a, b) => a.forca - b.forca)[0];
    }

    const vencedorAtual = calcularVencedorParcial(cartasNaMesa, trunfo);
    const parceiroGanhando = (gameState.jogadores[vencedorAtual.jogadorId].dupla === duplaBot);

    // Evita Heley de amigo se o parceiro acabou de jogar o 7 de trunfo
    const ultimaJogada = cartasNaMesa[cartasNaMesa.length - 1];
    const ehParceiro = gameState.jogadores[ultimaJogada.jogadorId].dupla === duplaBot;
    const jogouSeteDeTrunfo = (ultimaJogada.carta.valor === '7' && ultimaJogada.carta.naipe === trunfo);

    if (ehParceiro && jogouSeteDeTrunfo) {
        const cartasSeguras = cartasValidas.filter(c => !(c.valor === 'Ás' && c.naipe === trunfo));
        if (cartasSeguras.length > 0) return cartasSeguras[0];
    }

    if (parceiroGanhando) {
        const cartaPontos = cartasValidas.find(c => c.pontos > 0 && c.naipe !== trunfo);
        if (cartaPontos) return cartaPontos;
        return cartasValidas.slice().sort((a, b) => a.forca - b.forca)[0];
    }

    const cartasQueGanham = cartasValidas.filter(c => {
        return comparaDuasCartas(c, vencedorAtual.carta, cartasNaMesa[0].carta.naipe, trunfo) > 0;
    });

    if (cartasQueGanham.length > 0) {
        return cartasQueGanham.sort((a, b) => a.forca - b.forca)[0];
    }

    const descartes = cartasValidas.filter(c => c.naipe !== trunfo && c.pontos === 0);
    if (descartes.length > 0) return descartes[0];
    return cartasValidas.slice().sort((a, b) => a.forca - b.forca)[0];
}

// ============================================================
// 7. DETERMINAÇÃO DO VENCEDOR DA VAZA & REGRA DO HELEY
// ============================================================

function comparaDuasCartas(cartaA, cartaB, naipePrimeira, naipeTrunfo) {
    const aEhTrunfo = (cartaA.naipe === naipeTrunfo);
    const bEhTrunfo = (cartaB.naipe === naipeTrunfo);

    if (aEhTrunfo && !bEhTrunfo) return 1;
    if (!aEhTrunfo && bEhTrunfo) return -1;
    if (aEhTrunfo && bEhTrunfo) {
        return cartaA.forca - cartaB.forca;
    }

    const aEhSaida = (cartaA.naipe === naipePrimeira);
    const bEhSaida = (cartaB.naipe === naipePrimeira);

    if (aEhSaida && !bEhSaida) return 1;
    if (!aEhSaida && bEhSaida) return -1;
    if (aEhSaida && bEhSaida) {
        return cartaA.forca - cartaB.forca;
    }

    return 0;
}

function calcularVencedorParcial(cartasNaMesa, naipeTrunfo) {
    let melhor = cartasNaMesa[0];
    const naipePrimeira = cartasNaMesa[0].carta.naipe;

    for (let i = 1; i < cartasNaMesa.length; i++) {
        const atual = cartasNaMesa[i];
        if (comparaDuasCartas(atual.carta, melhor.carta, naipePrimeira, naipeTrunfo) > 0) {
            melhor = atual;
        }
    }
    return melhor;
}

function verificarHeleyNaVaza(cartasNaMesa, naipeTrunfo) {
    for (let i = 0; i < cartasNaMesa.length - 1; i++) {
        const j1 = cartasNaMesa[i];
        const j2 = cartasNaMesa[i + 1];

        const ehSeteTrunfo = (j1.carta.valor === '7' && j1.carta.naipe === naipeTrunfo);
        const ehAsTrunfo = (j2.carta.valor === 'Ás' && j2.carta.naipe === naipeTrunfo);

        if (ehSeteTrunfo && ehAsTrunfo) {
            const duplaSete = gameState.jogadores[j1.jogadorId].dupla;
            const duplaAs = gameState.jogadores[j2.jogadorId].dupla;
            const ptsGanhos = 1 * gameState.multiplicador;

            if (duplaSete === duplaAs) {
                // Heley de amigo! Ponto para a dupla adversária
                const duplaBeneficiada = (duplaAs === 1) ? 2 : 1;
                return {
                    tipo: 'amigo',
                    duplaBeneficiada: duplaBeneficiada,
                    pontos: ptsGanhos,
                    jogador7: gameState.jogadores[j1.jogadorId].nome,
                    jogadorAs: gameState.jogadores[j2.jogadorId].nome
                };
            } else {
                // Heley normal! Ponto para a dupla que jogou o Ás
                return {
                    tipo: 'normal',
                    duplaBeneficiada: duplaAs,
                    pontos: ptsGanhos,
                    jogador7: gameState.jogadores[j1.jogadorId].nome,
                    jogadorAs: gameState.jogadores[j2.jogadorId].nome
                };
            }
        }
    }
    return null;
}

function avaliarFimDaVaza() {
    pararTemporizador();
    gameState.rodadaAtual++;
    const vencedorJogada = calcularVencedorParcial(gameState.cartasNaMesa, gameState.naipeTrunfo);
    const vencedorId = vencedorJogada.jogadorId;
    const duplaVencedora = gameState.jogadores[vencedorId].dupla;

    // Destaca a carta vencedora
    const spotElement = document.getElementById(`trickSpot${vencedorId}`);
    if (spotElement && spotElement.firstElementChild) {
        spotElement.firstElementChild.classList.add('trick-winner-glow');
    }

    // 1. Checagem de Heley
    const resultadoHeley = verificarHeleyNaVaza(gameState.cartasNaMesa, gameState.naipeTrunfo);
    if (resultadoHeley) {
        const duplaNome = resultadoHeley.duplaBeneficiada === 1 ? 'Dupla 1' : 'Dupla 2';
        if (resultadoHeley.duplaBeneficiada === 1) {
            gameState.placarPartida.dupla1 += resultadoHeley.pontos;
        } else {
            gameState.placarPartida.dupla2 += resultadoHeley.pontos;
        }

        if (resultadoHeley.tipo === 'amigo') {
            mostrarNotificacao(`🚨 HELEY DE AMIGO! Ás e 7 jogados pela mesma dupla! +${resultadoHeley.pontos} pt(s) para a ${duplaNome}!`, 'heley-amigo-alert');
        } else {
            mostrarNotificacao(`⚡ HELEY! Ás de trunfo imediatamente em cima do 7! +${resultadoHeley.pontos} pt(s) para a ${duplaNome}!`, 'heley-alert');
        }
        atualizarPlacarInterface();

        if (verificarFimDePartida()) {
            limparMesaVaza();
            gameState.vazaProcessando = false;
            return;
        }
    }

    // 2. Soma os pontos das cartas da vaza
    let pontosDaVaza = 0;
    gameState.cartasNaMesa.forEach(item => {
        pontosDaVaza += item.carta.pontos;
    });

    if (duplaVencedora === 1) {
        gameState.pontosCartasMao.dupla1 += pontosDaVaza;
    } else {
        gameState.pontosCartasMao.dupla2 += pontosDaVaza;
    }
    atualizarPlacarInterface();

    mostrarNotificacao(`${gameState.jogadores[vencedorId].nome} levou a rodada! (+${pontosDaVaza} pts em cartas)`);

    // 3. Animação de recolhimento das cartas e compra após intervalo
    setTimeout(() => {
        for (let i = 0; i < 4; i++) {
            const spot = document.getElementById(`trickSpot${i}`);
            if (spot && spot.firstElementChild) {
                spot.firstElementChild.classList.add('trick-collecting');
            }
        }

        setTimeout(() => {
            limparMesaVaza();

            // Compra de cartas: cada participante compra 1 carta se houver monte
            executarCompraAposVaza(vencedorId);

            // O vencedor da rodada começa a próxima
            gameState.jogadorVez = vencedorId;
            gameState.primeiroDaVaza = vencedorId;
            gameState.cartasNaMesa = [];
            gameState.vazaProcessando = false;

            // Checa se a mão terminou (todas as cartas de todas as mãos foram jogadas)
            const cartasRestantesTotal = gameState.jogadores.reduce((acc, j) => acc + j.mao.length, 0);
            if (cartasRestantesTotal === 0) {
                avaliarFimDaMao();
            } else {
                destacarJogadorVez(gameState.jogadorVez);
                if (gameState.jogadorVez !== 0) {
                    agendarJogadaBot();
                }
            }
        }, 400);

    }, 1100);
}

function executarCompraAposVaza(vencedorId) {
    if (gameState.monte.length === 0) {
        return; // Monte esgotado
    }

    for (let offset = 0; offset < 4; offset++) {
        const jId = (vencedorId + offset) % 4;

        if (gameState.monte.length > 0) {
            const cartaComprada = gameState.monte.pop();
            gameState.jogadores[jId].mao.push(cartaComprada);

            if (gameState.monte.length === 0) {
                gameState.cartaTrunfoMesa = null;
                atualizarDisplayTrunfo();
            }
        }
    }

    atualizarDisplayMonte();
    renderizarMaoJogador(false, true);
    renderizarMaosOponentes();
}

// ============================================================
// 8. FINAL DA MÃO & PONTUAÇÃO (CAPOTE, VITÓRIA SIMPLES, 120 PTS)
// ============================================================

function avaliarFimDaMao() {
    pararTemporizador();
    gameState.maoAtiva = false;
    const pts1 = gameState.pontosCartasMao.dupla1;
    const pts2 = gameState.pontosCartasMao.dupla2;
    const mult = gameState.multiplicador;

    // 1. REGRA DOS 120 PONTOS (VITÓRIA DIRETA DA PARTIDA)
    if (pts1 === 120) {
        mostrarNotificacao('🌟 VITÓRIA DIRETA POR 120 PONTOS! A Dupla 1 fez todos os pontos da mão!');
        encerrarPartida(1, 'Vitória Imediata por 120 pontos!');
        return;
    }
    if (pts2 === 120) {
        mostrarNotificacao('🌟 VITÓRIA DIRETA POR 120 PONTOS! A Dupla 2 fez todos os pontos da mão!');
        encerrarPartida(2, 'Vitória Imediata por 120 pontos!');
        return;
    }

    // 2. AVALIAÇÃO DE VITÓRIA SIMPLES E CAPOTE
    if (pts1 > pts2) {
        let pontosGanhos = 1 * mult;
        let msg = `Dupla 1 venceu a mão (${pts1} x ${pts2})! +${pontosGanhos} ponto(s).`;

        if (pts2 < 31) {
            const capotePts = 1 * mult;
            pontosGanhos += capotePts;
            msg = `🔥 CAPOTE! Dupla 2 fez apenas ${pts2} pontos (&lt;31)! Dupla 1 ganha +${pontosGanhos} pontos (Vitória + Capote)!`;
            mostrarNotificacao(msg, 'capote-alert');
        } else {
            mostrarNotificacao(msg);
        }

        gameState.placarPartida.dupla1 += pontosGanhos;
    } else if (pts2 > pts1) {
        let pontosGanhos = 1 * mult;
        let msg = `Dupla 2 venceu a mão (${pts2} x ${pts1})! +${pontosGanhos} ponto(s).`;

        if (pts1 < 31) {
            const capotePts = 1 * mult;
            pontosGanhos += capotePts;
            msg = `🔥 CAPOTE! Dupla 1 fez apenas ${pts1} pontos (&lt;31)! Dupla 2 ganha +${pontosGanhos} pontos (Vitória + Capote)!`;
            mostrarNotificacao(msg, 'capote-alert');
        } else {
            mostrarNotificacao(msg);
        }

        gameState.placarPartida.dupla2 += pontosGanhos;
    } else {
        mostrarNotificacao(`Empate na contagem de cartas (60 x 60)! Nenhum ponto atribuído.`);
    }

    atualizarPlacarInterface();

    if (verificarFimDePartida()) {
        return;
    }

    setTimeout(() => {
        prepararNovaMao();
    }, 2200);
}

function verificarFimDePartida() {
    if (gameState.placarPartida.dupla1 >= 4) {
        encerrarPartida(1, `A Dupla 1 alcançou ${gameState.placarPartida.dupla1} pontos!`);
        return true;
    }
    if (gameState.placarPartida.dupla2 >= 4) {
        encerrarPartida(2, `A Dupla 2 alcançou ${gameState.placarPartida.dupla2} pontos!`);
        return true;
    }
    return false;
}

function encerrarPartida(duplaVencedora, motivo) {
    pararTemporizador();
    gameState.partidaEncerrada = true;
    gameState.maoAtiva = false;

    dom.modalWinnerTitle.textContent = (duplaVencedora === 1) ? '🏆 VITÓRIA DA SUA DUPLA!' : 'DERROTA!';
    dom.modalWinnerDesc.textContent = `${motivo} ${duplaVencedora === 1 ? 'Você e seu parceiro venceram a partida de Bisca Capixaba!' : 'A dupla adversária levou a melhor desta vez.'}`;
    dom.modalFinalScore.textContent = `${gameState.placarPartida.dupla1} x ${gameState.placarPartida.dupla2}`;

    dom.victoryModal.style.display = 'flex';
}

function prepararNovaMao() {
    pararTemporizador();
    gameState.maoAtiva = false;
    gameState.cartasNaMesa = [];
    gameState.cartaTrunfoMesa = null;
    gameState.naipeTrunfo = null;
    gameState.multiplicador = 1;
    gameState.rodadaAtual = 0;
    gameState.seteDeTrunfoJogado = false;
    gameState.pontosCartasMao = { dupla1: 0, dupla2: 0 };
    gameState.jogadores.forEach(j => j.mao = []);

    dom.preHandPanel.style.display = 'flex';
    dom.emptyHandHint.style.display = 'block';
    dom.userCardsRow.innerHTML = '';
    dom.userCardsRow.appendChild(dom.emptyHandHint);
    
    dom.handP1.innerHTML = '';
    dom.handP2.innerHTML = '';
    dom.handP3.innerHTML = '';

    dom.trumpSuitIcon.textContent = '?';
    dom.trumpSuitName.textContent = 'Aguardando corte';
    dom.multiplierTag.textContent = 'x1 NORMAL';
    dom.multiplierTag.className = 'multiplier-tag';

    dom.deckCount.textContent = '40';
    dom.trumpCardSlot.innerHTML = `<div class="trump-card-placeholder"><span>TRUNFO</span></div>`;

    atualizarPlacarInterface();
}

function reiniciarPartidaCompleta() {
    gameState.placarPartida = { dupla1: 0, dupla2: 0 };
    gameState.partidaEncerrada = false;
    dom.victoryModal.style.display = 'none';
    prepararNovaMao();
    mostrarNotificacao('Nova partida iniciada! Meta: 4 pontos.');
}

// ============================================================
// 9. RENDERIZAÇÃO DA INTERFACE & CARTAS REALISTAS
// ============================================================

/**
 * Cria o elemento visual HTML de uma carta de baralho realista
 */
function criarElementoCarta(carta, options = { interativa: false, bloqueada: false, motivoBloqueio: '', onClick: null, animClasse: '' }) {
    const el = document.createElement('div');
    const naipeClasse = `suit-${carta.naipe.toLowerCase()}`;
    const icone = ICONES_NAIPES[carta.naipe];
    const classeBloqueio = options.bloqueada ? 'card-blocked' : '';

    el.className = `card-item ${naipeClasse} ${options.interativa ? 'clickable' : ''} ${classeBloqueio} ${options.animClasse || ''}`;
    el.dataset.id = carta.id;
    if (options.motivoBloqueio) {
        el.title = options.motivoBloqueio;
    }

    el.innerHTML = `
        <div class="card-corner-top">
            <span class="card-val">${carta.valor}</span>
            <span class="card-suit">${icone}</span>
        </div>
        <div class="card-center-art">${icone}</div>
        ${options.bloqueada ? '<div class="card-blocked-badge" title="' + options.motivoBloqueio + '">🔒</div>' : ''}
        <div class="card-points-badge">${carta.pontos > 0 ? carta.pontos + 'p' : ''}</div>
        <div class="card-corner-bottom">
            <span class="card-val">${carta.valor}</span>
            <span class="card-suit">${icone}</span>
        </div>
    `;

    if (options.onClick) {
        el.addEventListener('click', options.onClick);
    }
    return el;
}

/**
 * Cria o verso de uma carta para adversários e parceiro
 */
function criarElementoVersoCarta(animClasse = '') {
    const el = document.createElement('div');
    el.className = `card-item card-back ${animClasse}`;
    return el;
}

/**
 * Renderiza a mão do Jogador 0 (Você) com destaque visual de cartas bloqueadas
 */
function renderizarMaoJogador(animDistribuicao = false, animCompra = false) {
    const mao = gameState.jogadores[0].mao;
    dom.userCardsRow.innerHTML = '';

    if (mao.length === 0) {
        dom.emptyHandHint.style.display = 'block';
        dom.userCardsRow.appendChild(dom.emptyHandHint);
        return;
    }

    dom.emptyHandHint.style.display = 'none';
    mao.forEach((carta, idx) => {
        let animClasse = '';
        if (animDistribuicao) {
            animClasse = 'card-dealt';
        } else if (animCompra && idx === mao.length - 1) {
            animClasse = 'card-drawn';
        }

        // Verifica se a carta está bloqueada pelas regras
        const validacao = validarJogada(0, carta, mao);
        const estaBloqueada = !validacao.valido;

        const el = criarElementoCarta(carta, {
            interativa: (gameState.jogadorVez === 0 && !gameState.vazaProcessando),
            bloqueada: estaBloqueada,
            motivoBloqueio: estaBloqueada ? validacao.motivo : '',
            onClick: () => jogarCartaHumano(idx),
            animClasse: animClasse
        });
        dom.userCardsRow.appendChild(el);
    });
}

function renderizarMaosOponentes() {
    dom.handP1.innerHTML = '';
    gameState.jogadores[1].mao.forEach(() => {
        dom.handP1.appendChild(criarElementoVersoCarta());
    });

    dom.handP2.innerHTML = '';
    gameState.jogadores[2].mao.forEach(() => {
        dom.handP2.appendChild(criarElementoVersoCarta());
    });

    dom.handP3.innerHTML = '';
    gameState.jogadores[3].mao.forEach(() => {
        dom.handP3.appendChild(criarElementoVersoCarta());
    });
}

function renderizarCartaNaMesa(jogadorId, carta) {
    const spot = document.getElementById(`trickSpot${jogadorId}`);
    if (!spot) return;

    spot.innerHTML = '';
    const elCarta = criarElementoCarta(carta);
    elCarta.classList.add('trick-card-played');
    spot.appendChild(elCarta);
}

function limparMesaVaza() {
    for (let i = 0; i < 4; i++) {
        const spot = document.getElementById(`trickSpot${i}`);
        if (spot) spot.innerHTML = '';
    }
}

function atualizarDisplayTrunfo() {
    if (!gameState.naipeTrunfo) {
        dom.trumpSuitIcon.textContent = '?';
        dom.trumpSuitName.textContent = 'Aguardando';
        return;
    }

    const icone = ICONES_NAIPES[gameState.naipeTrunfo];
    dom.trumpSuitIcon.textContent = icone;
    dom.trumpSuitName.textContent = gameState.naipeTrunfo.toUpperCase();

    dom.trumpSuitIcon.className = `trump-suit-icon suit-${gameState.naipeTrunfo.toLowerCase()}`;

    if (gameState.multiplicador === 2) {
        dom.multiplierTag.textContent = 'x2 COPAS BATIDA';
        dom.multiplierTag.className = 'multiplier-tag multiplier-batida';
    } else {
        dom.multiplierTag.textContent = 'x1 NORMAL';
        dom.multiplierTag.className = 'multiplier-tag';
    }

    if (gameState.cartaTrunfoMesa) {
        dom.trumpCardSlot.innerHTML = '';
        const el = criarElementoCarta(gameState.cartaTrunfoMesa);
        dom.trumpCardSlot.appendChild(el);
    } else {
        dom.trumpCardSlot.innerHTML = `<div class="trump-card-placeholder"><span>SEM TRUNFO</span></div>`;
    }
}

function atualizarDisplayMonte() {
    const qtd = gameState.monte.length;
    dom.deckCount.textContent = qtd;

    if (qtd === 0) {
        dom.deckPile.style.opacity = '0.35';
    } else {
        dom.deckPile.style.opacity = '1';
    }
}

function atualizarPlacarInterface() {
    dom.matchScore1.textContent = gameState.placarPartida.dupla1;
    dom.matchScore2.textContent = gameState.placarPartida.dupla2;

    dom.handCards1.textContent = gameState.pontosCartasMao.dupla1;
    dom.handCards2.textContent = gameState.pontosCartasMao.dupla2;
}

function destacarJogadorVez(jogadorId) {
    [dom.infoP0, dom.infoP1, dom.infoP2, dom.infoP3].forEach((el, idx) => {
        if (idx === jogadorId) {
            el.classList.add('active-turn');
        } else {
            el.classList.remove('active-turn');
        }
    });

    if (jogadorId === 0 && gameState.maoAtiva && !gameState.vazaProcessando) {
        dom.userHandContainer.classList.add('my-turn');
    } else {
        dom.userHandContainer.classList.remove('my-turn');
    }

    renderizarMaoJogador(false);

    // Dispara o temporizador de 30 segundos para o jogador da vez
    if (gameState.maoAtiva && !gameState.vazaProcessando) {
        iniciarTemporizador(jogadorId);
    }
}

let timeoutNotificacao = null;
function mostrarNotificacao(texto, classeEspecial = '') {
    dom.announcementText.innerHTML = texto;
    dom.announcementBanner.className = `announcement-banner show ${classeEspecial}`;

    if (timeoutNotificacao) clearTimeout(timeoutNotificacao);
    timeoutNotificacao = setTimeout(() => {
        dom.announcementBanner.classList.remove('show');
    }, 3500);
}

// ============================================================
// 10. EVENT LISTENERS E INICIALIZAÇÃO
// ============================================================
function inicializarEventos() {
    dom.btnCortar.addEventListener('click', executarCortar);
    dom.btnBater.addEventListener('click', executarBater);
    dom.btnTrocaDois.addEventListener('click', executarTrocaDoisJogador);
    dom.btnNovaPartida.addEventListener('click', reiniciarPartidaCompleta);

    // Modal de Regras
    dom.btnRulesToggle.addEventListener('click', () => {
        dom.rulesModal.style.display = 'flex';
    });
    dom.btnCloseRules.addEventListener('click', () => {
        dom.rulesModal.style.display = 'none';
    });
}

// Inicializa o jogo ao carregar a página no navegador
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        inicializarEventos();
        prepararNovaMao();
    });
}

// ============================================================
// 11. EXPORTAÇÃO PARA TESTES AUTOMATIZADOS (NODE.JS)
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameState,
        NAIPES,
        NAIPES_CONTRARIOS,
        DEFINICAO_CARTAS,
        determinarNaipeCorte,
        validarJogada,
        comparaDuasCartas,
        calcularVencedorParcial,
        verificarHeleyNaVaza,
        criarBaralho,
        embaralhar
    };
}
