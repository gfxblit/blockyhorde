/**
 * Main Entry Point
 * Initializes and starts the game
 */
import { CONFIG } from './config.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { Game } from './game.js';
import audioManager from './audio.js';

/**
 * Update canvas dimensions based on current viewport
 */
function updateCanvasDimensions(canvas) {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth <= 850;

    if (isMobile && isPortrait) {
        // Portrait mode: use 9:16 aspect ratio
        const baseWidth = Math.min(window.innerWidth, 600);
        const baseHeight = Math.floor(baseWidth * (16 / 9));
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        CONFIG.canvas.width = baseWidth;
        CONFIG.canvas.height = baseHeight;
    } else if (isMobile) {
        // Landscape mobile: use aspect ratio based on viewport
        const baseHeight = Math.min(window.innerHeight, 600);
        const baseWidth = Math.floor(baseHeight * (4 / 3));
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        CONFIG.canvas.width = baseWidth;
        CONFIG.canvas.height = baseHeight;
    } else {
        // Desktop: use fixed 800x600
        canvas.width = 800;
        canvas.height = 600;
        CONFIG.canvas.width = 800;
        CONFIG.canvas.height = 600;
    }
}

/**
 * Initialize the game when DOM is ready
 */
function initialize() {
    // Get canvas and set up context
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Set initial canvas dimensions
    updateCanvasDimensions(canvas);

    // Create managers
    const inputManager = new InputManager();
    const uiManager = new UIManager();

    // Initialize input
    inputManager.initialize();

    // Create and start game
    const game = new Game(canvas, inputManager, uiManager);
    game.start();

    // Initialize audio on first user interaction
    let audioInitialized = false;
    const initAudio = () => {
        if (!audioInitialized) {
            audioManager.init();
            audioInitialized = true;
        }
    };

    // Listen for any user interaction to initialize audio
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });

    // Handle window resize and orientation changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCanvasDimensions(canvas);
            // Note: Game camera will automatically adapt to new canvas dimensions
        }, 250);
    });

    // Handle orientation change specifically for mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            updateCanvasDimensions(canvas);
        }, 100);
    });

    console.log('Blocky Horde initialized successfully!');
}

// Start the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
