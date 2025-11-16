/**
 * Renderer Module
 * Handles all drawing and rendering operations
 */
import { CONFIG } from './config.js';

/**
 * Seeded random number generator for deterministic textures
 * @param {number} seed - Seed value
 * @returns {number} Random value between 0 and 1
 */
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Adjusts the brightness of a hex color
 * @param {string} color - Hex color code
 * @param {number} amount - Amount to adjust (-255 to 255)
 * @returns {string} Adjusted hex color
 */
function adjustBrightness(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/**
 * Creates a voxel/block texture with shading
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} screenX - Screen X position
 * @param {number} screenY - Screen Y position
 * @param {number} worldX - World X position (for texture consistency)
 * @param {number} worldY - World Y position (for texture consistency)
 * @param {number} size - Size of the voxel
 * @param {string} baseColor - Base hex color
 */
function createVoxelTexture(ctx, screenX, screenY, worldX, worldY, size, baseColor) {
    const colors = {
        base: baseColor,
        light: adjustBrightness(baseColor, 40),
        dark: adjustBrightness(baseColor, -40),
        darkest: adjustBrightness(baseColor, -60)
    };

    // Main face
    ctx.fillStyle = colors.base;
    ctx.fillRect(screenX, screenY, size, size);

    // Add pixel detail pattern for texture
    ctx.fillStyle = colors.light;
    for (let i = 0; i < size; i += 4) {
        for (let j = 0; j < size; j += 4) {
            const seed = (worldX + i) * 73856093 ^ (worldY + j) * 19349663;
            if (seededRandom(seed) > 0.6) {
                ctx.fillRect(screenX + i, screenY + j, 2, 2);
            }
        }
    }

    // Top highlight
    ctx.fillStyle = colors.light;
    ctx.fillRect(screenX, screenY, size, 3);

    // Left highlight
    ctx.fillRect(screenX, screenY, 3, size);

    // Bottom shadow
    ctx.fillStyle = colors.dark;
    ctx.fillRect(screenX, screenY + size - 3, size, 3);

    // Right shadow
    ctx.fillRect(screenX + size - 3, screenY, 3, size);

    // Corner highlights
    ctx.fillStyle = colors.darkest;
    ctx.fillRect(screenX + size - 3, screenY + size - 3, 3, 3);
}

/**
 * Draws the player character
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player object
 */
export function drawPlayer(ctx, player) {
    const screenX = (CONFIG.canvas.width - CONFIG.player.size) / 2;
    const screenY = (CONFIG.canvas.height - CONFIG.player.size) / 2;

    // Draw player as a voxel character head
    createVoxelTexture(ctx, screenX, screenY, player.worldX, player.worldY, CONFIG.player.size, CONFIG.player.color);

    // Add face details
    ctx.fillStyle = '#000';
    // Eyes
    ctx.fillRect(screenX + 8, screenY + 12, 4, 4);
    ctx.fillRect(screenX + 20, screenY + 12, 4, 4);
    // Mouth
    ctx.fillRect(screenX + 10, screenY + 22, 12, 2);
}

/**
 * Draws an enemy
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} enemy - Enemy object
 * @param {Object} camera - Camera position
 */
export function drawEnemy(ctx, enemy, camera) {
    const screenX = enemy.x - camera.x;
    const screenY = enemy.y - camera.y;

    // Only draw if on screen
    if (screenX < -50 || screenX > CONFIG.canvas.width + 50 ||
        screenY < -50 || screenY > CONFIG.canvas.height + 50) {
        return;
    }

    // Draw enemy as a zombie-like voxel
    createVoxelTexture(ctx, screenX, screenY, enemy.x, enemy.y, CONFIG.enemy.size, '#90cc90');

    // Add zombie face details
    ctx.fillStyle = '#000';
    // Eyes
    ctx.fillRect(screenX + 6, screenY + 10, 4, 4);
    ctx.fillRect(screenX + 18, screenY + 10, 4, 4);
    // Mouth
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX + 8, screenY + 18, 12, 4);
}

/**
 * Draws a projectile
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} projectile - Projectile object
 * @param {Object} camera - Camera position
 */
export function drawProjectile(ctx, projectile, camera) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;

    // Draw projectile as a glowing pixel block
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(screenX, screenY, CONFIG.projectile.size, CONFIG.projectile.size);

    // Add glow effect
    ctx.fillStyle = '#ffffaa';
    ctx.fillRect(screenX + 2, screenY + 2, 4, 4);

    // Outer glow
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 2, screenY - 2, CONFIG.projectile.size + 4, CONFIG.projectile.size + 4);
}

/**
 * Draws the tiled background
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} camera - Camera position
 */
export function drawBackground(ctx, camera) {
    const tileSize = 40;
    const startX = Math.floor(camera.x / tileSize) * tileSize;
    const startY = Math.floor(camera.y / tileSize) * tileSize;

    for (let x = startX; x < startX + CONFIG.canvas.width + tileSize; x += tileSize) {
        for (let y = startY; y < startY + CONFIG.canvas.height + tileSize; y += tileSize) {
            const screenX = x - camera.x;
            const screenY = y - camera.y;

            if (screenX > -tileSize && screenX < CONFIG.canvas.width &&
                screenY > -tileSize && screenY < CONFIG.canvas.height) {

                // Alternate grass colors for texture
                const baseColor = ((x / tileSize + y / tileSize) % 2 === 0) ? '#7cbd6e' : '#6ead5f';
                createVoxelTexture(ctx, screenX, screenY, x, y, tileSize, baseColor);
            }
        }
    }
}
