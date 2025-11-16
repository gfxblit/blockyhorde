// Audio Manager for Blocky Horde
// Generates and plays classic synthesized sound effects using Web Audio API

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.3; // Default volume (0.0 to 1.0)
        this.initialized = false;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.context.destination);
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    /**
     * Resume audio context (needed for browsers that suspend audio contexts)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Set master volume
     * @param {number} value - Volume level (0.0 to 1.0)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Play a sound effect
     * @param {Function} soundGenerator - Function that creates and returns audio nodes
     */
    play(soundGenerator) {
        if (!this.enabled || !this.initialized || !this.context) return;

        try {
            this.resume();
            soundGenerator(this.context, this.masterGain);
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    // ==================== SOUND EFFECTS ====================

    /**
     * Player shoot sound - Classic pew/zap
     */
    playShoot() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        });
    }

    /**
     * Enemy hit/death sound - Explosion-like
     */
    playEnemyHit() {
        this.play((ctx, destination) => {
            // Use noise-like sound for explosion effect
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        });
    }

    /**
     * Player damage sound - Lower pitch hit
     */
    playPlayerHit() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        });
    }

    /**
     * Item pickup sound - Positive chime
     */
    playItemPickup() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
            osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        });
    }

    /**
     * Ghast Fireball ability sound - Powerful blast
     */
    playFireball() {
        this.play((ctx, destination) => {
            // Create a powerful explosion sound
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(300, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(150, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.3);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
            filter.Q.value = 2;

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(destination);

            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.3);
            osc2.stop(ctx.currentTime + 0.3);
        });
    }

    /**
     * Boss spawn sound - Warning/alert
     */
    playBossSpawn() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            // Create a dramatic rising tone
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        });
    }

    /**
     * Boss death sound - Victory fanfare
     */
    playBossDeath() {
        this.play((ctx, destination) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'square';
            osc2.type = 'sine';

            // Victory chord progression
            osc1.frequency.setValueAtTime(400, ctx.currentTime);
            osc1.frequency.setValueAtTime(500, ctx.currentTime + 0.15);
            osc1.frequency.setValueAtTime(600, ctx.currentTime + 0.3);

            osc2.frequency.setValueAtTime(600, ctx.currentTime);
            osc2.frequency.setValueAtTime(750, ctx.currentTime + 0.15);
            osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(destination);

            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
        });
    }

    /**
     * Difficulty increase sound - Level up notification
     */
    playLevelUp() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            // Quick ascending notes
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.setValueAtTime(700, ctx.currentTime + 0.08);
            osc.frequency.setValueAtTime(900, ctx.currentTime + 0.16);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        });
    }

    /**
     * Game over sound - Defeat tone
     */
    playGameOver() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            // Descending sad tone
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.6);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.8);
        });
    }

    /**
     * UI click sound - Simple click
     */
    playClick() {
        this.play((ctx, destination) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        });
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Export the audio manager
export default audioManager;
