/* ==========================================
   SOUND SYSTEM - WEB AUDIO API SYNTHESIZER
   Gera efeitos sonoros em tempo real sem arquivos externos
   ========================================== */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.muted = false;
    }

    // Inicialização atrasada para seguir políticas de reprodução do navegador (requer interação do usuário)
    init() {
        if (this.ctx) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Controle de volume master
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime); // Volume padrão confortável
            this.masterVolume.connect(this.ctx.destination);
        } catch (e) {
            console.error("Web Audio API não suportada pelo navegador:", e);
        }
    }

    // Tocar um som de acerto (Hit) normal
    playHit() {
        this.init();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        // Rampa de frequência ascendente rápida (260Hz -> 520Hz)
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    // Tocar um som de acerto perfeito (Perfect Hit)
    playPerfectHit() {
        this.init();
        if (this.muted || !this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Oscilador 1 (Oitava base - senoidal pura)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(329.63, this.ctx.currentTime); // Mi 4
        osc1.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15); // Mi 5

        // Oscilador 2 (Quinta justa metálica - quadrada mais sutil)
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(493.88, this.ctx.currentTime); // Si 4
        osc2.frequency.exponentialRampToValueAtTime(987.77, this.ctx.currentTime + 0.15); // Si 5

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterVolume);

        osc1.start();
        osc2.start();
        
        osc1.stop(this.ctx.currentTime + 0.18);
        osc2.stop(this.ctx.currentTime + 0.18);
    }

    // Tocar som de falha (Miss)
    playMiss() {
        this.init();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        // Rampa de frequência descendente pesada (180Hz -> 50Hz)
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.35);

        // Filtro passa-baixas para deixar som abafado e sombrio
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    // Som curto para aumento de combo
    playComboUp(comboLevel) {
        this.init();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Frequência sobe de acordo com o combo
        const baseFreq = 440 + (comboLevel * 40);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // Melodia curta de vitória (Arpejo triunfante)
    playVictory() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { freq: 261.63, time: 0.0 }, // C4
            { freq: 329.63, time: 0.1 }, // E4
            { freq: 392.00, time: 0.2 }, // G4
            { freq: 523.25, time: 0.3 }, // C5 (oitava)
            { freq: 659.25, time: 0.45 }, // E5
            { freq: 783.99, time: 0.6 }  // G5
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.time);
            
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.setValueAtTime(0.3, now + note.time);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.25);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(now + note.time);
            osc.stop(now + note.time + 0.25);
        });
    }

    // Melodia de fim de jogo dramática (Acorde menor descendente)
    playGameOver() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { freq: 196.00, time: 0.0 }, // G3
            { freq: 155.56, time: 0.15 }, // D#3
            { freq: 130.81, time: 0.3 }, // C3
            { freq: 98.00,  time: 0.5 }  // G2 (grave)
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now + note.time);

            gain.gain.setValueAtTime(0.0, now);
            gain.gain.setValueAtTime(0.35, now + note.time);
            gain.gain.linearRampToValueAtTime(0.01, now + note.time + 0.6);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(now + note.time);
            osc.stop(now + note.time + 0.6);
        });
    }
}

// Exporta uma única instância do gerenciador de áudio
const sfx = new SoundEngine();
