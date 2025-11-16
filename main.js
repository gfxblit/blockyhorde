/**
 * Main Entry Point
 * Initializes and starts the game
 */
import { CONFIG } from './config.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { Game } from './game.js';

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
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    // Create managers
    const inputManager = new InputManager();
    const uiManager = new UIManager();

    // Initialize input
    inputManager.initialize();

    // Create and start game
    const game = new Game(canvas, inputManager, uiManager);
    game.start();

    console.log('Blocky Horde initialized successfully!');
}

// Start the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
