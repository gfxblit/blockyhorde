/**
 * Renderer
 * Handles all drawing and visual effects
 */

import { CONFIG } from './config.js';

let ctx = null;

/**
 * Initialize renderer with canvas context
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 */
export function initRenderer(context) {
    ctx = context;
}

/**
 * Draw the tiled grass background
 * @param {{x: number, y: number}} camera - Camera position
 */
export function drawBackground(camera) {
    const tileSize = 40;
    const startX = Math.floor(camera.x / tileSize) * tileSize;
    const startY = Math.floor(camera.y / tileSize) * tileSize;

    for (let x = startX; x < startX + CONFIG.canvas.width + tileSize; x += tileSize) {
        for (let y = startY; y < startY + CONFIG.canvas.height + tileSize; y += tileSize) {
            const screenX = x - camera.x;
            const screenY = y - camera.y;

            // Only draw visible tiles
            if (screenX > -tileSize && screenX < CONFIG.canvas.width &&
                screenY > -tileSize && screenY < CONFIG.canvas.height) {

                // Alternate grass colors for texture
                const baseColor = ((x / tileSize + y / tileSize) % 2 === 0)
                    ? '#7cbd6e'
                    : '#6ead5f';
                createVoxelTexture(screenX, screenY, tileSize, baseColor);
            }
        }
    }
}

/**
 * Draw the player character
 * @param {Object} player - Player object
 * @param {{x: number, y: number}} camera - Camera position
 */
export function drawPlayer(player, camera) {
    const screenX = player.worldX - camera.x;
    const screenY = player.worldY - camera.y;

    // Draw player as voxel character
    createVoxelTexture(screenX, screenY, CONFIG.player.size, CONFIG.player.color);

    // Draw face details
    ctx.fillStyle = '#000';
    // Eyes
    ctx.fillRect(screenX + 8, screenY + 12, 4, 4);
    ctx.fillRect(screenX + 20, screenY + 12, 4, 4);
    // Mouth
    ctx.fillRect(screenX + 10, screenY + 22, 12, 2);
}

/**
 * Draw an enemy
 * @param {Object} enemy - Enemy object
 * @param {{x: number, y: number}} camera - Camera position
 */
export function drawEnemy(enemy, camera) {
    const screenX = enemy.x - camera.x;
    const screenY = enemy.y - camera.y;

    // Skip if off-screen
    if (screenX < -50 || screenX > CONFIG.canvas.width + 50 ||
        screenY < -50 || screenY > CONFIG.canvas.height + 50) {
        return;
    }

    // Draw enemy as zombie-like voxel
    createVoxelTexture(screenX, screenY, CONFIG.enemy.size, '#90cc90');

    // Draw zombie face
    ctx.fillStyle = '#000';
    // Eyes
    ctx.fillRect(screenX + 6, screenY + 10, 4, 4);
    ctx.fillRect(screenX + 18, screenY + 10, 4, 4);
    // Mouth
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX + 8, screenY + 18, 12, 4);
}

/**
 * Draw a projectile
 * @param {Object} projectile - Projectile object
 * @param {{x: number, y: number}} camera - Camera position
 */
export function drawProjectile(projectile, camera) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;

    // Main projectile
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(screenX, screenY, CONFIG.projectile.size, CONFIG.projectile.size);

    // Inner glow
    ctx.fillStyle = '#ffffaa';
    ctx.fillRect(screenX + 2, screenY + 2, 4, 4);

    // Outer glow
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        screenX - 2,
        screenY - 2,
        CONFIG.projectile.size + 4,
        CONFIG.projectile.size + 4
    );
}

/**
 * Create a voxel/block texture with shading
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Size of the block
 * @param {string} baseColor - Base color in hex format
 */
function createVoxelTexture(x, y, size, baseColor) {
    const colors = {
        base: baseColor,
        light: adjustBrightness(baseColor, 40),
        dark: adjustBrightness(baseColor, -40),
        darkest: adjustBrightness(baseColor, -60)
    };

    // Main face
    ctx.fillStyle = colors.base;
    ctx.fillRect(x, y, size, size);

    // Add pixel detail pattern for texture
    ctx.fillStyle = colors.light;
    for (let i = 0; i < size; i += 4) {
        for (let j = 0; j < size; j += 4) {
            if (Math.random() > 0.6) {
                ctx.fillRect(x + i, y + j, 2, 2);
            }
        }
    }

    // Top highlight
    ctx.fillStyle = colors.light;
    ctx.fillRect(x, y, size, 3);

    // Left highlight
    ctx.fillRect(x, y, 3, size);

    // Bottom shadow
    ctx.fillStyle = colors.dark;
    ctx.fillRect(x, y + size - 3, size, 3);

    // Right shadow
    ctx.fillRect(x + size - 3, y, 3, size);

    // Corner shadow
    ctx.fillStyle = colors.darkest;
    ctx.fillRect(x + size - 3, y + size - 3, 3, 3);
}

/**
 * Adjust color brightness
 * @param {string} color - Hex color string
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
