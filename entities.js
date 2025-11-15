/**
 * Entity Management
 * Manages player, enemies, and projectiles
 */

import { CONFIG } from './config.js';
import { getInputDirection } from './input.js';

// Game entities
export const player = {
    x: CONFIG.canvas.width / 2,
    y: CONFIG.canvas.height / 2,
    worldX: 0,
    worldY: 0,
    vx: 0,
    vy: 0,
    hp: CONFIG.player.maxHP,
    lastDamageTime: 0
};

export const enemies = [];
export const projectiles = [];

// Difficulty multipliers
export const difficultyMultipliers = {
    speed: 1.0,
    damage: 1.0,
    hp: 1.0
};

/**
 * Reset player to initial state
 */
export function resetPlayer() {
    player.x = CONFIG.canvas.width / 2;
    player.y = CONFIG.canvas.height / 2;
    player.worldX = 0;
    player.worldY = 0;
    player.vx = 0;
    player.vy = 0;
    player.hp = CONFIG.player.maxHP;
    player.lastDamageTime = 0;
}

/**
 * Update player position based on input
 * @param {number} deltaTime - Time since last frame
 * @param {{x: number, y: number}} camera - Camera position
 */
export function updatePlayer(deltaTime, camera) {
    const { dx, dy } = getInputDirection();

    // Update world position
    player.worldX += dx * CONFIG.player.speed * deltaTime;
    player.worldY += dy * CONFIG.player.speed * deltaTime;

    // Update camera to follow player (player stays centered)
    camera.x = player.worldX - CONFIG.canvas.width / 2 + CONFIG.player.size / 2;
    camera.y = player.worldY - CONFIG.canvas.height / 2 + CONFIG.player.size / 2;

    // Player screen position is always centered
    player.x = CONFIG.canvas.width / 2;
    player.y = CONFIG.canvas.height / 2;
}

/**
 * Spawn a new enemy off-screen
 */
export function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 400;

    // Apply HP multiplier based on difficulty
    const baseHP = 1;
    const scaledHP = Math.ceil(baseHP * difficultyMultipliers.hp);

    const enemy = {
        x: player.worldX + Math.cos(angle) * distance,
        y: player.worldY + Math.sin(angle) * distance,
        hp: scaledHP
    };

    enemies.push(enemy);
}

/**
 * Update all enemies
 * @param {number} deltaTime - Time since last frame
 * @returns {boolean} True if player was damaged
 */
export function updateEnemies(deltaTime) {
    let playerDamaged = false;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move toward player
        const dx = player.worldX - enemy.x;
        const dy = player.worldY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const scaledSpeed = CONFIG.enemy.speed * difficultyMultipliers.speed;
            enemy.x += (dx / distance) * scaledSpeed * deltaTime;
            enemy.y += (dy / distance) * scaledSpeed * deltaTime;
        }

        // Check collision with player
        if (checkCollision(
            enemy.x, enemy.y, CONFIG.enemy.size,
            player.worldX, player.worldY, CONFIG.player.size
        )) {
            const now = Date.now();
            if (now - player.lastDamageTime > CONFIG.enemy.damageInterval) {
                const scaledDamage = Math.ceil(CONFIG.enemy.damage * difficultyMultipliers.damage);
                player.hp -= scaledDamage;
                player.lastDamageTime = now;
                playerDamaged = true;
            }
        }
    }

    return playerDamaged;
}

/**
 * Spawn a projectile toward nearest enemy
 */
export function spawnProjectile() {
    // Find nearest enemy
    let nearestEnemy = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
        const dx = enemy.x - player.worldX;
        const dy = enemy.y - player.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    }

    // Determine angle
    let angle = Math.random() * Math.PI * 2;

    if (nearestEnemy) {
        const dx = nearestEnemy.x - player.worldX;
        const dy = nearestEnemy.y - player.worldY;
        angle = Math.atan2(dy, dx);
    }

    const projectile = {
        x: player.worldX + CONFIG.player.size / 2,
        y: player.worldY + CONFIG.player.size / 2,
        vx: Math.cos(angle) * CONFIG.projectile.speed,
        vy: Math.sin(angle) * CONFIG.projectile.speed
    };

    projectiles.push(projectile);
}

/**
 * Update all projectiles
 * @param {number} deltaTime - Time since last frame
 * @returns {number} Number of enemies killed
 */
export function updateProjectiles(deltaTime) {
    let killCount = 0;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        // Update position
        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Remove if too far from player
        const dx = proj.x - player.worldX;
        const dy = proj.y - player.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 600) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(
                proj.x, proj.y, CONFIG.projectile.size,
                enemy.x, enemy.y, CONFIG.enemy.size
            )) {
                // Damage enemy
                enemy.hp -= 1;

                // Remove projectile
                projectiles.splice(i, 1);

                // Remove enemy if dead
                if (enemy.hp <= 0) {
                    enemies.splice(j, 1);
                    killCount++;
                }
                break;
            }
        }
    }

    return killCount;
}

/**
 * Clear all enemies and projectiles
 */
export function clearEntities() {
    enemies.length = 0;
    projectiles.length = 0;
}

/**
 * Check AABB collision between two rectangles
 * @param {number} x1 - First rect X
 * @param {number} y1 - First rect Y
 * @param {number} size1 - First rect size
 * @param {number} x2 - Second rect X
 * @param {number} y2 - Second rect Y
 * @param {number} size2 - Second rect size
 * @returns {boolean} True if collision detected
 */
function checkCollision(x1, y1, size1, x2, y2, size2) {
    return x1 < x2 + size2 &&
           x1 + size1 > x2 &&
           y1 < y2 + size2 &&
           y1 + size1 > y2;
}
