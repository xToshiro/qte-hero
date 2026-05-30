/* ==========================================
   GAME ENGINE - QTE HERO (XBOX EDITION)
   Gerencia os estados de jogo, progresso e a lógica de QTEs
   ========================================== */

class GameEngine {
    constructor() {
        // Estado atual: 'MENU', 'PLAYGROUND', 'PLAYING', 'GAMEOVER', 'VICTORY'
        this.state = 'MENU';
        
        // Configurações de Gameplay
        this.mode = 'normal'; // 'normal' (Treino) ou 'hardcore' (Morte Súbita)
        this.difficulty = 'easy'; // 'easy', 'medium', 'hard', 'insane'
        
        // Parâmetros de Dificuldade
        this.difficultyParams = {
            easy: {
                baseDuration: 2500,  // 2.5 segundos
                speedStep: 40,       // Aceleração por acerto (ms)
                minDuration: 1100,   // Tempo mínimo limite
                mashTarget: 4,       // Cliques para esmagar
                holdTarget: 1000     // Tempo de segurar (ms)
            },
            medium: {
                baseDuration: 1800,  // 1.8 segundos
                speedStep: 45,
                minDuration: 850,
                mashTarget: 5,
                holdTarget: 1200
            },
            hard: {
                baseDuration: 1200,  // 1.2 segundos
                speedStep: 50,
                minDuration: 600,
                mashTarget: 6,
                holdTarget: 1400
            },
            insane: {
                baseDuration: 800,   // 0.8 segundos
                speedStep: 60,
                minDuration: 420,
                mashTarget: 7,
                holdTarget: 1500
            }
        };

        // Estado da Partida
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.currentEventIndex = 0;
        this.totalEventsInLevel = 30; // 30 QTEs por fase
        
        // Evento QTE Ativo
        this.activeQTE = null; // Detalhes do QTE atual
        this.activeQTEDuration = 0; // Tempo total concedido para o QTE atual
        this.activeQTETimeRemaining = 0; // Tempo restante no QTE atual
        
        // Estatísticas para Tela Final
        this.totalHits = 0;
        this.totalAttempts = 0;
        this.reactionTimes = []; // Guarda o tempo de reação em ms
        
        // Elementos DOM
        this.dom = {};
        
        // Flag para evitar duplos cliques no loop
        this.lastFrameTime = 0;
        this.isHoldingEventActive = false;
        this.holdProgress = 0; // Progresso de segurar
        this.mashProgress = 0; // Cliques acumulados no Mash

        // Mapeamento visual das teclas no Playground
        this.playgroundKeys = [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 
            'DUp', 'DDown', 'DLeft', 'DRight', 'View', 'Menu'
        ];

        // Novos estados analíticos e consentimento
        this.roundEvents = [];
        this.roundStartTime = 0;
        this.theme = 'dark';
        this.isDataConsentGiven = false;
        this.history = [];

        // Pausa
        this.isPaused = false;
        
        // Contagem Regressiva
        this.countdownValue = 0;
        this.isCountingDown = false;

        // Tipo de Layout do Controle
        this.layout = 'xbox';

        // Navegação por Controle no Menu
        this.menuGrid = [
            ['layout-xbox-btn', 'layout-ps4-btn'],
            ['mode-normal', 'mode-hardcore'],
            ['diff-easy', 'diff-medium'],
            ['diff-hard', 'diff-insane'],
            ['start-game-btn', 'open-playground-btn'],
            ['open-stats-btn', 'open-stats-btn']
        ];
        this.menuRow = 0;
        this.menuCol = 0;
        this.isMenuGamepadActive = false;

        // Navegação por Controle no Pause
        this.pauseItems = ['resume-game-btn', 'exit-game-btn'];
        this.pauseIndex = 0;

        // Navegação por Controle no Game Over e Victory
        this.goItems = ['restart-game-btn', 'menu-btn-from-go'];
        this.goIndex = 0;
        
        this.vicItems = ['restart-game-victory-btn', 'menu-btn-from-vic'];
        this.vicIndex = 0;
    }

    // Inicialização da engine
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initThemeAndConsent();
        
        // Inicializa o Loop Principal do Jogo (60 FPS via RequestAnimationFrame)
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    // Cache de referências DOM para alta performance
    cacheDOM() {
        this.dom.screens = {
            menu: document.getElementById('menu-screen'),
            playground: document.getElementById('playground-screen'),
            game: document.getElementById('game-screen'),
            gameover: document.getElementById('gameover-screen'),
            victory: document.getElementById('victory-screen')
        };
        
        // Status do Controle
        this.dom.gamepadStatusCard = document.getElementById('gamepad-status-card');
        this.dom.gamepadStatusText = document.getElementById('gamepad-status-text');
        this.dom.gamepadName = document.getElementById('gamepad-name');
        
        // HUD do Jogo
        this.dom.hudScore = document.getElementById('game-score');
        this.dom.hudCombo = document.getElementById('game-combo');
        this.dom.hudComboBox = document.getElementById('combo-box');
        this.dom.hudComboRingFill = document.getElementById('combo-ring-fill');
        this.dom.hudLivesBox = document.getElementById('lives-box');
        this.dom.hudLivesDisplay = document.getElementById('lives-display');
        this.dom.hudProgressBar = document.getElementById('level-progress-bar');
        this.dom.hudProgressRatio = document.getElementById('level-progress-ratio');
        
        // Elementos de QTE Arena
        this.dom.qteContainer = document.getElementById('qte-container');
        this.dom.qteTimerIndicator = document.getElementById('timer-indicator');
        this.dom.qtePrompt = document.getElementById('qte-prompt');
        this.dom.actionBanner = document.getElementById('action-banner');
        this.dom.mashCounter = document.getElementById('mash-counter');
        this.dom.feedbackText = document.getElementById('feedback-text');
        this.dom.screenFlash = document.getElementById('screen-flash');

        // Estatísticas de Fim de Jogo
        this.dom.goScore = document.getElementById('go-score');
        this.dom.goCombo = document.getElementById('go-combo');
        this.dom.goAccuracy = document.getElementById('go-accuracy');
        this.dom.goReaction = document.getElementById('go-reaction');
        this.dom.goMessage = document.getElementById('gameover-message');

        this.dom.vicScore = document.getElementById('vic-score');
        this.dom.vicCombo = document.getElementById('vic-combo');
        this.dom.vicAccuracy = document.getElementById('vic-accuracy');
        this.dom.vicReaction = document.getElementById('vic-reaction');
        
        // Elementos Diagnósticos do Playground
        this.dom.diagLSX = document.getElementById('diag-ls-x');
        this.dom.diagLSY = document.getElementById('diag-ls-y');
        this.dom.diagRSX = document.getElementById('diag-rs-x');
        this.dom.diagRSY = document.getElementById('diag-rs-y');
        this.dom.dotLS = document.getElementById('dot-ls');
        this.dom.dotRS = document.getElementById('dot-rs');
        this.dom.knobLS = document.getElementById('knob-LS'); // knob do controle visual
        this.dom.hapticSupport = document.getElementById('haptic-supported');

        // Elementos do Tema, Cookies e Consentimento
        this.dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.dom.consentBanner = document.getElementById('consent-banner');
        this.dom.consentAcceptBtn = document.getElementById('consent-accept-btn');
        this.dom.consentDeclineBtn = document.getElementById('consent-decline-btn');
        
        this.dom.privacyModal = document.getElementById('privacy-modal');
        this.dom.openPrivacyBtn = document.getElementById('open-privacy-btn');
        this.dom.closePrivacyBtn = document.getElementById('close-privacy-btn');
        
        this.dom.exportDataBtn = document.getElementById('export-data-btn');
        this.dom.importDataBtn = document.getElementById('import-data-btn');
        this.dom.importFileInput = document.getElementById('import-file-input');
        this.dom.clearDataBtn = document.getElementById('clear-data-btn');

        // Elementos do Modal de Pausa
        this.dom.pauseModal = document.getElementById('pause-modal');
        this.dom.resumeGameBtn = document.getElementById('resume-game-btn');
        this.dom.exitGameBtn = document.getElementById('exit-game-btn');
        
        // Subtítulo do Logo Principal
        this.dom.subLogo = document.getElementById('sub-logo');

        // Elementos da Tela de Estatísticas Históricas
        this.dom.screens.stats = document.getElementById('stats-screen');
        this.dom.openStatsBtn = document.getElementById('open-stats-btn');
        this.dom.backToMenuFromStats = document.getElementById('back-to-menu-from-stats');
        this.dom.startFirstGameBtn = document.getElementById('start-first-game-btn');
        this.dom.statsEmptyPanel = document.getElementById('stats-empty-panel');
        this.dom.statsMainLayout = document.getElementById('stats-main-layout');
        this.dom.histMatches = document.getElementById('hist-matches');
        this.dom.histBestScore = document.getElementById('hist-best-score');
        this.dom.histAvgReaction = document.getElementById('hist-avg-reaction');
        this.dom.histAvgAccuracy = document.getElementById('hist-avg-accuracy');
        this.dom.histInsights = document.getElementById('hist-insights');
        this.dom.recentMatchesTbody = document.getElementById('recent-matches-tbody');
    }

    // Vincula cliques aos botões da tela
    bindEvents() {
        // Seleção de Layout do Controle
        document.getElementById('layout-xbox-btn').addEventListener('click', () => this.selectLayout('xbox'));
        document.getElementById('layout-ps4-btn').addEventListener('click', () => this.selectLayout('ps4'));

        // Seleção de Modo
        document.getElementById('mode-normal').addEventListener('click', () => this.selectMode('normal'));
        document.getElementById('mode-hardcore').addEventListener('click', () => this.selectMode('hardcore'));
        
        // Seleção de Dificuldade
        ['easy', 'medium', 'hard', 'insane'].forEach(diff => {
            document.getElementById(`diff-${diff}`).addEventListener('click', () => this.selectDifficulty(diff));
        });

        // Botões de Navegação e Ação
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('open-playground-btn').addEventListener('click', () => this.switchState('PLAYGROUND'));
        
        document.getElementById('back-to-menu-from-playground').addEventListener('click', () => this.switchState('MENU'));
        document.getElementById('test-vibration-btn').addEventListener('click', () => {
            inputs.vibrate(300, 1.0, 1.0);
            sfx.playHit();
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn-from-go').addEventListener('click', () => this.switchState('MENU'));
        
        document.getElementById('restart-game-victory-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn-from-vic').addEventListener('click', () => this.switchState('MENU'));

        // Registrar Callbacks de Conexão do Gamepad no input manager
        inputs.onConnectCallback = (gp) => this.handleGamepadConnected(gp);
        inputs.onDisconnectCallback = () => this.handleGamepadDisconnected();

        // Alternador de Temas
        this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Modais e Consentimento
        this.dom.consentAcceptBtn.addEventListener('click', () => this.handleConsentResponse(true));
        this.dom.consentDeclineBtn.addEventListener('click', () => this.handleConsentResponse(false));
        
        this.dom.openPrivacyBtn.addEventListener('click', () => {
            this.dom.privacyModal.classList.remove('hidden');
        });
        
        this.dom.closePrivacyBtn.addEventListener('click', () => {
            this.dom.privacyModal.classList.add('hidden');
        });

        // Fechar modal clicando fora dele
        this.dom.privacyModal.addEventListener('click', (e) => {
            if (e.target === this.dom.privacyModal) {
                this.dom.privacyModal.classList.add('hidden');
            }
        });

        // Exportação e Importação de Dados JSON
        this.dom.exportDataBtn.addEventListener('click', () => this.exportData());
        this.dom.importDataBtn.addEventListener('click', () => {
            this.dom.importFileInput.click();
        });
        this.dom.importFileInput.addEventListener('change', (e) => this.importData(e));
        this.dom.clearDataBtn.addEventListener('click', () => this.clearAllData());

        // Binds do Menu de Pausa
        this.dom.resumeGameBtn.addEventListener('click', () => this.togglePause());
        this.dom.exitGameBtn.addEventListener('click', () => {
            this.togglePause();
            this.switchState('MENU');
        });

        // Binds da Tela de Estatísticas Históricas
        this.dom.openStatsBtn.addEventListener('click', () => this.switchState('STATS'));
        this.dom.backToMenuFromStats.addEventListener('click', () => this.switchState('MENU'));
        this.dom.startFirstGameBtn.addEventListener('click', () => this.startGame());
    }

    // ==========================================
    // FLUXO DE NAVEGAÇÃO / ESTADOS
    // ==========================================

    switchState(newState) {
        this.state = newState;
        
        // Oculta todas as telas
        for (let key in this.dom.screens) {
            this.dom.screens[key].classList.remove('active');
        }

        // Reseta estados para evitar fantasmas de entrada
        inputs.resetInputs();

        // Ativa a tela solicitada e executa ações de transição
        switch(newState) {
            case 'MENU':
                this.dom.screens.menu.classList.add('active');
                // Reseta foco gamepad no menu
                this.menuRow = 0;
                this.menuCol = 0;
                this.isMenuGamepadActive = false;
                this.menuGrid.forEach(row => {
                    row.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.classList.remove('gamepad-focused');
                    });
                });
                break;
            case 'PLAYGROUND':
                this.dom.screens.playground.classList.add('active');
                this.checkHapticSupport();
                this.updatePlaygroundLabels();
                break;
            case 'STATS':
                this.dom.screens.stats.classList.add('active');
                this.renderHistoricalStats();
                break;
            case 'PLAYING':
                this.dom.screens.game.classList.add('active');
                break;
            case 'GAMEOVER':
                this.dom.screens.gameover.classList.add('active');
                sfx.playGameOver();
                this.fillEndStats('go');
                this.renderPerformanceChart('go');
                this.renderNerdStats('go');
                this.saveRoundToHistory();
                
                // Inicializa foco do controle no Game Over
                this.goIndex = 0;
                this.updateGameOverGamepadFocus();
                break;
            case 'VICTORY':
                this.dom.screens.victory.classList.add('active');
                sfx.playVictory();
                this.fillEndStats('vic');
                this.renderPerformanceChart('vic');
                this.renderNerdStats('vic');
                this.saveRoundToHistory();
                
                // Inicializa foco do controle na Vitória
                this.vicIndex = 0;
                this.updateVictoryGamepadFocus();
                break;
        }
    }

    // Trata conexões
    handleGamepadConnected(gp) {
        this.dom.gamepadStatusCard.classList.remove('disconnected');
        this.dom.gamepadStatusCard.classList.add('connected');
        this.dom.gamepadStatusText.textContent = "CONECTADO";
        this.dom.gamepadName.textContent = gp.id.replace(/\(Standard Gamepad.*?\)/, '').trim();
        this.checkHapticSupport();
        
        // Vibração sutil indicando pareamento
        inputs.vibrate(150, 0.4, 0.4);
    }

    handleGamepadDisconnected() {
        this.dom.gamepadStatusCard.classList.remove('connected');
        this.dom.gamepadStatusCard.classList.add('disconnected');
        this.dom.gamepadStatusText.textContent = "DESCONECTADO";
        this.dom.gamepadName.textContent = "Aperte qualquer botão no controle para conectar";
        if (this.dom.hapticSupport) {
            this.dom.hapticSupport.textContent = "Suporte: Sem controle conectado";
            this.dom.hapticSupport.className = "haptic-support-label";
        }
    }

    checkHapticSupport() {
        if (!this.dom.hapticSupport) return;
        
        if (inputs.isConnected && inputs.gamepadIndex !== null) {
            const gp = navigator.getGamepads()[inputs.gamepadIndex];
            if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                this.dom.hapticSupport.textContent = "Suporte: Totalmente compatível!";
                this.dom.hapticSupport.className = "haptic-support-label supported";
            } else {
                this.dom.hapticSupport.textContent = "Suporte: Não suportado por este controle/navegador";
                this.dom.hapticSupport.className = "haptic-support-label unsupported";
            }
        } else {
            this.dom.hapticSupport.textContent = "Suporte: Conecte o controle para testar";
            this.dom.hapticSupport.className = "haptic-support-label";
        }
    }

    selectMode(selected) {
        this.mode = selected;
        document.getElementById('mode-normal').classList.remove('active');
        document.getElementById('mode-hardcore').classList.remove('active');
        document.getElementById(`mode-${selected}`).classList.add('active');
        sfx.playHit();
    }

    selectDifficulty(selected) {
        this.difficulty = selected;
        ['easy', 'medium', 'hard', 'insane'].forEach(diff => {
            document.getElementById(`diff-${diff}`).classList.remove('active');
        });
        document.getElementById(`diff-${selected}`).classList.add('active');
        sfx.playHit();
    }

    // Inicializa a partida do QTE
    startGame() {
        sfx.init(); // Garante o AudioContext ativo
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentEventIndex = 0;
        this.totalHits = 0;
        this.totalAttempts = 0;
        this.reactionTimes = [];
        
        // Registros para gráficos e APM
        this.roundEvents = [];
        this.roundStartTime = performance.now();
        
        // Define vidas com base no modo
        if (this.mode === 'hardcore') {
            this.lives = 1;
            this.dom.hudLivesBox.classList.add('hidden');
        } else {
            this.lives = 3;
            this.dom.hudLivesBox.classList.remove('hidden');
            this.updateLivesHUD();
        }

        this.updateScoreHUD();
        this.updateComboHUD();
        this.updateProgressBar();

        this.switchState('PLAYING');

        // Reseta estados de Pausa e Countdown
        this.isPaused = false;
        this.dom.pauseModal.classList.add('hidden');

        // Inicia a contagem regressiva interativa
        this.startCountdown();
    }

    // Preenche as estatísticas finais (Vitória ou Game Over)
    fillEndStats(screenPrefix) {
        const accuracy = this.totalAttempts > 0 ? Math.round((this.totalHits / this.totalAttempts) * 100) : 0;
        
        // Média de reação
        const avgReaction = this.reactionTimes.length > 0
            ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;

        document.getElementById(`${screenPrefix}-score`).textContent = this.score.toString().padStart(5, '0');
        document.getElementById(`${screenPrefix}-combo`).textContent = `x${this.maxCombo}`;
        document.getElementById(`${screenPrefix}-accuracy`).textContent = `${accuracy}%`;
        document.getElementById(`${screenPrefix}-reaction`).textContent = avgReaction > 0 ? `${avgReaction}ms` : '---';

        // Detalhe de falha no Game Over
        if (screenPrefix === 'go') {
            if (this.mode === 'hardcore') {
                this.dom.goMessage.innerHTML = `<i class="fa-solid fa-skull"></i> <strong>Modo Morte Súbita:</strong> Um único erro encerra a corrida. Tente novamente para superar seus limites de tempo!`;
            } else {
                this.dom.goMessage.innerHTML = `<i class="fa-solid fa-heart-crack"></i> <strong>Modo Treino:</strong> Suas vidas se esgotaram. Continue praticando para dominar os botões!`;
            }
        }
    }

    // ==========================================
    // LOOP PRINCIPAL (CORE UPDATE LOOP)
    // ==========================================

    gameLoop(timestamp) {
        // Calcula delta time
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const dt = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // 1. Atualiza as leituras físicas do controle e do teclado
        inputs.update();

        // 2. Comportamento dinâmico baseado na Tela Ativa
        if (this.state === 'MENU') {
            this.updateMenuGamepadNavigation();
        } else if (this.state === 'PLAYGROUND') {
            this.updatePlaygroundVisuals();
        } else if (this.state === 'PLAYING') {
            if (this.isPaused) {
                this.updatePauseGamepadNavigation();
            } else {
                this.updatePauseCheck();
                if (!this.isCountingDown) {
                    this.updateGameplay(dt);
                }
            }
        } else if (this.state === 'GAMEOVER') {
            this.updateGameOverGamepadNavigation();
        } else if (this.state === 'VICTORY') {
            this.updateVictoryGamepadNavigation();
        }

        // Loop contínuo
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    // ==========================================
    // PARTE 1: DIAGNÓSTICO DO PLAYGROUND (VISUAL CONTROLLER)
    // ==========================================

    updatePlaygroundVisuals() {
        // Atualiza textos técnicos de coordenadas analógicas
        this.dom.diagLSX.textContent = inputs.inputs.LS_X.toFixed(2);
        this.dom.diagLSY.textContent = inputs.inputs.LS_Y.toFixed(2);
        this.dom.diagRSX.textContent = inputs.inputs.RS_X.toFixed(2);
        this.dom.diagRSY.textContent = inputs.inputs.RS_Y.toFixed(2);

        // Move a bolinha nos visualizadores dinâmicos 2D de coordenadas
        // Mapeia coordenadas (-1 a 1) para pixels (limite de 40px no CSS)
        this.dom.dotLS.style.transform = `translate(${inputs.inputs.LS_X * 34}px, ${inputs.inputs.LS_Y * 34}px)`;
        this.dom.dotRS.style.transform = `translate(${inputs.inputs.RS_X * 34}px, ${inputs.inputs.RS_Y * 34}px)`;

        // Ilumina botões simples pressionados no diagrama visual do controle Xbox
        this.playgroundKeys.forEach(key => {
            const btnEl = document.getElementById(`visual-btn-${key}`);
            if (!btnEl) return;

            if (inputs.isInputActive(key)) {
                btnEl.classList.add('pressed');
                // Adiciona valores específicos no caso dos gatilhos analógicos
                if (key === 'LT') document.getElementById('val-LT').textContent = `${Math.round(inputs.inputs.LT_Val * 100)}%`;
                if (key === 'RT') document.getElementById('val-RT').textContent = `${Math.round(inputs.inputs.RT_Val * 100)}%`;
            } else {
                btnEl.classList.remove('pressed');
                if (key === 'LT') document.getElementById('val-LT').textContent = `0%`;
                if (key === 'RT') document.getElementById('val-RT').textContent = `0%`;
            }
        });

        // Simula D-pad visual (trata e ilumina cada seta individualmente)
        const dpadMap = { DUp: 'DUp', DDown: 'DDown', DLeft: 'DLeft', DRight: 'DRight' };
        for (let key in dpadMap) {
            const dpadEl = document.getElementById(`visual-btn-${key}`);
            if (dpadEl) {
                if (inputs.isInputActive(key)) dpadEl.classList.add('pressed');
                else dpadEl.classList.remove('pressed');
            }
        }

        // Anima analógicos físicos no controle 2D
        // Move o Knob cinza do diagrama Xbox visual baseado nos eixos (máx 8px)
        const visualKnobLS = document.getElementById('knob-LS');
        const visualKnobRS = document.getElementById('knob-RS');
        
        if (visualKnobLS) {
            visualKnobLS.style.transform = `translate(${inputs.inputs.LS_X * 8}px, ${inputs.inputs.LS_Y * 8}px)`;
            const stickLSEl = document.getElementById('visual-stick-LS');
            if (inputs.inputs.LSPress) stickLSEl.classList.add('pressed');
            else stickLSEl.classList.remove('pressed');
        }
        if (visualKnobRS) {
            visualKnobRS.style.transform = `translate(${inputs.inputs.RS_X * 8}px, ${inputs.inputs.RS_Y * 8}px)`;
            const stickRSEl = document.getElementById('visual-stick-RS');
            if (inputs.inputs.RSPress) stickRSEl.classList.add('pressed');
            else stickRSEl.classList.remove('pressed');
        }
    }

    // ==========================================
    // PARTE 2: MECÂNICA DE GAMEPLAY E QTE ENGINE
    // ==========================================

    updateGameplay(dt) {
        if (!this.activeQTE) return;

        // Decrementa timer
        this.activeQTETimeRemaining -= dt;
        if (this.activeQTETimeRemaining < 0) this.activeQTETimeRemaining = 0;

        // Calcula porcentagem restante para animar o timer circular externo (SVG stroke-dashoffset)
        // O comprimento total do círculo SVG r=50 é ~314.16
        const percentRemaining = this.activeQTETimeRemaining / this.activeQTEDuration;
        const strokeOffset = 314.16 - (percentRemaining * 314.16);
        this.dom.qteTimerIndicator.style.strokeDashoffset = strokeOffset;

        // Atualiza cores do timer com base na urgência
        if (percentRemaining > 0.5) {
            this.dom.qteTimerIndicator.className.baseVal = "timer-fill";
        } else if (percentRemaining > 0.25) {
            this.dom.qteTimerIndicator.className.baseVal = "timer-fill warning";
        } else {
            this.dom.qteTimerIndicator.className.baseVal = "timer-fill danger";
        }

        // Verifica falha por tempo esgotado
        if (this.activeQTETimeRemaining <= 0) {
            this.handleQTEFailed("TEMPO ESGOTADO!");
            return;
        }

        // Processa as interações específicas de cada categoria de QTE
        switch (this.activeQTE.type) {
            case 'PRESS':
                this.processPressQTE();
                break;
            case 'HOLD':
                this.processHoldQTE(dt);
                break;
            case 'MASH':
                this.processMashQTE();
                break;
            case 'FLICK':
                this.processFlickQTE();
                break;
            case 'DOUBLE':
                this.processDoubleQTE();
                break;
        }
    }

    // Geração de um novo QTE aleatório
    spawnNextQTE() {
        if (this.state !== 'PLAYING') return;

        this.currentEventIndex++;
        
        // Verifica se a fase acabou (Vitória!)
        if (this.currentEventIndex > this.totalEventsInLevel) {
            this.switchState('VICTORY');
            return;
        }

        this.updateProgressBar();

        // 1. Escolhe um tipo de evento
        // Tipos: PRESS (50%), FLICK (20%), HOLD (10%), MASH (10%), DOUBLE (10%)
        const roll = Math.random();
        let type = 'PRESS';
        if (roll > 0.9) type = 'DOUBLE';
        else if (roll > 0.8) type = 'MASH';
        else if (roll > 0.7) type = 'HOLD';
        else if (roll > 0.5) type = 'FLICK';

        // 2. Escolhe o alvo de entrada
        const buttons = ['A', 'B', 'X', 'Y'];
        const bumpersAndTriggers = ['LB', 'RB', 'LT', 'RT'];
        const lsDirections = ['LS_Up', 'LS_Down', 'LS_Left', 'LS_Right'];
        const rsDirections = ['RS_Up', 'RS_Down', 'RS_Left', 'RS_Right'];
        
        let target = 'A';
        let promptLabel = 'A';

        if (type === 'DOUBLE') {
            // Escolhe uma combinação de dois botões simultâneos
            const doubles = [
                { targets: ['LT', 'RT'], labels: ['LT', 'RT'] },
                { targets: ['LB', 'RB'], labels: ['LB', 'RB'] },
                { targets: ['A', 'X'], labels: ['A', 'X'] },
                { targets: ['Y', 'B'], labels: ['Y', 'B'] }
            ];
            const choice = doubles[Math.floor(Math.random() * doubles.length)];
            target = choice.targets;
            promptLabel = choice.labels;
        } else if (type === 'PRESS' || type === 'HOLD' || type === 'MASH') {
            // Escolhe entre botões padrão ou triggers
            const randRoll = Math.random();
            if (randRoll > 0.3) {
                target = buttons[Math.floor(Math.random() * buttons.length)];
                promptLabel = target;
            } else {
                target = bumpersAndTriggers[Math.floor(Math.random() * bumpersAndTriggers.length)];
                promptLabel = target;
            }
        } else if (type === 'FLICK') {
            // Escolhe stick esquerdo ou direito e direção
            if (Math.random() > 0.5) {
                target = lsDirections[Math.floor(Math.random() * lsDirections.length)];
                // Converte chave interna para prompt visual
                const dir = target.split('_')[1];
                promptLabel = `LS <i class="fa-solid fa-arrow-${this.getArrowIconName(dir)}"></i>`;
            } else {
                target = rsDirections[Math.floor(Math.random() * rsDirections.length)];
                const dir = target.split('_')[1];
                promptLabel = `RS <i class="fa-solid fa-arrow-${this.getArrowIconName(dir)}"></i>`;
            }
        }

        // 3. Determina o tempo limite (Aceleração progressiva)
        // Quanto mais perto do fim da fase (evento 30), mais rápido fica!
        const params = this.difficultyParams[this.difficulty];
        
        // Reduz o tempo disponível de acordo com a progressão da fase
        const progressFactor = (this.currentEventIndex - 1) / this.totalEventsInLevel;
        const currentBaseTime = params.baseDuration - (progressFactor * (params.baseDuration - params.minDuration));
        
        // Tempo final adaptado da partida
        this.activeQTEDuration = Math.max(currentBaseTime, params.minDuration);
        this.activeQTETimeRemaining = this.activeQTEDuration;

        // Monta o objeto do evento ativo
        this.activeQTE = {
            type: type,
            target: target,
            label: promptLabel,
            createdTime: performance.now(),
            mashTargetCount: params.mashTarget,
            holdTargetTime: params.holdTarget
        };

        // Reseta acumuladores
        this.mashProgress = 0;
        this.holdProgress = 0;

        // 4. Injeta dados e classes no HTML
        this.renderQTEPrompt();

        // Vibração levíssima na geração para feedback sensorial
        inputs.vibrate(50, 0.2, 0.2);
    }

    getArrowIconName(direction) {
        switch(direction) {
            case 'Up': return 'up-long';
            case 'Down': return 'down-long';
            case 'Left': return 'left-long';
            case 'Right': return 'right-long';
        }
        return 'up-long';
    }

    // Renderiza graficamente o prompt do QTE ativo
    renderQTEPrompt() {
        this.dom.qteContainer.className = "qte-container";
        this.dom.qteContainer.classList.add(`state-${this.activeQTE.type.toLowerCase()}`);

        this.dom.qtePrompt.className = "qte-prompt"; // Limpa classes antigas
        this.dom.qtePrompt.classList.add(`qte-${this.activeQTE.type.toLowerCase()}`);
        
        if (this.activeQTE.type === 'DOUBLE') {
            // Renderiza o visual de dois botões simultâneos
            const btn1 = this.activeQTE.target[0];
            const btn2 = this.activeQTE.target[1];
            
            // CONVERTE OS BOTÕES PARA O LAYOUT SELECIONADO
            const label1 = this.getButtonDisplayLabel(btn1);
            const label2 = this.getButtonDisplayLabel(btn2);
            
            this.dom.qtePrompt.querySelector('.prompt-core').innerHTML = `
                <div class="prompt-double">
                    <div class="prompt-btn-small btn-${btn1}">${label1}</div>
                    <div class="prompt-plus">+</div>
                    <div class="prompt-btn-small btn-${btn2}">${label2}</div>
                </div>
            `;
        } else {
            // Adiciona classe de cor do Xbox dependendo do alvo
            if (['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT'].includes(this.activeQTE.target)) {
                this.dom.qtePrompt.classList.add(`prompt-${this.activeQTE.target}`);
            } else {
                // LS ou RS
                const stick = this.activeQTE.target.substring(0, 2);
                this.dom.qtePrompt.classList.add(`prompt-${stick}`);
            }

            // Aplica o símbolo principal no centro
            // CONVERTE O ALVO DE ACÇÃO PARA O LAYOUT SELECIONADO
            let visualLabel = this.activeQTE.label;
            if (this.activeQTE.type !== 'FLICK') {
                visualLabel = this.getButtonDisplayLabel(this.activeQTE.target);
            } else {
                // Flick contém HTML de seta, vamos gerar dinamicamente
                const parts = this.activeQTE.target.split('_');
                const stickName = this.getButtonDisplayLabel(parts[0]); // L3 ou LS
                const dir = parts[1];
                visualLabel = `${stickName} <i class="fa-solid fa-arrow-${this.getArrowIconName(dir)}"></i>`;
            }
            this.dom.qtePrompt.querySelector('.prompt-core').innerHTML = visualLabel;
        }

        // Configura banners adicionais de tipos avançados
        this.dom.actionBanner.classList.add('hidden');
        this.dom.mashCounter.classList.add('hidden');

        if (this.activeQTE.type === 'HOLD') {
            this.dom.actionBanner.innerHTML = '<i class="fa-solid fa-fingerprint"></i> SEGURE!';
            this.dom.actionBanner.className = "action-banner hold-banner";
            this.dom.actionBanner.classList.remove('hidden');
        } else if (this.activeQTE.type === 'MASH') {
            this.dom.actionBanner.innerHTML = '<i class="fa-solid fa-bolt"></i> ESMAGUE!';
            this.dom.actionBanner.className = "action-banner mash-banner";
            this.dom.actionBanner.classList.remove('hidden');
            
            this.dom.mashCounter.textContent = `0 / ${this.activeQTE.mashTargetCount}`;
            this.dom.mashCounter.classList.remove('hidden');
        }

        // Animação de entrada do container de QTE
        this.dom.qteContainer.style.transform = 'scale(0.85)';
        this.dom.qteContainer.style.opacity = '0';
        setTimeout(() => {
            this.dom.qteContainer.style.transition = 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            this.dom.qteContainer.style.transform = 'scale(1)';
            this.dom.qteContainer.style.opacity = '1';
        }, 10);
    }

    // ==========================================
    // MECÂNICAS INDIVIDUAIS DE INPUT
    // ==========================================

    // 1. Pressionar único (Press)
    processPressQTE() {
        const target = this.activeQTE.target;

        // Se o usuário apertar o botão correto neste frame
        if (inputs.isInputDown(target)) {
            this.handleQTESuccess();
            return;
        }

        // Anticheat: Se apertar QUALQUER OUTRO botão que não seja o correto, é falha imediata!
        this.detectCheatingOrWrongButtons(target);
    }

    // 2. Flick analógico (Flick)
    processFlickQTE() {
        const target = this.activeQTE.target;

        if (inputs.isInputDown(target)) {
            this.handleQTESuccess();
            return;
        }

        // Anticheat nos direcionais
        this.detectCheatingOrWrongButtons(target);
    }

    // 3. Esmagar botão repetidamente (Mash)
    processMashQTE() {
        const target = this.activeQTE.target;

        // Conta cliques válidos deste frame
        if (inputs.isInputDown(target)) {
            this.mashProgress++;
            inputs.vibrate(60, 0.3, 0.3);
            sfx.playComboUp(this.mashProgress); // som de blip estimulante
            
            this.dom.mashCounter.textContent = `${this.mashProgress} / ${this.activeQTE.mashTargetCount}`;

            // Cria onda de choque visual expansiva de energia
            const shock = document.createElement('div');
            shock.className = 'mash-shockwave';
            this.dom.qteContainer.appendChild(shock);
            setTimeout(() => shock.remove(), 350);

            // Efeito visual sutil de pulsação rápida em cada clique do mash
            this.dom.qtePrompt.style.transform = 'scale(0.92)';
            setTimeout(() => { this.dom.qtePrompt.style.transform = 'scale(1)'; }, 60);

            if (this.mashProgress >= this.activeQTE.mashTargetCount) {
                this.handleQTESuccess();
            }
        }
    }

    // 4. Segurar botão por tempo determinado (Hold)
    processHoldQTE(dt) {
        const target = this.activeQTE.target;

        if (inputs.isInputActive(target)) {
            this.holdProgress += dt;
            
            // Ativa visual de tremor de energia
            this.dom.qtePrompt.classList.add('holding');

            // Vibração constante e sutil enquanto segura
            inputs.vibrate(30, 0.15, 0.15);

            // Animação visual interna de carregamento
            const pct = Math.min(this.holdProgress / this.activeQTE.holdTargetTime, 1.0);
            
            // Pintamos o fundo do círculo interno simulando enchimento
            // Usamos gradações de opacidade para simular o loading
            this.dom.qtePrompt.querySelector('.prompt-core').style.background = 
                `radial-gradient(circle, rgba(0, 120, 212, 0.4) ${pct * 100}%, #1c1d24 ${pct * 100}%)`;

            if (this.holdProgress >= this.activeQTE.holdTargetTime) {
                // Reseta estilo de fundo ao concluir
                this.dom.qtePrompt.classList.remove('holding');
                this.dom.qtePrompt.querySelector('.prompt-core').style.background = '';
                this.handleQTESuccess();
            }
        } else {
            this.dom.qtePrompt.classList.remove('holding');
            // Se o usuário soltar o botão antes do tempo acabar
            if (this.holdProgress > 0) {
                // Perde o progresso acumulado caso solte (punção leve, mas o tempo global continua correndo!)
                this.holdProgress = 0;
                this.dom.qtePrompt.querySelector('.prompt-core').style.background = '';
            }
        }
    }

    // 5. Combinação simultânea de dois botões (Double Press)
    processDoubleQTE() {
        const t1 = this.activeQTE.target[0];
        const t2 = this.activeQTE.target[1];
        
        const active1 = inputs.isInputActive(t1);
        const active2 = inputs.isInputActive(t2);
        const down1 = inputs.isInputDown(t1);
        const down2 = inputs.isInputDown(t2);

        // Se ambos os botões estão ativos no controle/teclado e pelo menos um acabou de ser pressionado
        if (active1 && active2 && (down1 || down2)) {
            this.handleQTESuccess();
            return;
        }

        // Anticheat para QTE duplo: se apertar qualquer outro botão que não pertença à combinação
        const allButtons = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'LS_Up', 'LS_Down', 'LS_Left', 'LS_Right', 'RS_Up', 'RS_Down', 'RS_Left', 'RS_Right'];
        for (let btn of allButtons) {
            if (!this.activeQTE.target.includes(btn) && inputs.isInputDown(btn)) {
                this.handleQTEFailed("BOTÃO INCORRETO!");
                return;
            }
        }
    }

    // Função de auxílio contra botões errados / spam de botões para vencer
    detectCheatingOrWrongButtons(correctTarget) {
        const allButtons = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'LS_Up', 'LS_Down', 'LS_Left', 'LS_Right', 'RS_Up', 'RS_Down', 'RS_Left', 'RS_Right'];
        
        for (let btn of allButtons) {
            if (btn !== correctTarget && inputs.isInputDown(btn)) {
                // Errou! Pressionou um botão incorreto
                this.handleQTEFailed("BOTÃO INCORRETO!");
                break;
            }
        }
    }

    // ==========================================
    // PARTE 3: FEEDBACKS E ATUALIZAÇÃO DO PLACAR
    // ==========================================

    handleQTESuccess() {
        const reactionTime = Math.round(performance.now() - this.activeQTE.createdTime);
        this.reactionTimes.push(reactionTime);
        this.totalHits++;
        this.totalAttempts++;

        // 1. Gradação do Feedback baseado no tempo de resposta (Precisão rítmica!)
        const ratio = (this.activeQTEDuration - this.activeQTETimeRemaining) / this.activeQTEDuration;
        let grade = 'OK';
        let scoreReward = 100;
        let visualClass = 'ok';

        if (ratio < 0.22) { // 22% do tempo inicial
            grade = 'PERFEITO!';
            scoreReward = 250;
            visualClass = 'perfect';
            sfx.playPerfectHit();
            this.triggerScreenFlash('green');
        } else if (ratio < 0.55) {
            grade = 'EXCELENTE!';
            scoreReward = 180;
            visualClass = 'good';
            sfx.playHit();
        } else if (ratio < 0.85) {
            grade = 'BOM!';
            scoreReward = 120;
            visualClass = 'ok';
            sfx.playHit();
        } else {
            grade = 'LENTO!';
            scoreReward = 75;
            visualClass = 'ok';
            sfx.playHit();
        }

        // Registra evento no histórico do round
        this.roundEvents.push({
            index: this.currentEventIndex,
            type: this.activeQTE.type,
            target: this.activeQTE.target,
            limit: this.activeQTEDuration,
            reaction: reactionTime,
            result: 'SUCCESS',
            grade: grade
        });

        // Multiplicador de Combo
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        
        const currentMultiplier = this.getComboMultiplier();
        const finalScore = scoreReward * currentMultiplier;
        
        this.score += finalScore;

        // Feedback de Áudio de Combo
        if (this.combo > 0 && this.combo % 5 === 0) {
            sfx.playComboUp(Math.min(currentMultiplier * 2, 8));
        }

        // 2. Dispara feedback flutuante na tela
        this.triggerFeedbackText(grade, visualClass);

        // 3. Atualiza HUD
        this.updateScoreHUD();
        this.updateComboHUD();

        // 4. Limpa QTE
        this.clearActiveQTE();

        // 5. Próximo QTE
        setTimeout(() => this.spawnNextQTE(), 450);
    }

    handleQTEFailed(failReason) {
        this.totalAttempts++;
        this.combo = 0; // Reseta combo

        // Registra falha no histórico do round
        this.roundEvents.push({
            index: this.currentEventIndex,
            type: this.activeQTE.type,
            target: this.activeQTE.target,
            limit: this.activeQTEDuration,
            reaction: this.activeQTEDuration, // Conta como limite estourado no gráfico
            result: 'FAILED',
            reason: failReason
        });

        // Som de falha
        sfx.playMiss();
        
        // Efeito de choque / vibração forte no controle Xbox
        inputs.vibrate(350, 0.9, 0.9);

        // Flash vermelho dramático na tela
        this.triggerScreenFlash('red');

        // Texto flutuante grave
        this.triggerFeedbackText(failReason, 'miss');

        // Deduz vidas ou encerra
        this.lives--;
        
        if (this.mode === 'hardcore' || this.lives <= 0) {
            this.clearActiveQTE();
            setTimeout(() => this.switchState('GAMEOVER'), 600);
        } else {
            this.updateLivesHUD();
            this.updateComboHUD();
            this.clearActiveQTE();
            
            // Continua a fase mesmo com o erro
            setTimeout(() => this.spawnNextQTE(), 900);
        }
    }

    clearActiveQTE() {
        this.activeQTE = null;
        this.dom.qteContainer.style.transform = 'scale(0.85)';
        this.dom.qteContainer.style.opacity = '0';
        
        // Limpa classes e estilos especiais de melhorias
        this.dom.qtePrompt.classList.remove('holding');
        this.dom.qtePrompt.querySelector('.prompt-core').style.background = '';
    }

    getComboMultiplier() {
        if (this.combo >= 20) return 4;
        if (this.combo >= 10) return 3;
        if (this.combo >= 5) return 2;
        return 1;
    }

    // ==========================================
    // UTILS E FEEDBACKS VISUAIS
    // ==========================================

    updateScoreHUD() {
        this.dom.hudScore.textContent = this.score.toString().padStart(5, '0');
    }

    updateComboHUD() {
        const mult = this.getComboMultiplier();
        this.dom.hudCombo.textContent = `x${mult}`;
        
        // Estiliza de acordo com o multiplicador
        if (mult >= 3) {
            this.dom.hudComboBox.className = "hud-item combo-container glass-panel super-combo";
        } else {
            this.dom.hudComboBox.className = "hud-item combo-container glass-panel";
        }

        // Calcula preenchimento do anel circular de combo (reseta a cada 5 hits para evoluir multiplier)
        let percent = 0;
        if (this.combo < 5) percent = (this.combo / 5) * 100;
        else if (this.combo < 10) percent = ((this.combo - 5) / 5) * 100;
        else if (this.combo < 20) percent = ((this.combo - 10) / 10) * 100;
        else percent = 100;

        // Stroke-dasharray do anel circular (comprimento ~100)
        this.dom.hudComboRingFill.setAttribute('stroke-dasharray', `${percent}, 100`);
    }

    updateLivesHUD() {
        let html = '';
        for (let i = 0; i < this.maxLives; i++) {
            if (i < this.lives) {
                html += `<i class="fa-solid fa-heart active"></i>`;
            } else {
                html += `<i class="fa-regular fa-heart"></i>`;
            }
        }
        this.dom.hudLivesDisplay.innerHTML = html;
    }

    updateProgressBar() {
        const percentage = (this.currentEventIndex - 1) / this.totalEventsInLevel;
        this.dom.hudProgressBar.style.width = `${Math.min(percentage * 100, 100)}%`;
        
        // Exibe contador textual "12 / 30"
        const cleanCount = Math.min(this.currentEventIndex, this.totalEventsInLevel);
        this.dom.hudProgressRatio.textContent = `${cleanCount} / ${this.totalEventsInLevel}`;
    }

    triggerFeedbackText(text, gradeClass) {
        // Clone para reiniciar animação CSS sem bugs
        const el = this.dom.feedbackText;
        el.className = `feedback-text ${gradeClass}`;
        el.textContent = text;
        
        // Força reflow do navegador
        void el.offsetWidth;
    }

    triggerScreenFlash(color) {
        const flashEl = this.dom.screenFlash;
        flashEl.className = `screen-flash ${color}-flash`;
        
        void flashEl.offsetWidth;
    }

    // ==========================================
    // MELHORIAS ADICIONAIS: TEMA, DADOS E ANÁLISES
    // ==========================================

    // Helper para ler dados locais com segurança (evita falhas de segurança do file:// no localStorage)
    safeGetLocal(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("LocalStorage não disponível. Usando memória temporária.");
            return null;
        }
    }

    safeSetLocal(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn("LocalStorage não disponível para escrita.");
            return false;
        }
    }

    safeRemoveLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn("LocalStorage não disponível para remoção.");
            return false;
        }
    }

    // Inicializa o tema preferido e o banner de consentimento
    initThemeAndConsent() {
        // Tema Claro / Escuro
        const savedTheme = this.safeGetLocal('qte_theme') || 'dark';
        this.setTheme(savedTheme);

        // Layout do Controle
        const savedLayout = this.safeGetLocal('qte_layout') || 'xbox';
        this.selectLayout(savedLayout);

        // Consentimento de Dados
        const consent = this.safeGetLocal('qte_consent');
        if (consent === 'true') {
            this.isDataConsentGiven = true;
            this.loadHistoryFromStorage();
        } else if (consent === 'false') {
            this.isDataConsentGiven = false;
        } else {
            // Se for o primeiro acesso, exibe o banner de consentimento
            this.dom.consentBanner.classList.remove('hidden');
        }
    }

    setTheme(themeName) {
        this.theme = themeName;
        const iconEl = this.dom.themeToggleBtn.querySelector('i');
        
        if (themeName === 'light') {
            document.body.classList.add('light-mode');
            iconEl.className = 'fa-solid fa-sun';
        } else {
            document.body.classList.remove('light-mode');
            iconEl.className = 'fa-solid fa-moon';
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        sfx.playHit();

        if (this.isDataConsentGiven) {
            this.safeSetLocal('qte_theme', newTheme);
        }
    }

    handleConsentResponse(accepted) {
        this.dom.consentBanner.classList.add('hidden');
        this.isDataConsentGiven = accepted;
        this.safeSetLocal('qte_consent', accepted ? 'true' : 'false');
        
        if (accepted) {
            this.safeSetLocal('qte_theme', this.theme);
            this.safeSetLocal('qte_layout', this.layout);
            this.loadHistoryFromStorage();
        } else {
            this.clearAllData(true); // Apenas apaga localmente sem recarregar tela
        }
        sfx.playHit();
    }

    loadHistoryFromStorage() {
        if (!this.isDataConsentGiven) return;
        try {
            const raw = this.safeGetLocal('qte_history');
            this.history = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Erro ao carregar histórico:", e);
            this.history = [];
        }
    }

    saveRoundToHistory() {
        if (!this.isDataConsentGiven) return;
        
        const roundAccuracy = this.totalAttempts > 0 ? Math.round((this.totalHits / this.totalAttempts) * 100) : 0;
        const roundAvgReaction = this.reactionTimes.length > 0
            ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;

        const roundLog = {
            date: new Date().toISOString().split('T')[0],
            score: this.score,
            maxCombo: this.maxCombo,
            accuracy: roundAccuracy,
            avgReaction: roundAvgReaction,
            difficulty: this.difficulty,
            mode: this.mode
        };

        this.history.push(roundLog);
        
        try {
            this.safeSetLocal('qte_history', JSON.stringify(this.history));
        } catch (e) {
            console.error("Erro ao salvar histórico:", e);
        }
    }

    exportData() {
        sfx.playHit();
        const dataStr = JSON.stringify({
            history: this.history,
            theme: this.theme,
            consent: this.isDataConsentGiven
        }, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `qte_hero_history_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                
                if (parsed.history && Array.isArray(parsed.history)) {
                    this.history = parsed.history;
                    
                    if (this.isDataConsentGiven) {
                        this.safeSetLocal('qte_history', JSON.stringify(this.history));
                    }
                    
                    alert("Estatísticas importadas com sucesso! Histórico mesclado.");
                    sfx.playVictory();
                } else {
                    alert("Formato de arquivo JSON inválido.");
                    sfx.playMiss();
                }
            } catch (err) {
                alert("Erro ao ler o arquivo JSON.");
                sfx.playMiss();
            }
        };
        reader.readAsText(file);
    }

    clearAllData(silent = false) {
        if (!silent) {
            sfx.playMiss();
            if (!confirm("Tem certeza que deseja apagar todo o histórico de treinos e recordes pessoais? Esta ação é irreversível.")) {
                return;
            }
        }

        this.history = [];
        this.safeRemoveLocal('qte_history');
        this.safeRemoveLocal('qte_theme');
        this.safeRemoveLocal('qte_consent');
        
        if (!silent) {
            alert("Todo o histórico local foi apagado com sucesso.");
            this.dom.consentBanner.classList.remove('hidden');
            this.isDataConsentGiven = false;
        }
    }

    // ==========================================
    // GERAÇÃO DINÂMICA DE GRÁFICOS E METRICAS NERD
    // ==========================================

    renderPerformanceChart(screenPrefix) {
        const svg = document.getElementById(`${screenPrefix}-reaction-chart`);
        if (!svg) return;

        // Limpa o SVG
        svg.innerHTML = '';

        const data = this.roundEvents;
        if (data.length === 0) return;

        // Dimensões úteis do Gráfico
        const width = 600;
        const height = 240;
        const paddingLeft = 45;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Eixo Y: Tempo máximo de escala (3000ms ou o máximo da dificuldade)
        const maxTime = 3000;

        // Cria as Grid Lines e rótulos do eixo Y (a cada 500ms)
        for (let time = 500; time <= maxTime; time += 500) {
            const y = paddingTop + (1 - time / maxTime) * chartHeight;
            
            // Grid Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', paddingLeft);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - paddingRight);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'chart-grid-line');
            svg.appendChild(line);

            // Rótulo de texto do Eixo Y
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', paddingLeft - 8);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'chart-text');
            text.textContent = `${time}ms`;
            svg.appendChild(text);
        }

        // Desenha Rótulos do Eixo X (a cada 5 eventos)
        for (let i = 0; i < data.length; i += 5) {
            const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height - paddingBottom + 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'chart-text');
            text.textContent = `#${data[i].index}`;
            svg.appendChild(text);
        }

        // Desenha Rótulo final do Eixo X
        if ((data.length - 1) % 5 !== 0) {
            const x = paddingLeft + chartWidth;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height - paddingBottom + 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'chart-text');
            text.textContent = `#${data[data.length - 1].index}`;
            svg.appendChild(text);
        }

        // Desenha Eixo X e Y (Bordas)
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', paddingLeft);
        xAxis.setAttribute('y1', height - paddingBottom);
        xAxis.setAttribute('x2', width - paddingRight);
        xAxis.setAttribute('y2', height - paddingBottom);
        xAxis.setAttribute('class', 'chart-axis');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', paddingLeft);
        yAxis.setAttribute('y1', paddingTop);
        yAxis.setAttribute('x2', paddingLeft);
        yAxis.setAttribute('y2', height - paddingBottom);
        yAxis.setAttribute('class', 'chart-axis');
        svg.appendChild(yAxis);

        // Constrói caminhos das linhas (Limit e Reaction)
        let limitPoints = [];
        let reactionPoints = [];

        data.forEach((evt, idx) => {
            const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
            const yLimit = paddingTop + (1 - evt.limit / maxTime) * chartHeight;
            limitPoints.push(`${x},${yLimit}`);

            if (evt.result === 'SUCCESS') {
                const yReact = paddingTop + (1 - evt.reaction / maxTime) * chartHeight;
                reactionPoints.push(`${x},${yReact}`);
            }
        });

        // Plota Linha de Limites
        const limitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        limitPath.setAttribute('d', `M ${limitPoints.join(' L ')}`);
        limitPath.setAttribute('class', 'chart-line-limit');
        svg.appendChild(limitPath);

        // Plota Linha de Reação Real (Apenas conecta pontos de sucessos consecutivos)
        // Se houver sucessos, desenhamos a linha conectando eles
        if (reactionPoints.length > 0) {
            let dString = '';
            let isFirst = true;

            data.forEach((evt, idx) => {
                const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
                
                if (evt.result === 'SUCCESS') {
                    const yReact = paddingTop + (1 - evt.reaction / maxTime) * chartHeight;
                    if (isFirst) {
                        dString += `M ${x},${yReact}`;
                        isFirst = false;
                    } else {
                        dString += ` L ${x},${yReact}`;
                    }
                } else {
                    // Quebra a linha se errar, para não ligar pontos pulando erros de forma artificial
                    isFirst = true;
                }
            });

            if (dString) {
                const reactPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                reactPath.setAttribute('d', dString);
                reactPath.setAttribute('class', 'chart-line-reaction');
                svg.appendChild(reactPath);
            }
        }

        // Desenha nós circulares interativos individuais para cada evento
        data.forEach((evt, idx) => {
            const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            
            circle.setAttribute('cx', x);
            
            let tooltipText = '';

            if (evt.result === 'SUCCESS') {
                const yReact = paddingTop + (1 - evt.reaction / maxTime) * chartHeight;
                circle.setAttribute('cy', yReact);
                circle.setAttribute('class', 'chart-node');
                tooltipText = `QTE #${evt.index} [${evt.type}]: ${evt.reaction}ms (Janela: ${evt.limit}ms) - Grau: ${evt.grade}`;
            } else {
                // Erros são representados no topo de forma vermelha
                const yLimit = paddingTop + (1 - evt.limit / maxTime) * chartHeight;
                circle.setAttribute('cy', yLimit);
                circle.setAttribute('class', 'chart-node miss-node');
                tooltipText = `QTE #${evt.index} [${evt.type}]: FALHA (${evt.reason}) - (Janela: ${evt.limit}ms)`;
            }

            // Dica flutuante (Nativa via tags <title> em SVG)
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = tooltipText;
            circle.appendChild(title);

            svg.appendChild(circle);
        });
    }

    renderNerdStats(screenPrefix) {
        // 1. Min / Max / Média
        const hits = this.roundEvents.filter(e => e.result === 'SUCCESS');
        const minReact = hits.length > 0 ? Math.min(...hits.map(h => h.reaction)) : 0;
        const maxReact = hits.length > 0 ? Math.max(...hits.map(h => h.reaction)) : 0;
        
        document.getElementById(`${screenPrefix}-nerd-minmax`).textContent = hits.length > 0
            ? `${minReact}ms / ${maxReact}ms`
            : `---`;

        // 2. Desvio Padrão e Consistência
        let sd = 0;
        let consistency = '---';

        if (hits.length > 1) {
            const reactions = hits.map(h => h.reaction);
            const mean = reactions.reduce((a, b) => a + b, 0) / reactions.length;
            const variance = reactions.map(r => Math.pow(r - mean, 2)).reduce((a, b) => a + b, 0) / reactions.length;
            sd = Math.round(Math.sqrt(variance));

            if (sd < 50) consistency = 'Divina';
            else if (sd < 100) consistency = 'Elite';
            else if (sd < 170) consistency = 'Regular';
            else consistency = 'Instável';
        } else if (hits.length === 1) {
            consistency = 'Dados insuficientes';
        }

        document.getElementById(`${screenPrefix}-nerd-sd`).textContent = hits.length > 1 ? `${sd}ms` : '---';
        document.getElementById(`${screenPrefix}-nerd-consistency`).textContent = consistency;

        // 3. APM (Ações por minuto)
        const roundDurationSeconds = Math.max((performance.now() - this.roundStartTime) / 1000, 1.0);
        // Nas ações contam cliques e seguradas, calculamos tentativas totais
        const apm = Math.round((this.totalAttempts * 60) / roundDurationSeconds);
        document.getElementById(`${screenPrefix}-nerd-apm`).textContent = apm;

        // 4. Acurácia detalhada por tipo de QTE
        const types = ['PRESS', 'HOLD', 'MASH', 'FLICK', 'DOUBLE'];
        let html = '';

        types.forEach(t => {
            const list = this.roundEvents.filter(e => e.type === t);
            if (list.length > 0) {
                const typeHits = list.filter(e => e.result === 'SUCCESS').length;
                const typePct = Math.round((typeHits / list.length) * 100);
                html += `<li><strong>${t}:</strong> <span>${typePct}% (${typeHits}/${list.length})</span></li>`;
            }
        });

        document.getElementById(`${screenPrefix}-nerd-types`).innerHTML = html || '<li>Sem dados.</li>';
    }

    // ==========================================
    // NOVAS FUNÇÕES: PAUSA, CONTAGEM E GAMEPAD NAV
    // ==========================================

    togglePause() {
        if (this.state !== 'PLAYING') return;

        this.isPaused = !this.isPaused;
        sfx.playHit();

        if (this.isPaused) {
            // Mostra o Modal de Pausa
            this.dom.pauseModal.classList.remove('hidden');
            this.pauseIndex = 0;
            this.updatePauseGamepadFocus();
        } else {
            // Oculta o Modal de Pausa
            this.dom.pauseModal.classList.add('hidden');
            // Limpa focos gamepad do pause
            this.pauseItems.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('gamepad-focused');
            });
            // Se estava em contagem regressiva, continua a contagem!
            if (this.isCountingDown) {
                this.runCountdownTick();
            }
        }
    }

    updatePauseCheck() {
        if (inputs.isInputDown('Menu') || inputs.isKeyPressedThisFrame('Escape')) {
            this.togglePause();
        }
    }

    startCountdown() {
        this.isCountingDown = true;
        this.countdownValue = 3;
        
        // Limpa qualquer QTE anterior do prompt
        this.dom.qtePrompt.className = "qte-prompt qte-press"; // classe base neutra
        this.dom.actionBanner.classList.add('hidden');
        this.dom.mashCounter.classList.add('hidden');
        
        // Inicia escala normal
        this.dom.qteContainer.className = "qte-container";
        this.dom.qteContainer.style.transform = 'scale(1)';
        this.dom.qteContainer.style.opacity = '1';
        
        this.runCountdownTick();
    }

    runCountdownTick() {
        if (this.state !== 'PLAYING' || this.isPaused) return;

        if (this.countdownValue > 0) {
            this.dom.qtePrompt.querySelector('.prompt-core').innerHTML = `<span class="countdown-num" style="color: #00ffff; text-shadow: 0 0 15px #00ffff; font-family: var(--font-retro); font-weight: 900; font-size: 3.5rem;">${this.countdownValue}</span>`;
            
            this.dom.actionBanner.textContent = "PREPARAR...";
            this.dom.actionBanner.className = "action-banner hold-banner";
            this.dom.actionBanner.classList.remove('hidden');
            
            sfx.playComboUp(this.countdownValue); // beep de contagem
            
            this.countdownValue--;
            
            setTimeout(() => this.runCountdownTick(), 1000);
        } else if (this.countdownValue === 0) {
            this.dom.qtePrompt.querySelector('.prompt-core').innerHTML = `<span class="countdown-num" style="color: #2ecc71; text-shadow: 0 0 15px #2ecc71; font-family: var(--font-retro); font-weight: 900; font-size: 3rem;">JÁ!</span>`;
            
            this.dom.actionBanner.textContent = "COMEÇOU!";
            this.dom.actionBanner.className = "action-banner hold-banner";
            
            sfx.playPerfectHit(); // beep final triunfante
            
            this.countdownValue--;
            
            setTimeout(() => this.runCountdownTick(), 700);
        } else {
            this.isCountingDown = false;
            this.dom.actionBanner.classList.add('hidden');
            this.spawnNextQTE();
        }
    }

    updateMenuGamepadNavigation() {
        let moved = false;

        if (inputs.isInputDown('DUp') || inputs.isInputDown('LS_Up')) {
            this.menuRow = Math.max(0, this.menuRow - 1);
            moved = true;
        } else if (inputs.isInputDown('DDown') || inputs.isInputDown('LS_Down')) {
            this.menuRow = Math.min(5, this.menuRow + 1);
            moved = true;
        }

        if (inputs.isInputDown('DLeft') || inputs.isInputDown('LS_Left')) {
            this.menuCol = Math.max(0, this.menuCol - 1);
            moved = true;
        } else if (inputs.isInputDown('DRight') || inputs.isInputDown('LS_Right')) {
            this.menuCol = Math.min(1, this.menuCol + 1);
            moved = true;
        }

        if (moved) {
            this.isMenuGamepadActive = true;
            sfx.playHit();
            this.updateMenuGamepadFocus();
        }

        // Simula click com botão A
        if (this.isMenuGamepadActive && inputs.isInputDown('A')) {
            const focusedId = this.menuGrid[this.menuRow][this.menuCol];
            const btnEl = document.getElementById(focusedId);
            if (btnEl) {
                sfx.playPerfectHit();
                btnEl.click();
            }
        }
    }

    updateMenuGamepadFocus() {
        // Limpa classes antigas
        this.menuGrid.forEach(row => {
            row.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('gamepad-focused');
            });
        });

        // Adiciona classe no item focado
        const focusedId = this.menuGrid[this.menuRow][this.menuCol];
        const focusedEl = document.getElementById(focusedId);
        if (focusedEl) {
            focusedEl.classList.add('gamepad-focused');
        }
    }

    updatePauseGamepadNavigation() {
        let moved = false;

        if (inputs.isInputDown('DUp') || inputs.isInputDown('LS_Up')) {
            this.pauseIndex = 0;
            moved = true;
        } else if (inputs.isInputDown('DDown') || inputs.isInputDown('LS_Down')) {
            this.pauseIndex = 1;
            moved = true;
        }

        if (moved) {
            sfx.playHit();
            this.updatePauseGamepadFocus();
        }

        // Permite despausar apertando Menu ou Escape de novo
        if (inputs.isInputDown('Menu') || inputs.isKeyPressedThisFrame('Escape')) {
            this.togglePause();
            return;
        }

        // Simula clique com botão A
        if (inputs.isInputDown('A')) {
            const focusedId = this.pauseItems[this.pauseIndex];
            const btnEl = document.getElementById(focusedId);
            if (btnEl) {
                btnEl.click();
            }
        }
    }

    updatePauseGamepadFocus() {
        // Limpa classes antigas
        this.pauseItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('gamepad-focused');
        });

        // Adiciona no focado
        const focusedId = this.pauseItems[this.pauseIndex];
        const focusedEl = document.getElementById(focusedId);
        if (focusedEl) {
            focusedEl.classList.add('gamepad-focused');
        }
    }

    updateGameOverGamepadNavigation() {
        let moved = false;

        if (inputs.isInputDown('DLeft') || inputs.isInputDown('LS_Left') || inputs.isInputDown('DUp') || inputs.isInputDown('LS_Up')) {
            this.goIndex = 0; // "Jogar Novamente"
            moved = true;
        } else if (inputs.isInputDown('DRight') || inputs.isInputDown('LS_Right') || inputs.isInputDown('DDown') || inputs.isInputDown('LS_Down')) {
            this.goIndex = 1; // "Voltar ao Menu"
            moved = true;
        }

        if (moved) {
            sfx.playHit();
            this.updateGameOverGamepadFocus();
        }

        // Simula clique com botão A
        if (inputs.isInputDown('A')) {
            const focusedId = this.goItems[this.goIndex];
            const btnEl = document.getElementById(focusedId);
            if (btnEl) {
                btnEl.click();
            }
        }
    }

    updateGameOverGamepadFocus() {
        this.goItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('gamepad-focused');
        });

        const focusedId = this.goItems[this.goIndex];
        const focusedEl = document.getElementById(focusedId);
        if (focusedEl) {
            focusedEl.classList.add('gamepad-focused');
        }
    }

    updateVictoryGamepadNavigation() {
        let moved = false;

        if (inputs.isInputDown('DLeft') || inputs.isInputDown('LS_Left') || inputs.isInputDown('DUp') || inputs.isInputDown('LS_Up')) {
            this.vicIndex = 0; // "Jogar Novamente"
            moved = true;
        } else if (inputs.isInputDown('DRight') || inputs.isInputDown('LS_Right') || inputs.isInputDown('DDown') || inputs.isInputDown('LS_Down')) {
            this.vicIndex = 1; // "Voltar ao Menu"
            moved = true;
        }

        if (moved) {
            sfx.playHit();
            this.updateVictoryGamepadFocus();
        }

        // Simula clique com botão A
        if (inputs.isInputDown('A')) {
            const focusedId = this.vicItems[this.vicIndex];
            const btnEl = document.getElementById(focusedId);
            if (btnEl) {
                btnEl.click();
            }
        }
    }

    updateVictoryGamepadFocus() {
        this.vicItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('gamepad-focused');
        });

        const focusedId = this.vicItems[this.vicIndex];
        const focusedEl = document.getElementById(focusedId);
        if (focusedEl) {
            focusedEl.classList.add('gamepad-focused');
        }
    }

    // ==========================================
    // SELEÇÃO DE LAYOUT DO CONTROLE E AUXILIARES
    // ==========================================

    selectLayout(selected) {
        this.layout = selected;
        document.getElementById('layout-xbox-btn').classList.remove('active');
        document.getElementById('layout-ps4-btn').classList.remove('active');
        document.getElementById(`layout-${selected}-btn`).classList.add('active');
        
        // Aplica a classe correspondente no body para alterar estilos CSS
        document.body.classList.remove('layout-xbox', 'layout-ps4');
        document.body.classList.add(`layout-${selected}`);
        
        // Atualiza dinamicamente o subtítulo do logo principal
        if (this.dom.subLogo) {
            this.dom.subLogo.textContent = selected === 'xbox' ? 'XBOX EDITION' : 'PLAYSTATION EDITION';
        }
        
        sfx.playHit();
        
        if (this.isDataConsentGiven) {
            this.safeSetLocal('qte_layout', selected);
        }
    }

    getButtonDisplayLabel(target) {
        if (this.layout === 'ps4') {
            switch(target) {
                case 'A': return '✕';
                case 'B': return '◯';
                case 'X': return '⬜';
                case 'Y': return '△';
                case 'LB': return 'L1';
                case 'RB': return 'R1';
                case 'LT': return 'L2';
                case 'RT': return 'R2';
                case 'LS': return 'L3';
                case 'RS': return 'R3';
                default: return target;
            }
        } else {
            switch(target) {
                case 'LS': return 'LS';
                case 'RS': return 'RS';
                default: return target;
            }
        }
    }

    updatePlaygroundLabels() {
        if (this.layout === 'ps4') {
            document.getElementById('visual-btn-A').textContent = '✕';
            document.getElementById('visual-btn-B').textContent = '◯';
            document.getElementById('visual-btn-X').textContent = '⬜';
            document.getElementById('visual-btn-Y').textContent = '△';
            
            document.getElementById('visual-btn-LB').textContent = 'L1';
            document.getElementById('visual-btn-RB').textContent = 'R1';
            
            document.getElementById('visual-btn-LT').innerHTML = `L2 <span class="trigger-val" id="val-LT">0%</span>`;
            document.getElementById('visual-btn-RT').innerHTML = `R2 <span class="trigger-val" id="val-RT">0%</span>`;
            
            document.getElementById('visual-stick-LS').querySelector('.stick-label').textContent = 'L3';
            document.getElementById('visual-stick-RS').querySelector('.stick-label').textContent = 'R3';
        } else {
            document.getElementById('visual-btn-A').textContent = 'A';
            document.getElementById('visual-btn-B').textContent = 'B';
            document.getElementById('visual-btn-X').textContent = 'X';
            document.getElementById('visual-btn-Y').textContent = 'Y';
            
            document.getElementById('visual-btn-LB').textContent = 'LB';
            document.getElementById('visual-btn-RB').textContent = 'RB';
            
            document.getElementById('visual-btn-LT').innerHTML = `LT <span class="trigger-val" id="val-LT">0%</span>`;
            document.getElementById('visual-btn-RT').innerHTML = `RT <span class="trigger-val" id="val-RT">0%</span>`;
            
            document.getElementById('visual-stick-LS').querySelector('.stick-label').textContent = 'LS';
            document.getElementById('visual-stick-RS').querySelector('.stick-label').textContent = 'RS';
        }
    }

    // ==========================================
    // SEÇÃO DE ESTATÍSTICAS HISTÓRICAS E EVOLUÇÃO
    // ==========================================

    renderHistoricalStats() {
        const history = this.history || [];
        
        if (history.length === 0) {
            this.dom.statsEmptyPanel.classList.remove('hidden');
            this.dom.statsMainLayout.classList.add('hidden');
            return;
        }

        this.dom.statsEmptyPanel.classList.add('hidden');
        this.dom.statsMainLayout.classList.remove('hidden');

        // 1. Calcular Métricas Acumuladas
        const totalMatches = history.length;
        const bestScore = Math.max(...history.map(h => h.score), 0);
        const avgReaction = Math.round(history.reduce((sum, h) => sum + h.avgReaction, 0) / totalMatches);
        const avgAccuracy = Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / totalMatches);

        this.dom.histMatches.textContent = totalMatches;
        this.dom.histBestScore.textContent = bestScore.toString().padStart(5, '0');
        this.dom.histAvgReaction.textContent = `${avgReaction}ms`;
        this.dom.histAvgAccuracy.textContent = `${avgAccuracy}%`;

        // 2. Renderizar Insights Inteligentes
        this.renderHistoricalInsights(totalMatches, bestScore, avgReaction, avgAccuracy);

        // 3. Preencher tabela de partidas recentes
        let tbodyHtml = '';
        const recent = [...history].reverse().slice(0, 5);
        recent.forEach(h => {
            const diffMap = { easy: 'Recruta', medium: 'Guerreiro', hard: 'Lenda', insane: 'Divino' };
            const modeMap = { normal: 'Treino', hardcore: 'Morte Súbita' };
            
            tbodyHtml += `
                <tr>
                    <td>${h.date}</td>
                    <td><strong>${diffMap[h.difficulty] || h.difficulty}</strong></td>
                    <td>${modeMap[h.mode] || h.mode}</td>
                    <td><strong class="yellow-text">${h.score}</strong></td>
                    <td>${h.accuracy}%</td>
                    <td>${h.avgReaction}ms</td>
                </tr>
            `;
        });
        this.dom.recentMatchesTbody.innerHTML = tbodyHtml;

        // 4. Renderizar Gráfico SVG Histórico
        this.renderHistoricalChart();
    }

    renderHistoricalInsights(totalMatches, bestScore, avgReaction, avgAccuracy) {
        const history = this.history || [];
        const insights = [];

        // Insight 1: Evolução
        if (totalMatches >= 3) {
            const recent3 = history.slice(-3);
            const recentAvgReaction = Math.round(recent3.reduce((sum, h) => sum + h.avgReaction, 0) / 3);
            const diff = avgReaction - recentAvgReaction;
            if (diff > 15) {
                insights.push({
                    icon: 'fa-gauge-high',
                    color: '#2ecc71',
                    title: 'Reflexos em Aceleração!',
                    desc: `Suas últimas 3 partidas tiveram uma reação média de ${recentAvgReaction}ms. Você está ${diff}ms mais rápido do que seu histórico geral!`
                });
            } else {
                insights.push({
                    icon: 'fa-chart-line',
                    color: '#3498db',
                    title: 'Ritmo de Treino Estável',
                    desc: 'Seus tempos de reação estão se consolidando. A constância é a chave para criar a memória muscular perfeita.'
                });
            }
        } else {
            insights.push({
                icon: 'fa-fire',
                color: '#ff8c00',
                title: 'Começo Promissor!',
                desc: 'Você está construindo suas fundações analíticas. Complete mais partidas para desbloquear comparações de reflexo no tempo.'
            });
        }

        // Insight 2: Precisão de Elite ou Alerta
        if (avgAccuracy >= 85) {
            insights.push({
                icon: 'fa-bullseye',
                color: '#2ecc71',
                title: 'Precisão Cirúrgica',
                desc: `Sua precisão geral de ${avgAccuracy}% é espetacular! Seus dedos raramente erram um botão. Que tal subir um nível de dificuldade?`
            });
        } else if (avgAccuracy < 70) {
            insights.push({
                icon: 'fa-triangle-exclamation',
                color: '#ff8c00',
                title: 'Ajuste seus Dedos',
                desc: 'Sua precisão está abaixo de 70%. Tente treinar no modo Treino na dificuldade Recruta para calibrar os botões sem pressão de tempo.'
            });
        } else {
            insights.push({
                icon: 'fa-arrow-trend-up',
                color: '#3498db',
                title: 'Equilíbrio Sólido',
                desc: `Sua precisão de ${avgAccuracy}% mostra que você está dominando os reflexos. Continue subindo o nível gradualmente.`
            });
        }

        // Insight 3: Recorde / Dedicação
        if (bestScore > 5000) {
            insights.push({
                icon: 'fa-trophy',
                color: '#f1c40f',
                title: 'Pontuação de Elite',
                desc: `Seu recorde de ${bestScore} pontos é de altíssimo nível. Isso mostra que você consegue manter sequências longas de multiplicador combo!`
            });
        } else {
            insights.push({
                icon: 'fa-brain',
                color: '#ff007f',
                title: 'Foco Mental',
                desc: 'Tente manter o combo ativado (combos x3 ou x4 multiplicam seus pontos drasticamente). A calma vence o QTE!'
            });
        }

        // Desenhar Insights
        let html = '';
        insights.forEach(ins => {
            html += `
                <div class="insight-card">
                    <div class="insight-icon" style="color: ${ins.color};"><i class="fa-solid ${ins.icon}"></i></div>
                    <div class="insight-content">
                        <span class="insight-title">${ins.title}</span>
                        <span class="insight-desc">${ins.desc}</span>
                    </div>
                </div>
            `;
        });
        this.dom.histInsights.innerHTML = html;
    }

    renderHistoricalChart() {
        const svg = document.getElementById('hist-score-chart');
        if (!svg) return;

        svg.innerHTML = '';
        const history = this.history || [];
        if (history.length === 0) return;

        const width = 600;
        const height = 240;
        const paddingLeft = 45;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Eixo Y: Pontuação máxima baseada na maior do histórico (ou 2000)
        const maxScore = Math.max(...history.map(h => h.score), 2000) * 1.1;

        // Grid Lines Y e rótulos
        const steps = 4;
        for (let i = 1; i <= steps; i++) {
            const scoreVal = Math.round((maxScore / steps) * i);
            const y = paddingTop + (1 - scoreVal / maxScore) * chartHeight;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', paddingLeft);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - paddingRight);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'chart-grid-line');
            svg.appendChild(line);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', paddingLeft - 8);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'chart-text');
            text.textContent = scoreVal;
            svg.appendChild(text);
        }

        // Rótulos do Eixo X (máximo 8 partidas no gráfico)
        const maxDisplay = Math.min(history.length, 8);
        const startIndex = history.length - maxDisplay;
        const chartData = history.slice(startIndex);

        for (let i = 0; i < chartData.length; i++) {
            const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * chartWidth : chartWidth / 2);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height - paddingBottom + 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'chart-text');
            text.textContent = `Partida #${startIndex + i + 1}`;
            svg.appendChild(text);
        }

        // Desenhar Eixos
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', paddingLeft);
        xAxis.setAttribute('y1', height - paddingBottom);
        xAxis.setAttribute('x2', width - paddingRight);
        xAxis.setAttribute('y2', height - paddingBottom);
        xAxis.setAttribute('class', 'chart-axis');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', paddingLeft);
        yAxis.setAttribute('y1', paddingTop);
        yAxis.setAttribute('x2', paddingLeft);
        yAxis.setAttribute('y2', height - paddingBottom);
        yAxis.setAttribute('class', 'chart-axis');
        svg.appendChild(yAxis);

        // Pontos e Linhas de Pontuação
        const points = [];
        chartData.forEach((evt, idx) => {
            const x = paddingLeft + (chartData.length > 1 ? (idx / (chartData.length - 1)) * chartWidth : chartWidth / 2);
            const y = paddingTop + (1 - evt.score / maxScore) * chartHeight;
            points.push(`${x},${y}`);
        });

        // Plota Linha de Conexão
        if (points.length > 1) {
            const scorePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            scorePath.setAttribute('d', `M ${points.join(' L ')}`);
            scorePath.setAttribute('class', 'chart-line-reaction');
            scorePath.style.stroke = 'var(--xbox-green)';
            scorePath.style.filter = 'drop-shadow(0 0 5px var(--xbox-green-glow))';
            svg.appendChild(scorePath);
        }

        // Plota Nós
        chartData.forEach((evt, idx) => {
            const x = paddingLeft + (chartData.length > 1 ? (idx / (chartData.length - 1)) * chartWidth : chartWidth / 2);
            const y = paddingTop + (1 - evt.score / maxScore) * chartHeight;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('class', 'chart-node');
            circle.style.stroke = 'var(--xbox-green)';

            const tooltipText = `Partida #${startIndex + idx + 1} (${evt.date}): ${evt.score} Pts (Precisão: ${evt.accuracy}%, Reação: ${evt.avgReaction}ms)`;
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = tooltipText;
            circle.appendChild(title);

            svg.appendChild(circle);
        });
    }
}

// Inicializa a aplicação quando carregar
window.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine();
    game.init();
});
