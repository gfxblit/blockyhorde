// Audio Manager for Blocky Horde
// Generates and plays classic synthesized sound effects using Web Audio API

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.3; // Default volume (0.0 to 1.0)
        this.initialized = false;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.setupVisibilityHandler();
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

            // Resume context immediately for Safari (it may start suspended)
            if (this.context.state === 'suspended') {
                this.context.resume().then(() => {
                    console.log('Audio context resumed on init');
                }).catch(e => {
                    console.warn('Failed to resume audio context on init:', e);
                });
            }
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    /**
     * Setup page visibility handler to resume audio when page becomes visible
     */
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.resume();
            }
        });
    }

    /**
     * Resume audio context (needed for browsers that suspend audio contexts)
     * IMPORTANT: For iOS Safari, this must be called directly in a user gesture handler
     * @returns {Promise<void>}
     */
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
                console.log('Audio context resumed');
            } catch (e) {
                console.warn('Failed to resume audio context:', e);
            }
        }
    }

    /**
     * Ensure audio is ready to play (for iOS Safari compatibility)
     * Must be called synchronously within user gesture handler.
     *
     * Note: This initiates audio context resumption synchronously (within the user
     * gesture call stack), but the actual resumption completes asynchronously.
     * This satisfies iOS Safari's requirement that resume() be called directly
     * within a user interaction handler.
     */
    ensureResumed() {
        if (!this.initialized) {
            this.init();
        }

        // For iOS, we need to initiate resume synchronously within the user gesture
        if (this.context && this.context.state === 'suspended') {
            // Start the resume process immediately (don't await)
            // Add error handling for the async completion
            this.context.resume().catch(e => {
                console.warn('Failed to resume audio context:', e);
            });
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
    async play(soundGenerator) {
        if (!this.enabled || !this.initialized || !this.context) return;

        try {
            await this.resume();
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc1.onended = () => {
                osc1.disconnect();
                osc2.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc1.onended = () => {
                osc1.disconnect();
                osc2.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
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

            // Clean up after sound finishes
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
        });
    }

    /**
     * Explosion sound - Powerful blast for special projectile impacts
     */
    playExplosion() {
        this.play((ctx, destination) => {
            // Create a powerful multi-layered explosion sound
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            // Low rumble layer
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(120, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

            // Mid-range explosion
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);

            // High frequency crack
            osc3.type = 'triangle';
            osc3.frequency.setValueAtTime(600, ctx.currentTime);
            osc3.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

            // Filter for realistic explosion character
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
            filter.Q.value = 1.5;

            // Envelope with quick attack and decay
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

            // Connect all nodes
            osc1.connect(filter);
            osc2.connect(filter);
            osc3.connect(filter);
            filter.connect(gain);
            gain.connect(destination);

            // Start and stop oscillators
            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc3.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.4);
            osc2.stop(ctx.currentTime + 0.4);
            osc3.stop(ctx.currentTime + 0.2);

            // Clean up after sound finishes
            osc1.onended = () => {
                osc1.disconnect();
                osc2.disconnect();
                osc3.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
        });
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Export the audio manager
export default audioManager;
