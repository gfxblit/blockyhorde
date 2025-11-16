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

        // Active abilities
        this.abilities = {
            ghastFireball: {
                level: 1,
                maxCharges: CONFIG.ghastFireball.maxCharges,
                currentCharges: CONFIG.ghastFireball.maxCharges,
                lastUsedTime: 0,
                cooldownDuration: CONFIG.ghastFireball.cooldown,
                size: CONFIG.ghastFireball.size,
                splashRadius: CONFIG.ghastFireball.splashRadius
            }
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
        this.updateAbilities(timestamp);

        // Check for ability input
        if (this.inputManager.isAbilityPressed()) {
            this.useGhastFireball();
        }

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
        this.uiManager.updateAll(this.state, this.player, this.abilities);

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
            type: 'regular',
            x: this.player.worldX + CONFIG.player.size / 2,
            y: this.player.worldY + CONFIG.player.size / 2,
            vx: Math.cos(angle) * CONFIG.projectile.speed,
            vy: Math.sin(angle) * CONFIG.projectile.speed,
            damage: 1,
            size: CONFIG.projectile.size
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
                    proj.x, proj.y, proj.size,
                    enemy.x, enemy.y, CONFIG.enemy.size
                )) {
                    // Handle Ghast Fireball differently
                    if (proj.type === 'ghastFireball') {
                        // Apply splash damage to all enemies in radius
                        this.applyGhastFireballExplosion(proj.x, proj.y, proj.damage, proj.splashRadius);

                        // Remove projectile
                        this.projectiles.splice(i, 1);
                        break;
                    } else {
                        // Regular projectile behavior
                        enemy.hp -= proj.damage;

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
    }

    /**
     * Apply Ghast Fireball explosion damage
     */
    applyGhastFireballExplosion(explosionX, explosionY, baseDamage, radius) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = enemy.x + CONFIG.enemy.size / 2 - explosionX;
            const dy = enemy.y + CONFIG.enemy.size / 2 - explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if enemy is in explosion radius
            if (distance <= radius) {
                // Direct hit gets full damage, splash gets 50%
                const isDirectHit = this.checkCollision(
                    explosionX, explosionY, CONFIG.ghastFireball.size,
                    enemy.x, enemy.y, CONFIG.enemy.size
                );

                const damage = isDirectHit ? baseDamage : baseDamage * CONFIG.ghastFireball.splashDamageMultiplier;

                enemy.hp -= damage;

                // Remove enemy if dead
                if (enemy.hp <= 0) {
                    this.enemies.splice(i, 1);
                    this.state.kills++;
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
     * Update ability cooldowns and recharge
     */
    updateAbilities(timestamp) {
        const ability = this.abilities.ghastFireball;

        // If not at max charges, recharge over time
        if (ability.currentCharges < ability.maxCharges) {
            const timeSinceLastUse = timestamp - ability.lastUsedTime;
            if (timeSinceLastUse >= ability.cooldownDuration) {
                ability.currentCharges = Math.min(ability.maxCharges, ability.currentCharges + 1);
                ability.lastUsedTime = timestamp;
            }
        }
    }

    /**
     * Try to use the Ghast Fireball ability
     */
    useGhastFireball() {
        const ability = this.abilities.ghastFireball;

        // Check if ability is available
        if (ability.currentCharges <= 0) {
            return false;
        }

        // Consume a charge
        ability.currentCharges--;
        ability.lastUsedTime = this.state.currentTime;

        // Spawn the ghast fireball
        this.spawnGhastFireball();

        return true;
    }

    /**
     * Spawn a Ghast Fireball projectile
     */
    spawnGhastFireball() {
        const movement = this.inputManager.getMovementDirection();
        let angle;

        // Priority 1: Player is moving - shoot in movement direction
        if (movement.dx !== 0 || movement.dy !== 0) {
            angle = Math.atan2(movement.dy, movement.dx);
        }
        // Priority 2: Mouse position (would need to be implemented)
        // Priority 3: Nearest elite enemy (fallback to nearest enemy for now)
        else {
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

            if (nearestEnemy) {
                const dx = nearestEnemy.x - this.player.worldX;
                const dy = nearestEnemy.y - this.player.worldY;
                angle = Math.atan2(dy, dx);
            } else {
                // No enemies, shoot right
                angle = 0;
            }
        }

        const ability = this.abilities.ghastFireball;
        const projectile = {
            type: 'ghastFireball',
            x: this.player.worldX + CONFIG.player.size / 2,
            y: this.player.worldY + CONFIG.player.size / 2,
            vx: Math.cos(angle) * CONFIG.ghastFireball.speed,
            vy: Math.sin(angle) * CONFIG.ghastFireball.speed,
            damage: CONFIG.ghastFireball.baseDamage,
            size: ability.size,
            splashRadius: ability.splashRadius
        };

        this.projectiles.push(projectile);
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
