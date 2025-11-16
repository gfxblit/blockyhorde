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
 * Draws a health bar above an entity
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} screenX - Screen X position
 * @param {number} screenY - Screen Y position
 * @param {number} currentHP - Current health points
 * @param {number} maxHP - Maximum health points
 * @param {number} width - Width of the health bar
 */
function drawHealthBar(ctx, screenX, screenY, currentHP, maxHP, width) {
    const barHeight = 4;
    const barY = screenY - 8; // Position above the entity
    const healthPercent = Math.max(0, Math.min(1, currentHP / maxHP));

    // Background (dark gray)
    ctx.fillStyle = '#333333';
    ctx.fillRect(screenX, barY, width, barHeight);

    // Health fill (red to green gradient based on health)
    if (healthPercent > 0) {
        // Color transitions: red (low) -> yellow (medium) -> green (high)
        let fillColor;
        if (healthPercent > 0.6) {
            fillColor = '#00ff00'; // Green
        } else if (healthPercent > 0.3) {
            fillColor = '#ffff00'; // Yellow
        } else {
            fillColor = '#ff0000'; // Red
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(screenX, barY, width * healthPercent, barHeight);
    }

    // Border (black outline)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, barY, width, barHeight);
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

    // Draw health bar above enemy
    if (enemy.maxHP && enemy.hp !== undefined) {
        drawHealthBar(ctx, screenX, screenY, enemy.hp, enemy.maxHP, CONFIG.enemy.size);
    }
}

/**
 * Draws a projectile
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} projectile - Projectile object
 * @param {Object} camera - Camera position
 */
export function drawProjectile(ctx, projectile, camera) {
    // Route to appropriate drawer based on type
    if (projectile.type === 'ghastFireball') {
        drawGhastFireball(ctx, projectile, camera);
    } else {
        drawRegularProjectile(ctx, projectile, camera);
    }
}

/**
 * Draws a regular projectile
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} projectile - Projectile object
 * @param {Object} camera - Camera position
 */
function drawRegularProjectile(ctx, projectile, camera) {
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
 * Draws a Ghast Fireball
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} projectile - Projectile object
 * @param {Object} camera - Camera position
 */
function drawGhastFireball(ctx, projectile, camera) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;
    const size = projectile.size;

    // Draw large white sphere with voxel style
    createVoxelTexture(ctx, screenX, screenY, projectile.x, projectile.y, size, CONFIG.ghastFireball.color);

    // Add fiery details (orange/red pixels)
    ctx.fillStyle = '#ffa500';
    for (let i = 0; i < size; i += 6) {
        for (let j = 0; j < size; j += 6) {
            const seed = (projectile.x + i) * 31 ^ (projectile.y + j) * 17;
            if (seededRandom(seed) > 0.7) {
                ctx.fillRect(screenX + i, screenY + j, 3, 3);
            }
        }
    }

    // Add bright white core
    ctx.fillStyle = '#ffffff';
    const coreSize = Math.floor(size / 3);
    const coreOffset = Math.floor((size - coreSize) / 2);
    ctx.fillRect(screenX + coreOffset, screenY + coreOffset, coreSize, coreSize);

    // Outer glow effect (white/orange)
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX - 3, screenY - 3, size + 6, size + 6);

    // Larger glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 6, screenY - 6, size + 12, size + 12);
}

/**
 * Draws an explosion effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} explosion - Explosion object
 * @param {Object} camera - Camera position
 */
export function drawExplosion(ctx, explosion, camera) {
    const screenX = explosion.x - camera.x;
    const screenY = explosion.y - camera.y;
    const progress = explosion.elapsed / explosion.duration;
    const alpha = 1 - progress; // Fade out over time

    // Draw expanding fire rings
    const numRings = 3;
    for (let i = 0; i < numRings; i++) {
        const ringOffset = i * 0.15; // Stagger the rings
        const ringProgress = Math.min((progress + ringOffset) / (1 + ringOffset), 1);
        const ringRadius = explosion.radius * ringProgress;
        const ringAlpha = alpha * (1 - i * 0.2); // Outer rings fade faster

        // Inner bright core (white/yellow)
        if (i === 0 && ringProgress < 0.3) {
            ctx.fillStyle = `rgba(255, 255, 200, ${ringAlpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Orange fire ring
        ctx.strokeStyle = `rgba(255, 140, 0, ${ringAlpha * 0.7})`;
        ctx.lineWidth = 8 - i * 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Red outer ring
        ctx.strokeStyle = `rgba(255, 69, 0, ${ringAlpha * 0.5})`;
        ctx.lineWidth = 6 - i * 1.5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringRadius * 1.1, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw final AOE indicator circle at max radius
    if (progress > 0.5) {
        const indicatorAlpha = alpha * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 100, ${indicatorAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, explosion.maxRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Fire particles effect
    if (progress < 0.7) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particleDistance = explosion.radius * (0.8 + Math.sin(progress * Math.PI * 4 + i) * 0.2);
            const px = screenX + Math.cos(angle) * particleDistance;
            const py = screenY + Math.sin(angle) * particleDistance;
            const particleSize = 4 * (1 - progress);

            ctx.fillStyle = `rgba(255, ${100 + i * 15}, 0, ${alpha * 0.6})`;
            ctx.fillRect(px - particleSize / 2, py - particleSize / 2, particleSize, particleSize);
        }
    }
}

/**
 * Draws an item
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} item - Item object
 * @param {Object} camera - Camera position
 */
export function drawItem(ctx, item, camera) {
    const screenX = item.x - camera.x;
    const screenY = item.y - camera.y;

    // Only draw if on screen
    if (screenX < -50 || screenX > CONFIG.canvas.width + 50 ||
        screenY < -50 || screenY > CONFIG.canvas.height + 50) {
        return;
    }

    const itemConfig = CONFIG.items.types[item.type];
    const size = CONFIG.items.size;

    // Draw item as a glowing cube
    createVoxelTexture(ctx, screenX, screenY, item.x, item.y, size, itemConfig.color);

    // Add glow effect
    const glowColor = itemConfig.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glowColor;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 2, screenY - 2, size + 4, size + 4);
    ctx.shadowBlur = 0;

    // Add floating animation (subtle bobbing)
    const bobOffset = Math.sin(Date.now() / 300) * 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(screenX + 4, screenY + 4 + bobOffset, size - 8, size - 8);
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
