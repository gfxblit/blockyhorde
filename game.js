/**
 * Game Module
 * Core game logic and state management
 */
import { CONFIG } from './config.js';
import { drawPlayer, drawEnemy, drawProjectile, drawBackground, drawExplosion, drawItem, drawOffScreenItemIndicators, drawExpandingRing } from './renderer.js';
import audioManager from './audio.js';

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

        // Boss tracking
        this.bossSpawned = false;
        this.currentBossLevel = 0;

        // Player state
        this.player = {
            x: CONFIG.canvas.width / 2,
            y: CONFIG.canvas.height / 2,
            worldX: 0,
            worldY: 0,
            vx: 0,
            vy: 0,
            hp: CONFIG.player.maxHP,
            lastDamageTime: 0,
            damageTintAlpha: 0,
            buffs: {
                attackSpeed: {
                    stacks: 0,
                    expirationTime: 0
                },
                damage: {
                    stacks: 0,
                    expirationTime: 0
                },
                speed: {
                    stacks: 0,
                    expirationTime: 0
                }
            }
        };

        // Game entities
        this.enemies = [];
        this.projectiles = [];
        this.explosions = []; // Visual explosion effects
        this.items = []; // Dropped items
        this.expandingRings = []; // Active expanding ring abilities

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
        this.lastDifficultyLevel = 0;

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
        this.updateExpandingRings(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateItems(timestamp);
        this.updateDifficulty();
        this.updateAbilities(timestamp);

        // Fade out damage tint
        if (this.player.damageTintAlpha > 0) {
            this.player.damageTintAlpha = Math.max(0, this.player.damageTintAlpha - deltaTime * CONFIG.player.damageTintFadeSpeed);
        }

        // Check for ability input
        if (this.inputManager.isAbilityPressed()) {
            if (this.abilities.ghastFireball) {
                this.useGhastFireball();
            } else if (this.abilities.explodingRing) {
                this.useExplodingRing();
            } else if (this.abilities.heal) {
                this.useHeal();
            }
        }

        // Spawn entities
        if (timestamp - this.lastEnemySpawn > this.currentSpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = timestamp;
        }

        // Calculate modified projectile interval based on attack speed buffs
        const attackSpeedReduction = this.player.buffs.attackSpeed.stacks * CONFIG.items.types.attackSpeed.speedReduction;
        const modifiedInterval = Math.max(50, CONFIG.projectile.interval - attackSpeedReduction);

        if (timestamp - this.lastProjectileSpawn > modifiedInterval) {
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

        // Calculate modified speed based on speed buffs
        const speedBonus = this.player.buffs.speed.stacks * CONFIG.items.types.speed.speedBonus;
        const totalSpeed = CONFIG.player.speed + speedBonus;

        // Update position
        this.player.worldX += movement.dx * totalSpeed * deltaTime;
        this.player.worldY += movement.dy * totalSpeed * deltaTime;

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
            type: 'regular',
            x: this.player.worldX + Math.cos(angle) * distance,
            y: this.player.worldY + Math.sin(angle) * distance,
            hp: scaledHP,
            maxHP: scaledHP
        };

        this.enemies.push(enemy);
    }

    /**
     * Spawn a boss enemy
     */
    spawnBoss() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 450; // Spawn slightly farther out

        const baseHP = CONFIG.boss.health;
        const scaledHP = Math.ceil(baseHP * this.difficultyMultipliers.hp);

        const boss = {
            type: 'boss',
            x: this.player.worldX + Math.cos(angle) * distance,
            y: this.player.worldY + Math.sin(angle) * distance,
            hp: scaledHP,
            maxHP: scaledHP,
            lastProjectileTime: 0
        };

        this.enemies.push(boss);
        this.bossSpawned = true;

        // Play boss spawn sound
        audioManager.playBossSpawn();
    }

    /**
     * Update all enemies
     */
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Determine enemy properties based on type
            const isBoss = enemy.type === 'boss';
            const enemySpeed = isBoss ? CONFIG.boss.speed : CONFIG.enemy.speed;
            const enemySize = isBoss ? CONFIG.boss.size : CONFIG.enemy.size;

            // Move toward player
            const dx = this.player.worldX - enemy.x;
            const dy = this.player.worldY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const scaledSpeed = enemySpeed * this.difficultyMultipliers.speed;
                enemy.x += (dx / distance) * scaledSpeed * deltaTime;
                enemy.y += (dy / distance) * scaledSpeed * deltaTime;
            }

            // Boss projectile firing
            if (isBoss) {
                const now = this.state.currentTime;
                if (now - enemy.lastProjectileTime > CONFIG.boss.projectileInterval) {
                    this.spawnBossProjectile(enemy);
                    enemy.lastProjectileTime = now;
                }
            }

            // Check collision with player
            if (this.checkCollision(
                enemy.x, enemy.y, enemySize,
                this.player.worldX, this.player.worldY, CONFIG.player.size
            )) {
                this.damagePlayer(isBoss);
            }
        }
    }

    /**
     * Spawn a projectile from a boss toward the player
     */
    spawnBossProjectile(boss) {
        const dx = this.player.worldX - boss.x;
        const dy = this.player.worldY - boss.y;
        const angle = Math.atan2(dy, dx);

        const projectile = {
            type: 'bossProjectile',
            x: boss.x + CONFIG.boss.size / 2,
            y: boss.y + CONFIG.boss.size / 2,
            vx: Math.cos(angle) * CONFIG.boss.projectileSpeed,
            vy: Math.sin(angle) * CONFIG.boss.projectileSpeed,
            damage: CONFIG.boss.projectileDamage,
            size: CONFIG.boss.projectileSize
        };

        this.projectiles.push(projectile);

        // Play boss projectile sound (reuse shoot sound with slight variation effect)
        audioManager.playShoot();
    }

    /**
     * Damage the player
     */
    damagePlayer(isBoss = false) {
        const now = Date.now();
        const damageInterval = isBoss ? CONFIG.boss.damageInterval : CONFIG.enemy.damageInterval;

        if (now - this.player.lastDamageTime > damageInterval) {
            const baseDamage = isBoss ? CONFIG.boss.damage : CONFIG.enemy.damage;
            const scaledDamage = Math.ceil(baseDamage * this.difficultyMultipliers.damage);
            this.player.hp -= scaledDamage;
            this.player.lastDamageTime = now;

            // Trigger damage tint effect
            this.player.damageTintAlpha = CONFIG.player.damageTintAlpha;

            // Play player hit sound
            audioManager.playPlayerHit();

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

        // Calculate modified damage based on damage buffs
        const baseDamage = 1;
        const damageBonus = this.player.buffs.damage.stacks * CONFIG.items.types.damage.damageBonus;
        const totalDamage = baseDamage + damageBonus;

        const projectile = {
            type: 'regular',
            x: this.player.worldX + CONFIG.player.size / 2,
            y: this.player.worldY + CONFIG.player.size / 2,
            vx: Math.cos(angle) * CONFIG.projectile.speed,
            vy: Math.sin(angle) * CONFIG.projectile.speed,
            damage: totalDamage,
            size: CONFIG.projectile.size
        };

        this.projectiles.push(projectile);

        // Play shoot sound
        audioManager.playShoot();
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

            // Handle boss projectiles hitting the player
            if (proj.type === 'bossProjectile') {
                if (this.checkCollision(
                    proj.x, proj.y, proj.size,
                    this.player.worldX, this.player.worldY, CONFIG.player.size
                )) {
                    this.player.hp -= proj.damage;
                    this.projectiles.splice(i, 1);

                    // Trigger damage tint effect
                    this.player.damageTintAlpha = CONFIG.player.damageTintAlpha;

                    if (this.player.hp <= 0) {
                        this.gameOver();
                    }
                    continue;
                }
            } else {
                // Check collision with enemies (for player projectiles)
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const enemySize = enemy.type === 'boss' ? CONFIG.boss.size : CONFIG.enemy.size;

                    if (this.checkCollision(
                        proj.x, proj.y, proj.size,
                        enemy.x, enemy.y, enemySize
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

                            // Check if enemy died
                            const enemyDied = enemy.hp <= 0;
                            const isBossEnemy = enemy.type === 'boss';

                            // Remove enemy if dead
                            if (enemyDied) {
                                this.dropItem(enemy.x, enemy.y);
                                this.enemies.splice(j, 1);
                                this.state.kills++;

                                // Play appropriate death sound
                                if (isBossEnemy) {
                                    audioManager.playBossDeath();
                                    this.handleBossDefeat();
                                } else {
                                    audioManager.playEnemyHit();
                                }
                            } else {
                                // Enemy was hit but not killed
                                audioManager.playEnemyHit();
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Update expanding ring abilities
     */
    updateExpandingRings(deltaTime) {
        for (let i = this.expandingRings.length - 1; i >= 0; i--) {
            const ring = this.expandingRings[i];

            // Expand the ring
            ring.currentRadius += ring.expansionSpeed * deltaTime;

            // Check collision with enemies
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];

                // Skip if already hit by this ring
                if (ring.hitEnemies.has(enemy)) continue;

                // Calculate distance from ring center to enemy
                const dx = enemy.x - ring.x;
                const dy = enemy.y - ring.y;
                const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);

                // Check if enemy is within the ring (within the ring width)
                const innerRadius = ring.currentRadius - ring.ringWidth;
                const outerRadius = ring.currentRadius;

                if (distanceToEnemy >= innerRadius && distanceToEnemy <= outerRadius) {
                    // Hit the enemy
                    enemy.hp -= ring.damage;
                    ring.hitEnemies.add(enemy);

                    // Check if enemy died
                    if (enemy.hp <= 0) {
                        const isBoss = enemy.type === 'boss';
                        this.dropItem(enemy.x, enemy.y);
                        this.enemies.splice(j, 1);
                        this.state.kills++;

                        if (isBoss) {
                            audioManager.playBossDeath();
                            this.handleBossDefeat();
                        } else {
                            audioManager.playEnemyHit();
                        }

                        j--; // Adjust index after removal
                    } else {
                        audioManager.playEnemyHit();
                    }
                }
            }

            // Remove ring if it has reached maximum radius
            if (ring.currentRadius >= ring.maxRadius) {
                this.expandingRings.splice(i, 1);
            }
        }
    }

    /**
     * Update explosion visual effects
     */
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.elapsed += deltaTime;

            // Expand the explosion radius over time
            const progress = explosion.elapsed / explosion.duration;
            explosion.radius = explosion.maxRadius * Math.min(progress, 1);

            // Remove expired explosions
            if (explosion.elapsed >= explosion.duration) {
                this.explosions.splice(i, 1);
            }
        }
    }

    /**
     * Apply Ghast Fireball explosion damage
     */
    applyGhastFireballExplosion(explosionX, explosionY, baseDamage, radius) {
        // Create visual explosion effect
        this.explosions.push({
            x: explosionX,
            y: explosionY,
            radius: 0,
            maxRadius: radius,
            duration: 0.5, // 500ms animation
            elapsed: 0
        });

        // Play explosion sound immediately on impact
        audioManager.playExplosion();

        let enemiesHit = 0;
        let bossKilled = false;

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
                enemiesHit++;

                // Remove enemy if dead
                if (enemy.hp <= 0) {
                    if (enemy.type === 'boss') {
                        bossKilled = true;
                    }
                    this.dropItem(enemy.x, enemy.y);
                    this.enemies.splice(i, 1);
                    this.state.kills++;
                }
            }
        }

        // Play additional sound effects for enemy deaths
        if (enemiesHit > 0) {
            if (bossKilled) {
                audioManager.playBossDeath();
                this.handleBossDefeat();
            } else {
                audioManager.playEnemyHit();
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
        // Update the active ability (only one can be active at a time)
        const ability = this.abilities.ghastFireball || this.abilities.explodingRing || this.abilities.heal;

        if (!ability) return;

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

        // Play fireball sound
        audioManager.playFireball();
    }

    /**
     * Try to use the Exploding Ring ability
     */
    useExplodingRing() {
        const ability = this.abilities.explodingRing;

        // Check if ability is available
        if (ability.currentCharges <= 0) {
            return false;
        }

        // Consume a charge
        ability.currentCharges--;
        ability.lastUsedTime = this.state.currentTime;

        // Spawn the expanding ring
        this.spawnExplodingRing();

        return true;
    }

    /**
     * Spawn an Exploding Ring
     */
    spawnExplodingRing() {
        const ability = this.abilities.explodingRing;
        const config = CONFIG.explodingRing;

        const ring = {
            x: this.player.worldX + CONFIG.player.size / 2,
            y: this.player.worldY + CONFIG.player.size / 2,
            currentRadius: ability.baseRadius,
            maxRadius: ability.maxRadius,
            expansionSpeed: ability.expansionSpeed,
            damage: config.baseDamage * (ability.damageMultiplier || 1),
            color: config.color,
            ringWidth: config.ringWidth,
            hitEnemies: new Set() // Track which enemies have been hit
        };

        this.expandingRings.push(ring);

        // Play ability sound (using fireball sound for now)
        audioManager.playFireball();
    }

    /**
     * Try to use the Heal ability
     */
    useHeal() {
        const ability = this.abilities.heal;

        // Check if ability is available
        if (ability.currentCharges <= 0) {
            return false;
        }

        // Consume a charge
        ability.currentCharges--;
        ability.lastUsedTime = this.state.currentTime;

        // Apply healing
        this.applyHeal();

        return true;
    }

    /**
     * Apply healing to the player
     */
    applyHeal() {
        const ability = this.abilities.heal;
        const config = CONFIG.heal;

        const healAmount = config.healAmount * (ability.healMultiplier || 1);
        this.player.hp = Math.min(CONFIG.player.maxHP, this.player.hp + healAmount);

        // Play ability sound (using fireball sound for now)
        audioManager.playFireball();

        // Visual feedback: reduce damage tint (reverse of damage effect)
        this.player.damageTintAlpha = 0;
    }

    /**
     * Drop an item at enemy death location
     */
    dropItem(x, y) {
        // Check drop rate
        if (Math.random() > CONFIG.items.dropRate) {
            return;
        }

        // Randomly choose item type (equal chance between all item types)
        const itemTypes = ['attackSpeed', 'damage', 'speed', 'health'];
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        const item = {
            type: itemType,
            x: x + CONFIG.enemy.size / 2 - CONFIG.items.size / 2,
            y: y + CONFIG.enemy.size / 2 - CONFIG.items.size / 2,
            spawnTime: this.state.currentTime
        };

        this.items.push(item);
    }

    /**
     * Update items - handle pickup and despawn
     */
    updateItems(timestamp) {
        // Update buff expiration for items with finite durations
        for (const buffType in this.player.buffs) {
            const buff = this.player.buffs[buffType];
            if (buff.stacks > 0 && Number.isFinite(buff.expirationTime) && timestamp >= buff.expirationTime) {
                buff.stacks = 0;
            }
        }

        // Check for item pickup and despawn
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            // Check if item should despawn
            if (timestamp - item.spawnTime > CONFIG.items.despawnTime) {
                this.items.splice(i, 1);
                continue;
            }

            // Check for pickup (magnet radius)
            const dx = item.x + CONFIG.items.size / 2 - (this.player.worldX + CONFIG.player.size / 2);
            const dy = item.y + CONFIG.items.size / 2 - (this.player.worldY + CONFIG.player.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CONFIG.items.magnetRadius) {
                this.pickupItem(item, timestamp);
                this.items.splice(i, 1);
            }
        }
    }

    /**
     * Apply item effect to player
     */
    pickupItem(item, timestamp) {
        const itemConfig = CONFIG.items.types[item.type];

        // Play item pickup sound
        audioManager.playItemPickup();

        // Handle health items separately (instant heal, no buff)
        if (item.type === 'health') {
            const healAmount = Math.min(itemConfig.healthRestore, CONFIG.player.maxHP - this.player.hp);
            this.player.hp = Math.min(this.player.hp + itemConfig.healthRestore, CONFIG.player.maxHP);

            // Show UI notification with actual heal amount
            this.uiManager.showItemPickup(item.type, healAmount);
            return;
        }

        const buff = this.player.buffs[item.type];

        if (itemConfig.stackable && buff.stacks < itemConfig.maxStacks) {
            buff.stacks++;
        } else if (!itemConfig.stackable) {
            buff.stacks = 1;
        }

        // Reset/extend buff duration
        buff.expirationTime = timestamp + itemConfig.duration;

        // Show UI notification
        this.uiManager.showItemPickup(item.type, buff.stacks);
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

        // Check if we've reached a new difficulty level (based on timePerReduction config)
        const currentDifficultyLevel = Math.floor(timeInSeconds / CONFIG.difficulty.timePerReduction);
        if (currentDifficultyLevel > this.lastDifficultyLevel && currentDifficultyLevel > 0) {
            this.lastDifficultyLevel = currentDifficultyLevel;
            this.uiManager.showDifficultyNotification(currentDifficultyLevel, this.difficultyMultipliers);

            // Play level up sound
            audioManager.playLevelUp();

            // Spawn boss every 2 levels
            if (currentDifficultyLevel % 2 === 0 && !this.bossSpawned) {
                this.spawnBoss();
                this.currentBossLevel = currentDifficultyLevel;
            }
        }
    }

    /**
     * Render all game elements
     */
    render() {
        this.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        drawBackground(this.ctx, this.state.camera);

        this.items.forEach(item => drawItem(this.ctx, item, this.state.camera));
        this.enemies.forEach(enemy => drawEnemy(this.ctx, enemy, this.state.camera));
        this.projectiles.forEach(proj => drawProjectile(this.ctx, proj, this.state.camera));
        this.explosions.forEach(explosion => drawExplosion(this.ctx, explosion, this.state.camera));
        this.expandingRings.forEach(ring => drawExpandingRing(this.ctx, ring, this.state.camera));

        drawPlayer(this.ctx, this.player);

        // Draw off-screen item indicators on top of everything
        drawOffScreenItemIndicators(this.ctx, this.items, this.state.camera);

        // Draw damage tint overlay
        if (this.player.damageTintAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.player.damageTintAlpha})`;
            this.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        }
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.state.isRunning = false;

        // Play game over sound
        audioManager.playGameOver();

        this.uiManager.showGameOver(this.state.startTime, this.state.currentTime, this.state.kills);
    }

    /**
     * Handle boss defeat - pause game and show upgrade selection
     */
    handleBossDefeat() {
        // Pause the game
        this.state.isRunning = false;

        // Reset boss flag so it can spawn again
        this.bossSpawned = false;

        // Get current ability (for now we only support one active ability)
        const currentAbility = this.abilities.ghastFireball || this.abilities.explodingRing || this.abilities.heal;
        currentAbility.name = this.getCurrentAbilityName();

        // Available abilities to choose from
        const availableAbilities = ['ghastFireball', 'explodingRing', 'heal'];

        // Show upgrade selection UI
        this.uiManager.showUpgradeSelection(currentAbility, availableAbilities, (type, abilityKey) => {
            if (type === 'upgrade') {
                this.applyAbilityUpgrade(abilityKey);
            } else {
                this.switchToNewAbility(abilityKey);
            }

            // Resume the game
            this.state.isRunning = true;
        });
    }

    /**
     * Get the name of the current active ability
     */
    getCurrentAbilityName() {
        if (this.abilities.ghastFireball) {
            return CONFIG.ghastFireball.name;
        } else if (this.abilities.explodingRing) {
            return CONFIG.explodingRing.name;
        } else if (this.abilities.heal) {
            return CONFIG.heal.name;
        }
        return '';
    }

    /**
     * Apply upgrade to existing ability
     * @param {string} abilityKey - The ability to upgrade (e.g., 'ghastFireball')
     */
    applyAbilityUpgrade(abilityKey) {
        const ability = this.abilities[abilityKey];
        if (!ability) return;

        const config = CONFIG[abilityKey];
        const nextLevel = ability.level + 1;

        if (nextLevel > 5) return; // Max level

        const upgrade = config.upgrades[`level${nextLevel}`];
        if (!upgrade) return;

        // Apply upgrades based on the config
        if (upgrade.cooldownReduction) {
            ability.cooldownDuration *= (1 - upgrade.cooldownReduction);
        }

        if (upgrade.sizeIncrease) {
            ability.size *= (1 + upgrade.sizeIncrease);
        }

        if (upgrade.radiusIncrease) {
            ability.maxRadius = (ability.maxRadius || config.maxRadius) * (1 + upgrade.radiusIncrease);
        }

        if (upgrade.damageMultiplier) {
            ability.damageMultiplier = (ability.damageMultiplier || 1) * upgrade.damageMultiplier;
        }

        if (upgrade.maxCharges !== undefined) {
            ability.maxCharges = upgrade.maxCharges;
            ability.currentCharges = upgrade.maxCharges;
        }

        if (upgrade.healIncrease) {
            ability.healMultiplier = (ability.healMultiplier || 1) * (1 + upgrade.healIncrease);
        }

        if (upgrade.maxHPBonus) {
            this.player.hp += upgrade.maxHPBonus;
            CONFIG.player.maxHP += upgrade.maxHPBonus;
        }

        // Increment level
        ability.level = nextLevel;

        console.log(`Upgraded ${abilityKey} to level ${nextLevel}`);
    }

    /**
     * Switch to a new ability
     * @param {string} abilityKey - The new ability to switch to (e.g., 'explodingRing')
     */
    switchToNewAbility(abilityKey) {
        // Clear all existing abilities
        this.abilities = {};

        // Initialize the new ability
        this.initializeAbility(abilityKey);

        console.log(`Switched to new ability: ${abilityKey}`);
    }

    /**
     * Initialize an ability with default values from config
     * @param {string} abilityKey - The ability to initialize
     */
    initializeAbility(abilityKey) {
        const config = CONFIG[abilityKey];
        if (!config) return;

        if (abilityKey === 'ghastFireball') {
            this.abilities.ghastFireball = {
                level: 1,
                maxCharges: config.maxCharges,
                currentCharges: config.maxCharges,
                lastUsedTime: 0,
                cooldownDuration: config.cooldown,
                size: config.size,
                splashRadius: config.splashRadius
            };
        } else if (abilityKey === 'explodingRing') {
            this.abilities.explodingRing = {
                level: 1,
                maxCharges: config.maxCharges,
                currentCharges: config.maxCharges,
                lastUsedTime: 0,
                cooldownDuration: config.cooldown,
                baseRadius: config.baseRadius,
                maxRadius: config.maxRadius,
                expansionSpeed: config.expansionSpeed
            };
        } else if (abilityKey === 'heal') {
            this.abilities.heal = {
                level: 1,
                maxCharges: config.maxCharges,
                currentCharges: config.maxCharges,
                lastUsedTime: 0,
                cooldownDuration: config.cooldown,
                healMultiplier: 1
            };
        }
    }
}
