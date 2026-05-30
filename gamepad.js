/* ==========================================
   GAMEPAD & KEYBOARD INPUT MANAGER
   Trata conexões, mapeamento Xbox e fallbacks do teclado
   ========================================== */

class InputManager {
    constructor() {
        // Conexão do Gamepad
        this.gamepadIndex = null;
        this.isConnected = false;
        
        // Estados Atuais de Entrada (Mapeamento Unificado Xbox / Teclado)
        this.inputs = {
            // Botões Principais (Boolean)
            A: false,
            B: false,
            X: false,
            Y: false,
            
            // Bumpers & Triggers (Boolean)
            LB: false,
            RB: false,
            LT: false,
            RT: false,
            
            // Valores Analógicos dos Gatilhos (0.0 a 1.0)
            LT_Val: 0.0,
            RT_Val: 0.0,

            // D-Pad (Boolean)
            DUp: false,
            DDown: false,
            DLeft: false,
            DRight: false,

            // Auxiliares (Boolean)
            View: false,
            Menu: false,
            LSPress: false,
            RSPress: false,

            // Sticks Analógicos (valores de -1.0 a 1.0)
            LS_X: 0.0,
            LS_Y: 0.0,
            RS_X: 0.0,
            RS_Y: 0.0,

            // Direções de Analógico para Flicks rápidos (Boolean)
            LS_Up: false,
            LS_Down: false,
            LS_Left: false,
            LS_Right: false,

            RS_Up: false,
            RS_Down: false,
            RS_Left: false,
            RS_Right: false
        };

        // Estados do Frame Anterior (para detectar o momento exato do clique/flick)
        this.prevInputs = { ...this.inputs };

        // Estados do Teclado (para fallback)
        this.keyboardState = {};
        this.prevKeyboardState = {};
        
        // Calibração dos sticks para evitar flick contínuo (Debounce / Histerese)
        this.analogDebounce = {
            LS_Up: false,
            LS_Down: false,
            LS_Left: false,
            LS_Right: false,
            RS_Up: false,
            RS_Down: false,
            RS_Left: false,
            RS_Right: false
        };

        // Callbacks de conexão
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;

        // Limiar de ativação dos analógicos para considerarmos um "Flick"
        this.analogThreshold = 0.7;
        // Limiar de retorno para zerar o analógico
        this.analogReleaseThreshold = 0.3;

        this.initEventListeners();
    }

    // Configura os escutadores globais de evento
    initEventListeners() {
        // Conexão do gamepad
        window.addEventListener("gamepadconnected", (e) => {
            console.log(`Controle conectado no índice ${e.gamepad.index}: ${e.gamepad.id}`);
            this.gamepadIndex = e.gamepad.index;
            this.isConnected = true;
            if (this.onConnectCallback) this.onConnectCallback(e.gamepad);
        });

        // Desconexão do gamepad
        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                console.log("Controle desconectado");
                this.gamepadIndex = null;
                this.isConnected = false;
                this.resetInputs();
                if (this.onDisconnectCallback) this.onDisconnectCallback();
            }
        });

        // Teclado Fallback
        window.addEventListener("keydown", (e) => {
            this.keyboardState[e.code] = true;
            
            // Impedir que espaço/setas rolem a tela enquanto joga
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keyboardState[e.code] = false;
        });
    }

    // Reseta todos os estados para false/0.0
    resetInputs() {
        for (let key in this.inputs) {
            if (typeof this.inputs[key] === "number") {
                this.inputs[key] = 0.0;
            } else {
                this.inputs[key] = false;
            }
        }
        this.prevInputs = { ...this.inputs };
        
        for (let key in this.analogDebounce) {
            this.analogDebounce[key] = false;
        }
    }

    // Atualiza o estado das entradas chamando esta função em cada frame (Game Loop)
    update() {
        // 1. Salva o frame anterior
        this.prevInputs = { ...this.inputs };
        this.prevKeyboardState = { ...this.keyboardState };

        // 2. Tenta ler o Gamepad
        let gamepadRead = false;
        if (this.isConnected && this.gamepadIndex !== null) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[this.gamepadIndex];

            if (gp) {
                this.readGamepadData(gp);
                gamepadRead = true;
            }
        }

        // 3. Se não houver gamepad lido, ou para mesclar teclado, lê o Teclado
        this.readKeyboardData(gamepadRead);
    }

    // Mapeamento nativo dos botões Xbox no Gamepad
    readGamepadData(gp) {
        // Botões (Standard Gamepad Mapping)
        this.inputs.A = gp.buttons[0]?.pressed || false;
        this.inputs.B = gp.buttons[1]?.pressed || false;
        this.inputs.X = gp.buttons[2]?.pressed || false;
        this.inputs.Y = gp.buttons[3]?.pressed || false;
        
        this.inputs.LB = gp.buttons[4]?.pressed || false;
        this.inputs.RB = gp.buttons[5]?.pressed || false;
        
        // Gatilhos analógicos (Lê valor numérico 0.0 a 1.0 e gatilho pressionado)
        this.inputs.LT_Val = gp.buttons[6]?.value || 0.0;
        this.inputs.RT_Val = gp.buttons[7]?.value || 0.0;
        this.inputs.LT = gp.buttons[6]?.pressed || false;
        this.inputs.RT = gp.buttons[7]?.pressed || false;

        // D-Pad
        this.inputs.DUp = gp.buttons[12]?.pressed || false;
        this.inputs.DDown = gp.buttons[13]?.pressed || false;
        this.inputs.DLeft = gp.buttons[14]?.pressed || false;
        this.inputs.DRight = gp.buttons[15]?.pressed || false;

        // Auxiliares
        this.inputs.View = gp.buttons[8]?.pressed || false;
        this.inputs.Menu = gp.buttons[9]?.pressed || false;
        this.inputs.LSPress = gp.buttons[10]?.pressed || false;
        this.inputs.RSPress = gp.buttons[11]?.pressed || false;

        // Sticks Analógicos (Eixos)
        // LS (Eixo 0 = Horizontal, Eixo 1 = Vertical)
        this.inputs.LS_X = gp.axes[0] || 0.0;
        this.inputs.LS_Y = gp.axes[1] || 0.0;

        // RS (Eixo 2 = Horizontal, Eixo 3 = Vertical)
        this.inputs.RS_X = gp.axes[2] || 0.0;
        this.inputs.RS_Y = gp.axes[3] || 0.0;

        // Aplica zona morta (deadzone) leve para evitar drift
        const deadzone = 0.15;
        if (Math.abs(this.inputs.LS_X) < deadzone) this.inputs.LS_X = 0.0;
        if (Math.abs(this.inputs.LS_Y) < deadzone) this.inputs.LS_Y = 0.0;
        if (Math.abs(this.inputs.RS_X) < deadzone) this.inputs.RS_X = 0.0;
        if (Math.abs(this.inputs.RS_Y) < deadzone) this.inputs.RS_Y = 0.0;

        // Lógica de Flicks (LS/RS Direcionais com Histerese de Retorno ao Centro)
        this.processAnalogFlick('LS_Up', this.inputs.LS_Y < -this.analogThreshold, this.inputs.LS_Y > -this.analogReleaseThreshold);
        this.processAnalogFlick('LS_Down', this.inputs.LS_Y > this.analogThreshold, this.inputs.LS_Y < this.analogReleaseThreshold);
        this.processAnalogFlick('LS_Left', this.inputs.LS_X < -this.analogThreshold, this.inputs.LS_X > -this.analogReleaseThreshold);
        this.processAnalogFlick('LS_Right', this.inputs.LS_X > this.analogThreshold, this.inputs.LS_X < this.analogReleaseThreshold);

        this.processAnalogFlick('RS_Up', this.inputs.RS_Y < -this.analogThreshold, this.inputs.RS_Y > -this.analogReleaseThreshold);
        this.processAnalogFlick('RS_Down', this.inputs.RS_Y > this.analogThreshold, this.inputs.RS_Y < this.analogReleaseThreshold);
        this.processAnalogFlick('RS_Left', this.inputs.RS_X < -this.analogThreshold, this.inputs.RS_X > -this.analogReleaseThreshold);
        this.processAnalogFlick('RS_Right', this.inputs.RS_X > this.analogThreshold, this.inputs.RS_X < this.analogReleaseThreshold);
    }

    // Processador de Histerese de Flicks Analógicos
    // Se pushedForFlick for verdadeiro e não estamos debouncados, ativamos o flick.
    // Só desativamos o debounce quando o analógico retornar para a zona morta central (releaseCheck).
    processAnalogFlick(directionName, pushedForFlick, releaseCheck) {
        if (pushedForFlick) {
            if (!this.analogDebounce[directionName]) {
                this.inputs[directionName] = true;
                this.analogDebounce[directionName] = true; // Trava
            } else {
                this.inputs[directionName] = false; // Já disparou neste flick
            }
        } else {
            this.inputs[directionName] = false;
            if (releaseCheck) {
                this.analogDebounce[directionName] = false; // Destrava quando voltar ao centro
            }
        }
    }

    // Mapeamento do Teclado como Fallback
    readKeyboardData(gamepadRead) {
        // Caso o controle esteja conectado e enviando dados, o teclado apenas mescla entradas extras.
        // Se NÃO houver controle, o teclado simula totalmente o controle.

        const checkKey = (code) => this.keyboardState[code] || false;

        // Se o gamepad não estiver lido, mapeia botões fundamentais do teclado
        if (!gamepadRead) {
            this.inputs.A = checkKey("Enter") || checkKey("Space");
            this.inputs.B = checkKey("Backspace") || checkKey("Escape");
            this.inputs.X = checkKey("KeyX");
            this.inputs.Y = checkKey("KeyY");

            this.inputs.LB = checkKey("KeyQ");
            this.inputs.RB = checkKey("KeyE");
            this.inputs.LT = checkKey("KeyZ");
            this.inputs.RT = checkKey("KeyC");
            this.inputs.LT_Val = this.inputs.LT ? 1.0 : 0.0;
            this.inputs.RT_Val = this.inputs.RT ? 1.0 : 0.0;

            this.inputs.DUp = checkKey("Digit1") || checkKey("Numpad8");
            this.inputs.DDown = checkKey("Digit2") || checkKey("Numpad2");
            this.inputs.DLeft = checkKey("Digit3") || checkKey("Numpad4");
            this.inputs.DRight = checkKey("Digit4") || checkKey("Numpad6");

            // Analógico LS (WASD)
            let lsX = 0.0;
            let lsY = 0.0;
            if (checkKey("KeyD")) lsX += 1.0;
            if (checkKey("KeyA")) lsX -= 1.0;
            if (checkKey("KeyS")) lsY += 1.0;
            if (checkKey("KeyW")) lsY -= 1.0;
            this.inputs.LS_X = lsX;
            this.inputs.LS_Y = lsY;

            // Analógico RS (Setas do Teclado)
            let rsX = 0.0;
            let rsY = 0.0;
            if (checkKey("ArrowRight")) rsX += 1.0;
            if (checkKey("ArrowLeft")) rsX -= 1.0;
            if (checkKey("ArrowDown")) rsY += 1.0;
            if (checkKey("ArrowUp")) rsY -= 1.0;
            this.inputs.RS_X = rsX;
            this.inputs.RS_Y = rsY;

            // Flicks de teclado funcionam por transição de tecla (pressionamento)
            this.inputs.LS_Up = this.isKeyPressedThisFrame("KeyW");
            this.inputs.LS_Down = this.isKeyPressedThisFrame("KeyS");
            this.inputs.LS_Left = this.isKeyPressedThisFrame("KeyA");
            this.inputs.LS_Right = this.isKeyPressedThisFrame("KeyD");

            this.inputs.RS_Up = this.isKeyPressedThisFrame("ArrowUp");
            this.inputs.RS_Down = this.isKeyPressedThisFrame("ArrowDown");
            this.inputs.RS_Left = this.isKeyPressedThisFrame("ArrowLeft");
            this.inputs.RS_Right = this.isKeyPressedThisFrame("ArrowRight");
        } else {
            // Se o Gamepad ESTÁ conectado, ainda deixamos o teclado agir em paralelo (facilita testes)
            if (checkKey("Enter") || checkKey("Space")) this.inputs.A = true;
            if (checkKey("Backspace")) this.inputs.B = true;
            if (checkKey("KeyX")) this.inputs.X = true;
            if (checkKey("KeyY")) this.inputs.Y = true;
            
            if (checkKey("KeyQ")) this.inputs.LB = true;
            if (checkKey("KeyE")) this.inputs.RB = true;
            if (checkKey("KeyZ")) { this.inputs.LT = true; this.inputs.LT_Val = 1.0; }
            if (checkKey("KeyC")) { this.inputs.RT = true; this.inputs.RT_Val = 1.0; }
        }
    }

    // HELPER: Verifica se uma tecla acabou de ser pressionada (transição false -> true)
    isKeyPressedThisFrame(code) {
        return this.keyboardState[code] && !this.prevKeyboardState[code];
    }

    // HELPER PRINCIPAL DO JOGO: Verifica se um input Xbox foi pressionado EXACTAMENTE neste frame
    isInputDown(inputKey) {
        return this.inputs[inputKey] && !this.prevInputs[inputKey];
    }

    // HELPER: Verifica se o input está sendo ativamente mantido pressionado
    isInputActive(inputKey) {
        return this.inputs[inputKey];
    }

    // Faz o controle vibrar se o dispositivo suportar
    vibrate(durationMs = 200, strongMagnitude = 0.8, weakMagnitude = 0.8) {
        if (!this.isConnected || this.gamepadIndex === null) return;
        
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];
        
        if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
            gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: durationMs,
                weakMagnitude: weakMagnitude,
                strongMagnitude: strongMagnitude
            }).catch(err => console.log("Haptic feedback erro:", err));
        }
    }
}

// Cria instância global
const inputs = new InputManager();
