/**
 * UI Module
 * Handles all user interface updates and DOM manipulation
 */
import { CONFIG } from './config.js';

/**
 * UI Manager
 */
export class UIManager {
    constructor() {
        this.elements = {
            hpValue: document.getElementById('hpValue'),
            healthFill: document.getElementById('healthFill'),
            timeValue: document.getElementById('timeValue'),
            killsValue: document.getElementById('killsValue'),
            gameOver: document.getElementById('gameOver'),
            finalTime: document.getElementById('finalTime'),
            finalKills: document.getElementById('finalKills'),
            playAgainButton: null
        };

        this.initializeEventListeners();
    }

    /**
     * Initialize UI event listeners
     */
    initializeEventListeners() {
        // Find play again button and add event listener
        const playAgainButton = this.elements.gameOver.querySelector('button');
        if (playAgainButton) {
            this.elements.playAgainButton = playAgainButton;
            playAgainButton.addEventListener('click', () => {
                location.reload();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.detectTouchDevice();
        });
    }

    /**
     * Detect touch device and adjust UI
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
     * Update player health display
     * @param {number} currentHP - Current player HP
     */
    updateHealth(currentHP) {
        const displayHP = Math.max(0, Math.floor(currentHP));
        this.elements.hpValue.textContent = displayHP;

        const hpPercent = Math.max(0, (currentHP / CONFIG.player.maxHP) * 100);
        this.elements.healthFill.style.width = hpPercent + '%';
    }

    /**
     * Update time display
     * @param {number} startTime - Game start timestamp
     * @param {number} currentTime - Current timestamp
     */
    updateTime(startTime, currentTime) {
        const timeInSeconds = Math.floor((currentTime - startTime) / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        this.elements.timeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Update kills display
     * @param {number} kills - Number of kills
     */
    updateKills(kills) {
        this.elements.killsValue.textContent = kills;
    }

    /**
     * Update all UI elements
     * @param {Object} gameState - Current game state
     * @param {Object} player - Player object
     */
    updateAll(gameState, player) {
        this.updateHealth(player.hp);
        this.updateTime(gameState.startTime, gameState.currentTime);
        this.updateKills(gameState.kills);
    }

    /**
     * Show game over screen
     * @param {number} startTime - Game start timestamp
     * @param {number} endTime - Game end timestamp
     * @param {number} kills - Final kill count
     */
    showGameOver(startTime, endTime, kills) {
        const timeInSeconds = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;

        this.elements.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.elements.finalKills.textContent = kills;
        this.elements.gameOver.style.display = 'block';
    }

    /**
     * Format time for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}
