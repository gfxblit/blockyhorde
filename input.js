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
    }

    /**
     * Initialize input handlers
     */
    initialize() {
        this.setupKeyboardInput();
        this.setupTouchInput();
        this.detectTouchDevice();
    }

    /**
     * Setup keyboard event listeners
     */
    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            // Use e.code for physical key position (works across keyboard layouts)
            this.keys[e.code] = true;
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

        if (!this.joystickBase || !this.joystickStick) {
            console.warn('Joystick elements not found');
            return;
        }

        this.joystickBase.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.joystickBase.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.joystickBase.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.joystickBase.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.joystickBase.getBoundingClientRect();

        this.touch.active = true;
        this.touch.startX = rect.left + rect.width / 2;
        this.touch.startY = rect.top + rect.height / 2;
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
        e.preventDefault();
        this.touch.active = false;
        this.touch.dx = 0;
        this.touch.dy = 0;

        // Reset joystick visual position
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
    }

    /**
     * Detect if device supports touch and show appropriate controls
     */
    detectTouchDevice() {
        const isTouchDevice = ('ontouchstart' in window) ||
                              (navigator.maxTouchPoints > 0) ||
                              (navigator.msMaxTouchPoints > 0);

        if (isTouchDevice || window.innerWidth <= 850) {
            document.getElementById('touchControls').style.display = 'block';
            document.querySelector('.instructions.desktop').style.display = 'none';
            document.querySelector('.instructions.mobile').style.display = 'block';
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
}
