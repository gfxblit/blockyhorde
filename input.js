/**
 * Input Module
 * Handles keyboard and touch input
 */

const MAX_JOYSTICK_DISTANCE = 45;

/**
 * Input state manager
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.touch = {
            active: false,
            dx: 0,
            dy: 0,
            startX: 0,
            startY: 0
        };

        this.joystickBase = null;
        this.joystickStick = null;
        this.abilityButton = null;

        // Ability input tracking (edge detection)
        this.abilityKeyPressed = false;
        this.abilityKeyWasPressed = false;
        this.abilityTouchPressed = false;
    }

    /**
     * Initialize input handlers
     */
    initialize() {
        this.setupKeyboardInput();
        this.setupTouchInput();
        this.setupAbilityButton();
        this.detectTouchDevice();
    }

    /**
     * Setup keyboard event listeners
     */
    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            // Use e.code for physical key position (works across keyboard layouts)
            this.keys[e.code] = true;

            // Prevent default behavior for game control keys
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
                e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            // Use e.code for physical key position (works across keyboard layouts)
            this.keys[e.code] = false;
        });
    }

    /**
     * Setup touch controls
     */
    setupTouchInput() {
        this.joystickBase = document.getElementById('joystickBase');
        this.joystickStick = document.getElementById('joystickStick');
        this.touchControls = document.getElementById('touchControls');

        if (!this.joystickBase || !this.joystickStick || !this.touchControls) {
            console.warn('Joystick elements not found');
            return;
        }

        // Listen for touch events on the entire game container for dynamic joystick
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            gameContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            gameContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            gameContainer.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        }
    }

    /**
     * Setup ability button for touch
     */
    setupAbilityButton() {
        this.abilityButton = document.getElementById('abilityButton');

        if (!this.abilityButton) {
            console.warn('Ability button not found');
            return;
        }

        this.abilityButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.abilityTouchPressed = true;
        }, { passive: false });

        this.abilityButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.abilityTouchPressed = false;
        }, { passive: false });
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(e) {
        // Ignore if touch is on the ability button
        if (e.target.closest('#abilityButton')) {
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];

        // Only activate joystick if not already active
        if (!this.touch.active) {
            // Position joystick at touch location
            const gameContainer = document.getElementById('gameContainer');
            const rect = gameContainer.getBoundingClientRect();

            // Calculate position relative to game container
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Position the joystick base at touch point
            this.touchControls.style.left = `${x}px`;
            this.touchControls.style.top = `${y}px`;
            this.touchControls.style.transform = 'translate(-50%, -50%)';
            this.touchControls.style.opacity = '1';

            this.touch.active = true;
            this.touch.startX = touch.clientX;
            this.touch.startY = touch.clientY;
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touch.active) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touch.startX;
        const deltaY = touch.clientY - this.touch.startY;

        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Limit the joystick movement
        let normalizedDX = deltaX;
        let normalizedDY = deltaY;

        if (distance > MAX_JOYSTICK_DISTANCE) {
            const angle = Math.atan2(deltaY, deltaX);
            normalizedDX = Math.cos(angle) * MAX_JOYSTICK_DISTANCE;
            normalizedDY = Math.sin(angle) * MAX_JOYSTICK_DISTANCE;
        }

        // Update joystick visual position
        this.joystickStick.style.transform = `translate(calc(-50% + ${normalizedDX}px), calc(-50% + ${normalizedDY}px))`;

        // Update touch state with normalized direction (-1 to 1)
        this.touch.dx = normalizedDX / MAX_JOYSTICK_DISTANCE;
        this.touch.dy = normalizedDY / MAX_JOYSTICK_DISTANCE;
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(e) {
        if (!this.touch.active) return;

        e.preventDefault();
        this.touch.active = false;
        this.touch.dx = 0;
        this.touch.dy = 0;

        // Reset joystick visual position
        this.joystickStick.style.transform = 'translate(-50%, -50%)';

        // Hide the joystick
        this.touchControls.style.opacity = '0';
    }

    /**
     * Detect if device supports touch and show appropriate controls
     */
    detectTouchDevice() {
        const isTouchDevice = ('ontouchstart' in window) ||
                              (navigator.maxTouchPoints > 0) ||
                              (navigator.msMaxTouchPoints > 0);

        if (isTouchDevice || window.innerWidth <= 850) {
            const touchControls = document.getElementById('touchControls');
            if (touchControls) {
                touchControls.style.display = 'block';
            }
            const desktopInstructions = document.querySelector('.instructions.desktop');
            const mobileInstructions = document.querySelector('.instructions.mobile');
            if (desktopInstructions) desktopInstructions.style.display = 'none';
            if (mobileInstructions) mobileInstructions.style.display = 'block';
        }
    }

    /**
     * Get current movement direction from input
     * @returns {Object} Movement direction {dx, dy}
     */
    getMovementDirection() {
        let dx = 0;
        let dy = 0;

        // Keyboard input (using physical key codes for layout independence)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        // Touch input (overrides keyboard if active)
        if (this.touch.active) {
            dx = this.touch.dx;
            dy = this.touch.dy;
        } else if (dx !== 0 && dy !== 0) {
            // Normalize diagonal movement for keyboard only
            dx *= 0.707;
            dy *= 0.707;
        }

        return { dx, dy };
    }

    /**
     * Check if ability key was just pressed (edge detection)
     * @returns {boolean} True if ability was just pressed
     */
    isAbilityPressed() {
        // Check if Space key or touch button is pressed
        this.abilityKeyPressed = this.keys['Space'] || this.abilityTouchPressed || false;

        // Edge detection: only trigger on key down, not while held
        const justPressed = this.abilityKeyPressed && !this.abilityKeyWasPressed;

        // Update previous state
        this.abilityKeyWasPressed = this.abilityKeyPressed;

        // Reset touch pressed state after detection
        if (this.abilityTouchPressed) {
            this.abilityTouchPressed = false;
        }

        return justPressed;
    }
}
