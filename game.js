/**
 * Main Game Controller
 * Orchestrates all game systems and the main game loop
 */

import { CONFIG } from './config.js';
import { initInput } from './input.js';
import { initRenderer, drawBackground, drawPlayer, drawEnemy, drawProjectile } from './renderer.js';
import {
    player,
    enemies,
    projectiles,
    difficultyMultipliers,
    resetPlayer,
    updatePlayer,
    spawnEnemy,
    updateEnemies,
    spawnProjectile,
    updateProjectiles,
    clearEntities
} from './entities.js';
import { initUI, updateHP, updateTime, updateKills, showGameOver } from './ui.js';

// Canvas and context
let canvas = null;
let ctx = null;

// Game state
const gameState = {
    isRunning: false,
    isPaused: false,
    startTime: 0,
    currentTime: 0,
    kills: 0,
    lastUpdate: 0,
    camera: { x: 0, y: 0 }
};

// Spawn timers
let lastEnemySpawn = 0;
let lastProjectileSpawn = 0;
let currentSpawnInterval = CONFIG.enemy.initialSpawnInterval;

/**
 * Initialize the game
 */
function init() {
    // Setup canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    ctx = canvas.getContext('2d');
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    // Initialize systems
    initRenderer(ctx);
    initInput();
    initUI();

    // Start the game
    startGame();
}

/**
 * Start a new game
 */
function startGame() {
    // Reset game state
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.kills = 0;
    gameState.startTime = performance.now();
    gameState.lastUpdate = performance.now();
    gameState.currentTime = performance.now();

    // Reset entities
    resetPlayer();
    clearEntities();

    // Reset spawn timers
    lastEnemySpawn = performance.now();
    lastProjectileSpawn = performance.now();
    currentSpawnInterval = CONFIG.enemy.initialSpawnInterval;

    // Reset difficulty
    difficultyMultipliers.speed = 1.0;
    difficultyMultipliers.damage = 1.0;
    difficultyMultipliers.hp = 1.0;

    // Start game loop
    requestAnimationFrame(gameLoop);
}

/**
 * Update difficulty based on elapsed time
 */
function updateDifficulty() {
    const timeInSeconds = (gameState.currentTime - gameState.startTime) / 1000;
    const timeInMinutes = timeInSeconds / 60;
    const difficultyLevel = Math.floor(timeInSeconds / CONFIG.difficulty.timePerReduction);

    // Calculate multipliers based on time
    difficultyMultipliers.speed = 1.0 + (timeInMinutes * CONFIG.difficulty.speedMultiplierPerMinute);
    difficultyMultipliers.damage = 1.0 + (timeInMinutes * CONFIG.difficulty.damageMultiplierPerMinute);
    difficultyMultipliers.hp = 1.0 + (timeInMinutes * CONFIG.difficulty.hpMultiplierPerMinute);

    // Aggressive spawn rate scaling (quadratic after 3 minutes)
    let spawnReduction;
    if (timeInMinutes <= 3) {
        spawnReduction = difficultyLevel * 50; // Linear for first 3 min
    } else {
        // Quadratic scaling after 3 min
        const excessTime = timeInMinutes - 3;
        spawnReduction = (6 * 50) + (excessTime * excessTime * 200);
    }

    currentSpawnInterval = Math.max(
        100,  // Minimum spawn interval: 10 enemies/sec
        CONFIG.enemy.initialSpawnInterval - spawnReduction
    );
}

/**
 * Update all game systems
 * @param {number} deltaTime - Time since last frame in seconds
 */
function update(deltaTime) {
    // Update player
    updatePlayer(deltaTime, gameState.camera);

    // Update enemies
    const playerDamaged = updateEnemies(deltaTime);

    // Update projectiles
    const killCount = updateProjectiles(deltaTime);
    gameState.kills += killCount;

    // Update difficulty
    updateDifficulty();

    // Update UI if needed
    if (playerDamaged || killCount > 0) {
        updateHP(player.hp);
        updateKills(gameState.kills);
    }

    // Check for game over
    if (player.hp <= 0) {
        endGame();
    }
}

/**
 * Spawn entities based on timers
 * @param {number} timestamp - Current timestamp
 */
function handleSpawning(timestamp) {
    // Spawn enemies
    if (timestamp - lastEnemySpawn > currentSpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }

    // Spawn projectiles
    if (timestamp - lastProjectileSpawn > CONFIG.projectile.interval) {
        spawnProjectile();
        lastProjectileSpawn = timestamp;
    }
}

/**
 * Render all game elements
 */
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // Draw background
    drawBackground(gameState.camera);

    // Draw entities
    enemies.forEach(enemy => drawEnemy(enemy, gameState.camera));
    projectiles.forEach(proj => drawProjectile(proj, gameState.camera));
    drawPlayer(player, gameState.camera);
}

/**
 * Main game loop
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function gameLoop(timestamp) {
    if (!gameState.isRunning) return;

    // Calculate delta time (capped at 0.1 seconds to prevent large jumps)
    const deltaTime = Math.min((timestamp - gameState.lastUpdate) / 1000, 0.1);
    gameState.lastUpdate = timestamp;
    gameState.currentTime = timestamp;

    // Update game logic
    update(deltaTime);

    // Handle spawning
    handleSpawning(timestamp);

    // Render
    render();

    // Update UI
    const elapsedTime = gameState.currentTime - gameState.startTime;
    updateTime(elapsedTime);

    // Continue loop
    requestAnimationFrame(gameLoop);
}

/**
 * End the game
 */
function endGame() {
    gameState.isRunning = false;
    const finalTime = gameState.currentTime - gameState.startTime;
    showGameOver(finalTime, gameState.kills);
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
