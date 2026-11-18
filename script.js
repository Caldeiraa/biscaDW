// script.js – Bisca Capixaba prototype
// ------------------------------------------------------------
// Game state variables
let deck = [];
let sevenOfTrumpPlayed = false;
let players = {
    1: [], // Você (hand displayed)
    2: [], // Adversário
    3: [], // Parceiro
    4: []  // Adversário
};
let playedCards = [];
let currentPlayer = 1; // 1 = you, then 2,3,4 automatically
let trumpSuit = null;
let isBaterActive = false;
let scoreMultiplier = 1;
let teamScore = { A: 0, B: 0 }; // A = you+partner, B = adversários

// ------------------------------------------------------------
// Helper data
const suits = ["COPAS", "OUROS", "ESPADAS", "PAUS"];
const ranks = ["ÁS", "2", "3", "4", "5", "6", "7", "VALETE", "DAMA", "REI"];
// Assign point values (typical for Bisca; can be altered later)
const rankPoints = {
    "ÁS": 11,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "VALETE": 2,
    "DAMA": 3,
    "REI": 4
};

// Helper to draw three cards to player 1 (hand) after cut/bater
function drawThreeCards() {
    // Ensure enough cards in deck
    if (deck.length < 3) {
        criarBaralho();
        embaralharBaralho();
    }
    // Clear current hand
    players[1] = [];
    for (let i = 0; i < 3; i++) {
        const card = deck.shift();
        players[1].push(card);
    }
    renderHands();
}


// ------------------------------------------------------------
// 1. Deck creation & shuffling
function criarBaralho() {
    deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit, points: rankPoints[rank] });
        }
    }
}

function embaralharBaralho() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// ------------------------------------------------------------
// 2. Cut (cortar) – only allowed when no round in progress
function cortarBaralho() {
    if (playedCards.length > 0) {
        alert("Não é possível cortar durante uma rodada em andamento.");
        return;
    }
    const cutIndex = Math.floor(Math.random() * deck.length);
    const top = deck.slice(0, cutIndex);
    const bottom = deck.slice(cutIndex);
    deck = bottom.concat(top);
    // Simple visual cue – flash the cut button
    const btn = document.getElementById("cutButton");
    btn.classList.add("flash");
    setTimeout(() => btn.classList.remove("flash"), 300);
}

// ------------------------------------------------------------
// 3. BATER – set trump to COPAS and double scoring
function baterJogo() {
    if (isBaterActive) {
        alert("O modo BATER já está ativo.");
        return;
    }
    trumpSuit = "COPAS";
    isBaterActive = true;
    scoreMultiplier = 2;
    document.getElementById("trumpSuit").textContent = `Trunfo: ${trumpSuit}`;
    const btn = document.getElementById("baterButton");
    btn.classList.add("active");
}

// ------------------------------------------------------------
// 4. Distribution – 3 cards each player
function distribuirCartas() {
    // Ensure deck has enough cards; recreate & shuffle if empty
    if (deck.length < 12) {
        criarBaralho();
        embaralharBaralho();
    }
    // Clear previous hands
    for (let p = 1; p <= 4; p++) players[p] = [];
    // Deal three rounds
    for (let i = 0; i < 3; i++) {
        for (let p = 1; p <= 4; p++) {
            const card = deck.shift();
            players[p].push(card);
        }
    }
    renderHands();
    currentPlayer = 1; // começa por você
    atualizarBotoes();
}

// ------------------------------------------------------------
// 5. UI Rendering helpers
function criarElementoCarta(carta, selectable = false) {
    const el = document.createElement("div");
    el.className = "card suit-" + carta.suit;
    if (selectable) el.classList.add("selectable");
    el.innerHTML = `
        <div class="rank">${carta.rank}</div>
        <div class="suit">${carta.suit}</div>
    `;
    el.dataset.rank = carta.rank;
    el.dataset.suit = carta.suit;
    return el;
}

function renderHands() {
    // Only render your hand (player 1) in the bottom hand area
    const handDiv = document.getElementById("playerHand");
    handDiv.innerHTML = "";
    players[1].forEach((carta, idx) => {
        const cardEl = criarElementoCarta(carta, true);
        cardEl.addEventListener("click", () => selecionarCarta(idx));
        handDiv.appendChild(cardEl);
    });
}

function renderPlayedCards() {
    const area = document.getElementById("playedCards");
    area.innerHTML = "";
    playedCards.forEach(c => {
        const el = criarElementoCarta(c);
        area.appendChild(el);
    });
}

function atualizarPlacar() {
    document.getElementById("scoreA").textContent = teamScore.A;
    document.getElementById("scoreB").textContent = teamScore.B;
}

function atualizarBotoes() {
    // Cut only allowed when no cards on table
    document.getElementById("cutButton").disabled = playedCards.length > 0;
    // Bater can be pressed anytime, but disable if already active
    document.getElementById("baterButton").disabled = isBaterActive;
}

// ------------------------------------------------------------
// 6. Card selection & play
let selectedHandIndex = null;
function selecionarCarta(idx) {
    const handDiv = document.getElementById("playerHand");
    const cards = handDiv.querySelectorAll('.card');
    cards.forEach(c => c.classList.remove('selected'));
    if (selectedHandIndex === idx) {
        selectedHandIndex = null;
    } else {
        selectedHandIndex = idx;
        cards[idx].classList.add('selected');
    }
}

function jogarCarta() {
    if (selectedHandIndex === null) {
        alert("Selecione uma carta da sua mão para jogar.");
        return;
    }
    const carta = players[1].splice(selectedHandIndex, 1)[0];
    // Rule: Ás de trunfo só pode ser jogado depois que o 7 de trunfo foi jogado
    if (trumpSuit && carta.rank === "ÁS" && carta.suit === trumpSuit && !sevenOfTrumpPlayed) {
        alert("Não pode jogar o ÁS de trunfo antes do 7 de trunfo.");
        // devolve a carta à mão
        players[1].splice(selectedHandIndex, 0, carta);
        renderHands();
        return;
    }
    // Track if 7 of trump is played
    if (trumpSuit && carta.rank === "7" && carta.suit === trumpSuit) {
        sevenOfTrumpPlayed = true;
    }
    playedCards.push(carta);
    renderPlayedCards();
    renderHands();
    selectedHandIndex = null;
    avançarTurno();
}

function avançarTurno() {
    while (playedCards.length < 4) {
        const nextPlayer = (currentPlayer % 4) + 1;
        if (nextPlayer === 1) break; // wait for human
        const hand = players[nextPlayer];
        // Choose a valid card respecting the "Ás de trunfo after 7" rule
        let idx = Math.floor(Math.random() * hand.length);
        let carta = hand[idx];
        if (trumpSuit && carta.rank === "ÁS" && carta.suit === trumpSuit && !sevenOfTrumpPlayed) {
            const alternatives = hand.filter(c => !(c.rank === "ÁS" && c.suit === trumpSuit && !sevenOfTrumpPlayed));
            if (alternatives.length > 0) {
                carta = alternatives[Math.floor(Math.random() * alternatives.length)];
                idx = hand.indexOf(carta);
            }
        }
        const removed = hand.splice(idx, 1)[0];
        playedCards.push(removed);
        if (trumpSuit && removed.rank === "7" && removed.suit === trumpSuit) {
            sevenOfTrumpPlayed = true;
        }
        renderPlayedCards();
        currentPlayer = nextPlayer;
        if (playedCards.length === 4) break;
    }
    if (playedCards.length === 4) {
        setTimeout(finalizarRodada, 800);
    }
}
    while (playedCards.length < 4) {
        const nextPlayer = (currentPlayer % 4) + 1;
        if (nextPlayer === 1) break; // wait for human
        const hand = players[nextPlayer];
        const idx = Math.floor(Math.random() * hand.length);
        const carta = hand.splice(idx, 1)[0];
        playedCards.push(carta);
        renderPlayedCards();
        currentPlayer = nextPlayer;
        if (playedCards.length === 4) break;
    }
    if (playedCards.length === 4) {
        setTimeout(finalizarRodada, 800);
    }
}

// ------------------------------------------------------------
// 7. Round finalisation
function finalizarRodada() {
    const pontos = calcularPontuacao(playedCards);
    const equipe = determinarEquipeVencedora(); // placeholder logic
    if (equipe === "A") {
        teamScore.A += pontos * scoreMultiplier;
    } else if (equipe === "B") {
        teamScore.B += pontos * scoreMultiplier;
    }
    atualizarPlacar();
    playedCards = [];
    renderPlayedCards();
    atualizarBotoes();
    selectedHandIndex = null;
    renderHands();
    if (deck.length < 12) {
        alert("Baralho acabou. Reiniciando partida.");
        reiniciarPartida();
    }
}

function calcularPontuacao(cartas) {
    return cartas.reduce((sum, c) => sum + c.points, 0);
}

function determinarEquipeVencedora() {
    // Placeholder: random winner for demo
    return Math.random() < 0.5 ? "A" : "B";
}

// ------------------------------------------------------------
// 8. Restart
function reiniciarPartida() {
    criarBaralho();
    embaralharBaralho();
    trumpSuit = null;
    isBaterActive = false;
    scoreMultiplier = 1;
    teamScore = { A: 0, B: 0 };
    document.getElementById("trumpSuit").textContent = "Trunfo: —";
    document.getElementById("baterButton").classList.remove("active");
    distribuirCartas();
    atualizarPlacar();
    playedCards = [];
    renderPlayedCards();
    atualizarBotoes();
}

// ------------------------------------------------------------
// 9. Event listeners
document.getElementById("cutButton").addEventListener("click", cortarBaralho);
document.getElementById("baterButton").addEventListener("click", baterJogo);
document.getElementById("restartButton").addEventListener("click", reiniciarPartida);
document.getElementById("playerHand").addEventListener("dblclick", jogarCarta);

// ------------------------------------------------------------
// 10. Initialise game on load
window.addEventListener("load", () => {
    criarBaralho();
    embaralharBaralho();
    distribuirCartas();
    atualizarPlacar();
    atualizarBotoes();
});

// ------------------------------------------------------------
// Note: calcularPontuacao, determinarEquipeVencedora, etc.
// are intentionally simple and should be replaced with the official
// Bisca Capixaba rules later.

