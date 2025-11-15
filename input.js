/**
 * Input Handler
 * Manages keyboard and touch input for the game
 */

const MAX_JOYSTICK_DISTANCE = 45;

// Input state
const inputState = {
    keys: {},
    touch: {
        active: false,
        dx: 0,
        dy: 0,
        startX: 0,
        startY: 0
    }
};

// DOM elements (set during initialization)
let joystickBase = null;
let joystickStick = null;

/**
 * Initialize input handlers
 */
export function initInput() {
    setupKeyboardInput();
    setupTouchInput();
    detectTouchDevice();
    window.addEventListener('resize', detectTouchDevice);
}

/**
 * Get current input direction
 * @returns {{dx: number, dy: number}} Direction vector
 */
export function getInputDirection() {
    let dx = 0;
    let dy = 0;

    // Keyboard input
    if (inputState.keys['w'] || inputState.keys['arrowup']) dy -= 1;
    if (inputState.keys['s'] || inputState.keys['arrowdown']) dy += 1;
    if (inputState.keys['a'] || inputState.keys['arrowleft']) dx -= 1;
    if (inputState.keys['d'] || inputState.keys['arrowright']) dx += 1;

    // Touch input overrides keyboard
    if (inputState.touch.active) {
        dx = inputState.touch.dx;
        dy = inputState.touch.dy;
    }

    // Normalize diagonal movement (only for keyboard)
    if (!inputState.touch.active && dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    return { dx, dy };
}

/**
 * Setup keyboard event listeners
 */
function setupKeyboardInput() {
    document.addEventListener('keydown', (e) => {
        inputState.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
        inputState.keys[e.key.toLowerCase()] = false;
    });
}

/**
 * Setup touch control handlers
 */
function setupTouchInput() {
    joystickBase = document.getElementById('joystickBase');
    joystickStick = document.getElementById('joystickStick');

    if (!joystickBase || !joystickStick) {
        console.warn('Touch control elements not found');
        return;
    }

    joystickBase.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickBase.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickBase.addEventListener('touchend', handleTouchEnd, { passive: false });
    joystickBase.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

/**
 * Handle touch start event
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickBase.getBoundingClientRect();

    inputState.touch.active = true;
    inputState.touch.startX = rect.left + rect.width / 2;
    inputState.touch.startY = rect.top + rect.height / 2;
}

/**
 * Handle touch move event
 */
function handleTouchMove(e) {
    e.preventDefault();
    if (!inputState.touch.active) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - inputState.touch.startX;
    const deltaY = touch.clientY - inputState.touch.startY;

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Limit joystick movement
    let normalizedDX = deltaX;
    let normalizedDY = deltaY;

    if (distance > MAX_JOYSTICK_DISTANCE) {
        const angle = Math.atan2(deltaY, deltaX);
        normalizedDX = Math.cos(angle) * MAX_JOYSTICK_DISTANCE;
        normalizedDY = Math.sin(angle) * MAX_JOYSTICK_DISTANCE;
    }

    // Update joystick visual position
    joystickStick.style.transform =
        `translate(calc(-50% + ${normalizedDX}px), calc(-50% + ${normalizedDY}px))`;

    // Update input state with normalized direction (-1 to 1)
    inputState.touch.dx = normalizedDX / MAX_JOYSTICK_DISTANCE;
    inputState.touch.dy = normalizedDY / MAX_JOYSTICK_DISTANCE;
}

/**
 * Handle touch end event
 */
function handleTouchEnd(e) {
    e.preventDefault();
    inputState.touch.active = false;
    inputState.touch.dx = 0;
    inputState.touch.dy = 0;

    // Reset joystick visual position
    if (joystickStick) {
        joystickStick.style.transform = 'translate(-50%, -50%)';
    }
}

/**
 * Detect touch device and show/hide appropriate controls
 */
function detectTouchDevice() {
    const isTouchDevice = ('ontouchstart' in window) ||
                          (navigator.maxTouchPoints > 0) ||
                          (navigator.msMaxTouchPoints > 0);

    const isMobile = window.innerWidth <= 850;
    const showTouchControls = isTouchDevice || isMobile;

    const touchControls = document.getElementById('touchControls');
    const desktopInstructions = document.querySelector('.instructions.desktop');
    const mobileInstructions = document.querySelector('.instructions.mobile');

    if (touchControls) {
        touchControls.style.display = showTouchControls ? 'block' : 'none';
    }
    if (desktopInstructions) {
        desktopInstructions.style.display = showTouchControls ? 'none' : 'block';
    }
    if (mobileInstructions) {
        mobileInstructions.style.display = showTouchControls ? 'block' : 'none';
    }
}
