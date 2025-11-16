/**
 * Game Module
 * Core game logic and state management
 */
import { CONFIG } from './config.js';
import { drawPlayer, drawEnemy, drawProjectile, drawBackground } from './renderer.js';

/**
 * Main Game class
 */
export class Game {
    constructor(canvas, inputManager, uiManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputManager = inputManager;
        this.uiManager = uiManager;

        // Game state
        this.state = {
            isRunning: false,
            isPaused: false,
            startTime: 0,
            currentTime: 0,
            kills: 0,
            lastUpdate: 0,
            camera: { x: 0, y: 0 }
        };

        // Player state
        this.player = {
            x: CONFIG.canvas.width / 2,
            y: CONFIG.canvas.height / 2,
            worldX: 0,
            worldY: 0,
            vx: 0,
            vy: 0,
            hp: CONFIG.player.maxHP,
            lastDamageTime: 0
        };

        // Game entities
        this.enemies = [];
        this.projectiles = [];

        // Spawn timing
        this.lastEnemySpawn = 0;
        this.lastProjectileSpawn = 0;
        this.currentSpawnInterval = CONFIG.enemy.initialSpawnInterval;

        // Difficulty multipliers
        this.difficultyMultipliers = {
            speed: 1.0,
            damage: 1.0,
            hp: 1.0
        };
    }

    /**
     * Initialize and start the game
     */
    start() {
        this.state.isRunning = true;
        this.state.startTime = performance.now();
        this.state.lastUpdate = performance.now();
        this.state.currentTime = performance.now();

        this.lastEnemySpawn = performance.now();
        this.lastProjectileSpawn = performance.now();

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        if (!this.state.isRunning) return;

        const deltaTime = Math.min((timestamp - this.state.lastUpdate) / 1000, 0.1);
        this.state.lastUpdate = timestamp;
        this.state.currentTime = timestamp;

        // Update game logic
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateDifficulty();

        // Spawn entities
        if (timestamp - this.lastEnemySpawn > this.currentSpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = timestamp;
        }

        if (timestamp - this.lastProjectileSpawn > CONFIG.projectile.interval) {
            this.spawnProjectile();
            this.lastProjectileSpawn = timestamp;
        }

        // Render
        this.render();

        // Update UI
        this.uiManager.updateAll(this.state, this.player);

        // Continue loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Update player position based on input
     */
    updatePlayer(deltaTime) {
        const movement = this.inputManager.getMovementDirection();

        // Update position
        this.player.worldX += movement.dx * CONFIG.player.speed * deltaTime;
        this.player.worldY += movement.dy * CONFIG.player.speed * deltaTime;

        // Update camera to follow player
        this.state.camera.x = this.player.worldX - CONFIG.canvas.width / 2 + CONFIG.player.size / 2;
        this.state.camera.y = this.player.worldY - CONFIG.canvas.height / 2 + CONFIG.player.size / 2;

        // Player screen position is always centered
        this.player.x = CONFIG.canvas.width / 2;
        this.player.y = CONFIG.canvas.height / 2;
    }

    /**
     * Spawn a new enemy
     */
    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 400;

        const baseHP = 1;
        const scaledHP = Math.ceil(baseHP * this.difficultyMultipliers.hp);

        const enemy = {
            x: this.player.worldX + Math.cos(angle) * distance,
            y: this.player.worldY + Math.sin(angle) * distance,
            hp: scaledHP
        };

        this.enemies.push(enemy);
    }

    /**
     * Update all enemies
     */
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Move toward player
            const dx = this.player.worldX - enemy.x;
            const dy = this.player.worldY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const scaledSpeed = CONFIG.enemy.speed * this.difficultyMultipliers.speed;
                enemy.x += (dx / distance) * scaledSpeed * deltaTime;
                enemy.y += (dy / distance) * scaledSpeed * deltaTime;
            }

            // Check collision with player
            if (this.checkCollision(
                enemy.x, enemy.y, CONFIG.enemy.size,
                this.player.worldX, this.player.worldY, CONFIG.player.size
            )) {
                this.damagePlayer();
            }
        }
    }

    /**
     * Damage the player
     */
    damagePlayer() {
        const now = Date.now();
        if (now - this.player.lastDamageTime > CONFIG.enemy.damageInterval) {
            const scaledDamage = Math.ceil(CONFIG.enemy.damage * this.difficultyMultipliers.damage);
            this.player.hp -= scaledDamage;
            this.player.lastDamageTime = now;

            if (this.player.hp <= 0) {
                this.gameOver();
            }
        }
    }

    /**
     * Spawn a projectile toward nearest enemy
     */
    spawnProjectile() {
        let nearestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of this.enemies) {
            const dx = enemy.x - this.player.worldX;
            const dy = enemy.y - this.player.worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        // Default to random direction if no enemy
        let angle = Math.random() * Math.PI * 2;

        if (nearestEnemy) {
            const dx = nearestEnemy.x - this.player.worldX;
            const dy = nearestEnemy.y - this.player.worldY;
            angle = Math.atan2(dy, dx);
        }

        const projectile = {
            x: this.player.worldX + CONFIG.player.size / 2,
            y: this.player.worldY + CONFIG.player.size / 2,
            vx: Math.cos(angle) * CONFIG.projectile.speed,
            vy: Math.sin(angle) * CONFIG.projectile.speed
        };

        this.projectiles.push(projectile);
    }

    /**
     * Update all projectiles
     */
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            proj.x += proj.vx * deltaTime;
            proj.y += proj.vy * deltaTime;

            // Remove if too far from player
            const dx = proj.x - this.player.worldX;
            const dy = proj.y - this.player.worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 600) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(
                    proj.x, proj.y, CONFIG.projectile.size,
                    enemy.x, enemy.y, CONFIG.enemy.size
                )) {
                    // Damage enemy
                    enemy.hp -= 1;

                    // Remove projectile
                    this.projectiles.splice(i, 1);

                    // Remove enemy if dead
                    if (enemy.hp <= 0) {
                        this.enemies.splice(j, 1);
                        this.state.kills++;
                    }
                    break;
                }
            }
        }
    }

    /**
     * Check collision between two rectangles
     */
    checkCollision(x1, y1, size1, x2, y2, size2) {
        return x1 < x2 + size2 &&
               x1 + size1 > x2 &&
               y1 < y2 + size2 &&
               y1 + size1 > y2;
    }

    /**
     * Update difficulty based on time
     */
    updateDifficulty() {
        const timeInSeconds = (this.state.currentTime - this.state.startTime) / 1000;
        const timeInMinutes = timeInSeconds / 60;

        // Continuous scaling
        this.difficultyMultipliers.speed = 1.0 + (timeInMinutes * CONFIG.difficulty.speedMultiplierPerMinute);
        this.difficultyMultipliers.damage = 1.0 + (timeInMinutes * CONFIG.difficulty.damageMultiplierPerMinute);
        this.difficultyMultipliers.hp = 1.0 + (timeInMinutes * CONFIG.difficulty.hpMultiplierPerMinute);

        // Quadratic spawn rate scaling
        const spawnReduction = timeInMinutes * timeInMinutes * CONFIG.difficulty.spawnQuadraticFactor;

        this.currentSpawnInterval = Math.max(
            100,
            CONFIG.enemy.initialSpawnInterval - spawnReduction
        );
    }

    /**
     * Render all game elements
     */
    render() {
        this.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        drawBackground(this.ctx, this.state.camera);

        this.enemies.forEach(enemy => drawEnemy(this.ctx, enemy, this.state.camera));
        this.projectiles.forEach(proj => drawProjectile(this.ctx, proj, this.state.camera));

        drawPlayer(this.ctx, this.player);
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.state.isRunning = false;
        this.uiManager.showGameOver(this.state.startTime, this.state.currentTime, this.state.kills);
    }
}
