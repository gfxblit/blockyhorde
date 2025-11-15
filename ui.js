/**
 * UI Manager
 * Handles all UI updates and displays
 */

import { CONFIG } from './config.js';

// DOM elements
let hpValueElement = null;
let healthFillElement = null;
let timeValueElement = null;
let killsValueElement = null;
let gameOverElement = null;
let finalTimeElement = null;
let finalKillsElement = null;

/**
 * Initialize UI by caching DOM elements
 */
export function initUI() {
    hpValueElement = document.getElementById('hpValue');
    healthFillElement = document.getElementById('healthFill');
    timeValueElement = document.getElementById('timeValue');
    killsValueElement = document.getElementById('killsValue');
    gameOverElement = document.getElementById('gameOver');
    finalTimeElement = document.getElementById('finalTime');
    finalKillsElement = document.getElementById('finalKills');

    // Setup restart button
    const restartButton = gameOverElement?.querySelector('button');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            location.reload();
        });
    }
}

/**
 * Update HP display
 * @param {number} currentHP - Current player HP
 */
export function updateHP(currentHP) {
    if (hpValueElement) {
        hpValueElement.textContent = Math.max(0, Math.floor(currentHP));
    }

    if (healthFillElement) {
        const hpPercent = Math.max(0, (currentHP / CONFIG.player.maxHP) * 100);
        healthFillElement.style.width = hpPercent + '%';
    }
}

/**
 * Update time display
 * @param {number} elapsedTime - Time elapsed in milliseconds
 */
export function updateTime(elapsedTime) {
    if (!timeValueElement) return;

    const timeInSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    timeValueElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Update kills display
 * @param {number} kills - Total kills
 */
export function updateKills(kills) {
    if (killsValueElement) {
        killsValueElement.textContent = kills;
    }
}

/**
 * Show game over screen
 * @param {number} finalTime - Final time in milliseconds
 * @param {number} finalKills - Final kill count
 */
export function showGameOver(finalTime, finalKills) {
    if (!gameOverElement) return;

    // Update final stats
    if (finalTimeElement) {
        const timeInSeconds = Math.floor(finalTime / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        finalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (finalKillsElement) {
        finalKillsElement.textContent = finalKills;
    }

    // Show the modal
    gameOverElement.style.display = 'block';
}

/**
 * Hide game over screen
 */
export function hideGameOver() {
    if (gameOverElement) {
        gameOverElement.style.display = 'none';
    }
}
