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
    cartaTrunfoMesa: null,// Carta indicadora do trunfo
    naipeTrunfo: null,
    metodoEscolha: null,  // 'cortar' | 'bater'
    multiplicador: 1,     // 1 (normal) ou 2 (copas batida)
    rodadaAtual: 0,       // Contador de 1 a 10 rodadas
    
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

// --- ELEMENTOS DO DOM ---
const dom = {
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
};

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
 * Botão CORTAR:
 * - O baralho de 40 cartas é embaralhado.
 * - Uma carta é retirada para ser o trunfo e colocada no fundo do monte.
 * - Qualquer naipe pode sair (inclusive Copas).
 * - Se Copas sair pelo corte, os pontos permanecem normais (x1).
 */
function executarCortar() {
    if (gameState.maoAtiva) return;

    const baralhoCompleto = embaralhar(criarBaralho());
    
    // Escolhe uma carta para ser a carta indicadora do trunfo (fundo do monte)
    const indexSorteado = Math.floor(Math.random() * baralhoCompleto.length);
    const cartaTrunfo = baralhoCompleto[indexSorteado];
    
    // Coloca a carta de trunfo na posição 0 (fundo do monte)
    baralhoCompleto.splice(indexSorteado, 1);
    baralhoCompleto.unshift(cartaTrunfo);

    gameState.cartaTrunfoMesa = cartaTrunfo;
    gameState.naipeTrunfo = cartaTrunfo.naipe;
    gameState.metodoEscolha = 'cortar';
    gameState.multiplicador = 1;
    gameState.baralho = baralhoCompleto;

    iniciarDistribuicaoEMao();
    mostrarNotificacao(`✂️ Corte realizado! Trunfo: ${cartaTrunfo.valor} de ${cartaTrunfo.naipe}. Pontos normais (x1).`);
}

/**
 * Botão BATER:
 * - O baralho de 40 cartas é embaralhado.
 * - Copas é automaticamente definido como trunfo.
 * - Multiplicador de Copas Batida = 2 (pontos valem o dobro).
 * - Uma carta de Copas é colocada no fundo do monte como indicadora.
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

/**
 * Distribui 3 cartas para cada jogador:
 * - Total de 12 cartas distribuídas.
 * - 28 cartas restantes no monte de compra.
 * - A carta indicadora de trunfo fica visível na mesa (é a última carta do monte).
 */
function iniciarDistribuicaoEMao() {
    gameState.maoAtiva = true;
    gameState.primeiraJogadaDaMaoFeita = false;
    gameState.cartasNaMesa = [];
    gameState.pontosCartasMao = { dupla1: 0, dupla2: 0 };
    gameState.rodadaAtual = 0;

    // Limpa mãos anteriores
    gameState.jogadores.forEach(j => j.mao = []);

    // Distribui 3 cartas para cada um dos 4 participantes (12 cartas do topo)
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
    renderizarMaoJogador(true); // animação de distribuição
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
 * Se algum jogador receber o 2 do naipe de trunfo, pode trocá-lo pela
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
            // Atualiza também no fundo do monte
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
        // Atualiza a carta indicadora no fundo do monte
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
// 4. JOGADAS E REGRAS DAS RODADAS (VAZAS)
// ============================================================

/**
 * Jogador humano clica em uma de suas cartas
 */
function jogarCartaHumano(indexNaMao) {
    if (!gameState.maoAtiva || gameState.vazaProcessando) return;
    if (gameState.jogadorVez !== 0) {
        mostrarNotificacao('Aguarde sua vez de jogar!');
        return;
    }

    const mao = gameState.jogadores[0].mao;
    if (indexNaMao < 0 || indexNaMao >= mao.length) return;

    // Retira a carta da mão e a posiciona no centro
    const [carta] = mao.splice(indexNaMao, 1);
    processarJogada(0, carta);
}

/**
 * Processa a jogada de qualquer participante (humano ou bot)
 */
function processarJogada(jogadorId, carta) {
    gameState.primeiraJogadaDaMaoFeita = true;
    dom.trocaDoisContainer.style.display = 'none';

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

        const cartaEscolhida = escolherCartaBot(botId, mao, gameState.cartasNaMesa, gameState.naipeTrunfo);
        const idx = mao.indexOf(cartaEscolhida);
        mao.splice(idx, 1);

        processarJogada(botId, cartaEscolhida);
    }, 600);
}

function escolherCartaBot(botId, mao, cartasNaMesa, trunfo) {
    const duplaBot = gameState.jogadores[botId].dupla;

    // Se for o primeiro da vaza:
    if (cartasNaMesa.length === 0) {
        // Descarta carta sem pontos que não seja trunfo
        const descartes = mao.filter(c => c.pontos === 0 && c.naipe !== trunfo);
        if (descartes.length > 0) return descartes[0];
        return mao.slice().sort((a, b) => a.forca - b.forca)[0];
    }

    // Vencedor atual da mesa:
    const vencedorAtual = calcularVencedorParcial(cartasNaMesa, trunfo);
    const parceiroGanhando = (gameState.jogadores[vencedorAtual.jogadorId].dupla === duplaBot);

    // Evita Heley de amigo se o parceiro acabou de jogar o 7 de trunfo:
    const ultimaJogada = cartasNaMesa[cartasNaMesa.length - 1];
    const ehParceiro = gameState.jogadores[ultimaJogada.jogadorId].dupla === duplaBot;
    const jogouSeteDeTrunfo = (ultimaJogada.carta.valor === '7' && ultimaJogada.carta.naipe === trunfo);

    if (ehParceiro && jogouSeteDeTrunfo) {
        const cartasSeguras = mao.filter(c => !(c.valor === 'Ás' && c.naipe === trunfo));
        if (cartasSeguras.length > 0) return cartasSeguras[0];
    }

    // Se o parceiro já está vencendo a vaza:
    if (parceiroGanhando) {
        const cartaPontos = mao.find(c => c.pontos > 0 && c.naipe !== trunfo);
        if (cartaPontos) return cartaPontos;
        return mao.slice().sort((a, b) => a.forca - b.forca)[0];
    }

    // Se adversário está vencendo: tenta cobrir com a menor carta vencedora
    const cartasQueGanham = mao.filter(c => {
        return comparaDuasCartas(c, vencedorAtual.carta, cartasNaMesa[0].carta.naipe, trunfo) > 0;
    });

    if (cartasQueGanham.length > 0) {
        return cartasQueGanham.sort((a, b) => a.forca - b.forca)[0];
    }

    // Não vence: joga a carta mais fraca
    const descartes = mao.filter(c => c.naipe !== trunfo && c.pontos === 0);
    if (descartes.length > 0) return descartes[0];
    return mao.slice().sort((a, b) => a.forca - b.forca)[0];
}

// ============================================================
// 5. DETERMINAÇÃO DO VENCEDOR DA VAZA & REGRA DO HELEY
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

/**
 * Avalia o término de uma vaza (rodada de 4 cartas)
 */
function avaliarFimDaVaza() {
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
        // Animação de recolher
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

/**
 * Compra de cartas após a vaza:
 * - O vencedor da rodada compra primeiro.
 * - Os outros compram em sentido horário.
 * - Cada jogador compra exatamente 1 carta.
 * - As cartas são retiradas estritamente do monte pré-embaralhado.
 * - A última carta do monte é a carta indicadora do trunfo da mesa!
 */
function executarCompraAposVaza(vencedorId) {
    if (gameState.monte.length === 0) {
        // Monte completamente vazio: não há mais compras
        return;
    }

    // Ordem de compra iniciando pelo vencedor da vaza
    for (let offset = 0; offset < 4; offset++) {
        const jId = (vencedorId + offset) % 4;

        if (gameState.monte.length > 0) {
            const cartaComprada = gameState.monte.pop();
            gameState.jogadores[jId].mao.push(cartaComprada);

            // Se o monte chegou a zero e a carta de trunfo estava nele, esconde da mesa
            if (gameState.monte.length === 0) {
                gameState.cartaTrunfoMesa = null;
                atualizarDisplayTrunfo();
            }
        }
    }

    atualizarDisplayMonte();
    renderizarMaoJogador(false, true); // com animação de compra para o jogador
    renderizarMaosOponentes();
}

// ============================================================
// 6. FINAL DA MÃO & PONTUAÇÃO (CAPOTE, VITÓRIA SIMPLES, 120 PTS)
// ============================================================

function avaliarFimDaMao() {
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

    // Prepara para a próxima mão
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
    gameState.partidaEncerrada = true;
    gameState.maoAtiva = false;

    dom.modalWinnerTitle.textContent = (duplaVencedora === 1) ? '🏆 VITÓRIA DA SUA DUPLA!' : 'DERROTA!';
    dom.modalWinnerDesc.textContent = `${motivo} ${duplaVencedora === 1 ? 'Você e seu parceiro venceram a partida de Bisca Capixaba!' : 'A dupla adversária levou a melhor desta vez.'}`;
    dom.modalFinalScore.textContent = `${gameState.placarPartida.dupla1} x ${gameState.placarPartida.dupla2}`;

    dom.victoryModal.style.display = 'flex';
}

function prepararNovaMao() {
    gameState.maoAtiva = false;
    gameState.cartasNaMesa = [];
    gameState.cartaTrunfoMesa = null;
    gameState.naipeTrunfo = null;
    gameState.multiplicador = 1;
    gameState.rodadaAtual = 0;
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
// 7. RENDERIZAÇÃO DA INTERFACE & CARTAS REALISTAS
// ============================================================

/**
 * Cria o elemento visual HTML de uma carta de baralho realista
 */
function criarElementoCarta(carta, options = { interativa: false, onClick: null, animClasse: '' }) {
    const el = document.createElement('div');
    const naipeClasse = `suit-${carta.naipe.toLowerCase()}`;
    const icone = ICONES_NAIPES[carta.naipe];

    el.className = `card-item ${naipeClasse} ${options.interativa ? 'clickable' : ''} ${options.animClasse || ''}`;
    el.dataset.id = carta.id;

    el.innerHTML = `
        <div class="card-corner-top">
            <span class="card-val">${carta.valor}</span>
            <span class="card-suit">${icone}</span>
        </div>
        <div class="card-center-art">${icone}</div>
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

        const el = criarElementoCarta(carta, {
            interativa: (gameState.jogadorVez === 0 && !gameState.vazaProcessando),
            onClick: () => jogarCartaHumano(idx),
            animClasse: animClasse
        });
        dom.userCardsRow.appendChild(el);
    });
}

function renderizarMaosOponentes() {
    // Jogador 1 (Esquerda - Adversário 1)
    dom.handP1.innerHTML = '';
    gameState.jogadores[1].mao.forEach(() => {
        dom.handP1.appendChild(criarElementoVersoCarta());
    });

    // Jogador 2 (Topo - Parceiro)
    dom.handP2.innerHTML = '';
    gameState.jogadores[2].mao.forEach(() => {
        dom.handP2.appendChild(criarElementoVersoCarta());
    });

    // Jogador 3 (Direita - Adversário 2)
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

    // Exibe a carta na mesa
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

    // Destaca a mão do jogador local quando for a vez dele
    if (jogadorId === 0 && gameState.maoAtiva && !gameState.vazaProcessando) {
        dom.userHandContainer.classList.add('my-turn');
    } else {
        dom.userHandContainer.classList.remove('my-turn');
    }

    renderizarMaoJogador(false);
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
// 8. EVENT LISTENERS E INICIALIZAÇÃO
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

// Inicializa o jogo ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    prepararNovaMao();
});
