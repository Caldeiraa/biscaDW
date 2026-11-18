// tests/novas_regras.test.js
const test = require('node:test');
const assert = require('node:assert');
const {
    gameState,
    determinarNaipeCorte,
    validarJogada,
    criarBaralho
} = require('../script.js');

test('1. Testes de Corte - Ás e 7 invertem o naipe', (t) => {
    // Ás e 7 de Ouros -> Copas
    assert.strictEqual(determinarNaipeCorte({ valor: 'Ás', naipe: 'Ouros' }), 'Copas');
    assert.strictEqual(determinarNaipeCorte({ valor: '7', naipe: 'Ouros' }), 'Copas');

    // Ás e 7 de Copas -> Ouros
    assert.strictEqual(determinarNaipeCorte({ valor: 'Ás', naipe: 'Copas' }), 'Ouros');
    assert.strictEqual(determinarNaipeCorte({ valor: '7', naipe: 'Copas' }), 'Ouros');

    // Ás e 7 de Espadas -> Paus
    assert.strictEqual(determinarNaipeCorte({ valor: 'Ás', naipe: 'Espadas' }), 'Paus');
    assert.strictEqual(determinarNaipeCorte({ valor: '7', naipe: 'Espadas' }), 'Paus');

    // Ás e 7 de Paus -> Espadas
    assert.strictEqual(determinarNaipeCorte({ valor: 'Ás', naipe: 'Paus' }), 'Espadas');
    assert.strictEqual(determinarNaipeCorte({ valor: '7', naipe: 'Paus' }), 'Espadas');

    // Cartas diferentes de Ás e 7 mantêm o próprio naipe
    assert.strictEqual(determinarNaipeCorte({ valor: 'Rei', naipe: 'Ouros' }), 'Ouros');
    assert.strictEqual(determinarNaipeCorte({ valor: 'Valete', naipe: 'Copas' }), 'Copas');
    assert.strictEqual(determinarNaipeCorte({ valor: 'Dama', naipe: 'Espadas' }), 'Espadas');
    assert.strictEqual(determinarNaipeCorte({ valor: '6', naipe: 'Paus' }), 'Paus');
    assert.strictEqual(determinarNaipeCorte({ valor: '2', naipe: 'Ouros' }), 'Ouros');
});

test('2. Testes de Validação - Regra do Ás de Trunfo (só após o 7 de trunfo)', (t) => {
    // Configura estado
    gameState.maoAtiva = true;
    gameState.vazaProcessando = false;
    gameState.jogadorVez = 0;
    gameState.naipeTrunfo = 'Copas';
    gameState.seteDeTrunfoJogado = false;
    gameState.cartasNaMesa = [];

    const maoComOutras = [
        { id: 'Ás_Copas', valor: 'Ás', naipe: 'Copas', pontos: 11, forca: 10 },
        { id: 'Rei_Ouros', valor: 'Rei', naipe: 'Ouros', pontos: 4, forca: 8 },
        { id: '2_Espadas', valor: '2', naipe: 'Espadas', pontos: 0, forca: 1 }
    ];

    // Ás de trunfo antes do 7 sair com outras cartas na mão -> BLOQUEADO
    const resAsBloqueado = validarJogada(0, maoComOutras[0], maoComOutras);
    assert.strictEqual(resAsBloqueado.valido, false);
    assert.match(resAsBloqueado.motivo, /O Ás de trunfo só pode ser jogado depois que o 7 de trunfo sair/);

    // Outra carta (Rei de Ouros) -> PERMITIDO
    const resReiPermitido = validarJogada(0, maoComOutras[1], maoComOutras);
    assert.strictEqual(resReiPermitido.valido, true);

    // Após o 7 de trunfo ter sido jogado
    gameState.seteDeTrunfoJogado = true;
    const resAsLiberado = validarJogada(0, maoComOutras[0], maoComOutras);
    assert.strictEqual(resAsLiberado.valido, true);
});

test('3. Testes de Validação - Regra do 7 de Trunfo (Não pode sair de fundo)', (t) => {
    gameState.maoAtiva = true;
    gameState.vazaProcessando = false;
    gameState.jogadorVez = 0;
    gameState.naipeTrunfo = 'Copas';
    gameState.seteDeTrunfoJogado = false;

    const mao = [
        { id: '7_Copas', valor: '7', naipe: 'Copas', pontos: 10, forca: 9 },
        { id: 'Rei_Espadas', valor: 'Rei', naipe: 'Espadas', pontos: 4, forca: 8 },
        { id: '3_Ouros', valor: '3', naipe: 'Ouros', pontos: 0, forca: 2 }
    ];

    // Posição 1 (primeira carta da rodada) -> PERMITIDO
    gameState.cartasNaMesa = [];
    assert.strictEqual(validarJogada(0, mao[0], mao).valido, true);

    // Posição 2 (segunda carta da rodada) -> PERMITIDO
    gameState.cartasNaMesa = [{ jogadorId: 1, carta: { valor: '2', naipe: 'Paus' } }];
    assert.strictEqual(validarJogada(0, mao[0], mao).valido, true);

    // Posição 3 (terceira carta da rodada) -> PERMITIDO
    gameState.cartasNaMesa = [
        { jogadorId: 1, carta: { valor: '2', naipe: 'Paus' } },
        { jogadorId: 2, carta: { valor: '4', naipe: 'Paus' } }
    ];
    assert.strictEqual(validarJogada(0, mao[0], mao).valido, true);

    // Posição 4 (quarta carta da rodada / de fundo) com mão > 1 -> BLOQUEADO
    gameState.cartasNaMesa = [
        { jogadorId: 1, carta: { valor: '2', naipe: 'Paus' } },
        { jogadorId: 2, carta: { valor: '4', naipe: 'Paus' } },
        { jogadorId: 3, carta: { valor: '5', naipe: 'Paus' } }
    ];
    const resFundoBloqueado = validarJogada(0, mao[0], mao);
    assert.strictEqual(resFundoBloqueado.valido, false);
    assert.match(resFundoBloqueado.motivo, /O 7 de trunfo não pode ser jogado de fundo/);

    // Outra carta da mão (Rei de Espadas) na posição 4 -> PERMITIDO
    assert.strictEqual(validarJogada(0, mao[1], mao).valido, true);

    // Exceção: última mão da partida (quando resta somente 1 carta na mão)
    const maoUltimaCarta = [mao[0]]; // apenas o 7 de Copas
    const resFundoUltimaMao = validarJogada(0, maoUltimaCarta[0], maoUltimaCarta);
    assert.strictEqual(resFundoUltimaMao.valido, true);
});

test('4. Testes de Validação - Integridade e Permissões de Jogada', (t) => {
    gameState.maoAtiva = true;
    gameState.vazaProcessando = false;
    gameState.jogadorVez = 0;

    const mao = [{ id: 'Rei_Ouros', valor: 'Rei', naipe: 'Ouros' }];
    const cartaNaoPertencente = { id: 'Ás_Espadas', valor: 'Ás', naipe: 'Espadas' };

    // Carta não pertencente à mão -> BLOQUEADO
    const resNaoPertence = validarJogada(0, cartaNaoPertencente, mao);
    assert.strictEqual(resNaoPertence.valido, false);
    assert.match(resNaoPertence.motivo, /não está na sua mão/);

    // Jogador fora da sua vez -> BLOQUEADO
    const resForaDaVez = validarJogada(1, mao[0], mao);
    assert.strictEqual(resForaDaVez.valido, false);
    assert.match(resForaDaVez.motivo, /Não é a sua vez/);
});

test('5. Testes do Temporizador e Seleção Automática de Carta Válida', (t) => {
    gameState.maoAtiva = true;
    gameState.vazaProcessando = false;
    gameState.jogadorVez = 0;
    gameState.naipeTrunfo = 'Copas';
    gameState.seteDeTrunfoJogado = false;
    gameState.cartasNaMesa = [
        { jogadorId: 1, carta: { valor: '2', naipe: 'Paus' } },
        { jogadorId: 2, carta: { valor: '4', naipe: 'Paus' } },
        { jogadorId: 3, carta: { valor: '5', naipe: 'Paus' } }
    ]; // Quarta carta da rodada!

    // Mão contendo:
    // 1. Ás de Copas (trunfo) -> Bloqueado porque 7 de trunfo não saiu
    // 2. 7 de Copas (trunfo) -> Bloqueado porque é a 4ª carta da rodada e tem mais de 1 carta
    // 3. Rei de Ouros -> VÁLIDO!
    const mao = [
        { id: 'Ás_Copas', valor: 'Ás', naipe: 'Copas', pontos: 11, forca: 10 },
        { id: '7_Copas', valor: '7', naipe: 'Copas', pontos: 10, forca: 9 },
        { id: 'Rei_Ouros', valor: 'Rei', naipe: 'Ouros', pontos: 4, forca: 8 }
    ];

    // Filtra cartas válidas para jogada automática
    const cartasValidas = mao.filter(c => validarJogada(0, c, mao).valido);

    assert.strictEqual(cartasValidas.length, 1);
    assert.strictEqual(cartasValidas[0].id, 'Rei_Ouros');
});
