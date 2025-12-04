/**
 * Game Configuration
 * Central configuration object for all game parameters
 */

/**
 * Calculate canvas dimensions based on screen orientation
 */
function calculateCanvasDimensions() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth <= 850;

    if (isMobile && isPortrait) {
        // Portrait mode: use 9:16 aspect ratio (common for mobile)
        // Base on width, calculate height
        const baseWidth = Math.min(window.innerWidth, 600);
        const baseHeight = Math.floor(baseWidth * (16 / 9));
        return {
            width: baseWidth,
            height: baseHeight
        };
    } else if (isMobile) {
        // Landscape mobile: use full viewport but maintain reasonable aspect
        const baseHeight = Math.min(window.innerHeight, 600);
        const baseWidth = Math.floor(baseHeight * (4 / 3));
        return {
            width: baseWidth,
            height: baseHeight
        };
    } else {
        // Desktop: use fixed 800x600
        return {
            width: 800,
            height: 600
        };
    }
}

export const CONFIG = {
    canvas: calculateCanvasDimensions(),
    player: {
        size: 32,
        speed: 200,
        maxHP: 100,
        color: '#f0c080',
        damageTintAlpha: 0.3,
        damageTintFadeSpeed: 2
    },
    enemy: {
        size: 28,
        speed: 50,
        damage: 10,
        damageInterval: 1000,
        initialSpawnInterval: 750,
        color: '#80cc80'
    },
    boss: {
        size: 56,                         // Double the size of regular enemies
        speed: 40,                        // Slower than regular enemies
        damage: 20,                       // Double damage
        damageInterval: 1000,
        health: 8,                        // Reduced base health
        color: '#cc4444',                 // Red color
        projectileInterval: 2000,         // Fire every 2 seconds
        projectileSpeed: 250,
        projectileSize: 12,
        projectileDamage: 15,
        projectileColor: '#ff6600'        // Orange projectiles
    },
    projectile: {
        size: 8,
        speed: 450,
        interval: 500,
        color: '#ffff00'
    },
    // Special abilities - player can equip one at a time
    specials: {
        ghastFireball: {
            name: 'Ghast Fireball',
            description: 'Launch an explosive fireball that deals splash damage',
            icon: '🔥',
            type: 'active',
            cooldown: 10000,              // 10 seconds in milliseconds
            size: 24,                     // Large white sphere
            speed: 150,                   // 0.75x player speed (200 * 0.75)
            baseDamage: 4.0,              // 400% of player base damage
            splashRadius: 128,            // 4x player hitbox size (32 * 4)
            splashDamageMultiplier: 0.5,  // 50% splash damage
            color: '#f8f8f8',             // White color for the fireball
            maxCharges: 1,                // Level 1-4: single charge
            // Upgrade bonuses per level (cumulative)
            upgrades: {
                2: { cooldownReduction: 0.10, description: '-10% cooldown' },
                3: { sizeIncrease: 0.25, splashIncrease: 0.25, description: '+25% explosion size' },
                4: { cooldownReduction: 0.15, description: '-15% cooldown' },
                5: { maxCharges: 2, damageMultiplier: 1.5, description: '+1 charge, +50% damage' }
            }
        },
        explodingRing: {
            name: 'Exploding Ring',
            description: 'Create a ring of explosions around you',
            icon: '💫',
            type: 'active',
            cooldown: 12000,              // 12 seconds
            ringRadius: 100,              // Distance from player
            explosionCount: 8,            // Number of explosions in the ring
            baseDamage: 3.0,              // 300% of player base damage per explosion
            splashRadius: 64,             // Each explosion splash radius
            splashDamageMultiplier: 0.5,
            color: '#ff6600',
            maxCharges: 1,
            upgrades: {
                2: { explosionCountIncrease: 2, description: '+2 explosions' },
                3: { radiusIncrease: 0.30, description: '+30% ring radius' },
                4: { cooldownReduction: 0.20, description: '-20% cooldown' },
                5: { maxCharges: 2, damageMultiplier: 1.5, description: '+1 charge, +50% damage' }
            }
        },
        heal: {
            name: 'Healing Burst',
            description: 'Instantly restore health',
            icon: '💚',
            type: 'active',
            cooldown: 15000,              // 15 seconds
            healAmount: 30,               // Base heal amount
            color: '#00ff88',
            maxCharges: 1,
            upgrades: {
                2: { healIncrease: 10, description: '+10 heal amount' },
                3: { cooldownReduction: 0.15, description: '-15% cooldown' },
                4: { healIncrease: 15, description: '+15 heal amount' },
                5: { maxCharges: 2, healMultiplier: 1.3, description: '+1 charge, +30% healing' }
            }
        }
    },
    difficulty: {
        intervalReduction: 0.1,
        timePerReduction: 30,
        speedMultiplierPerMinute: 1.0,    // +100% speed per minute
        damageMultiplierPerMinute: 0.8,   // +80% damage per minute
        hpMultiplierPerMinute: 0.6,       // +60% HP per minute
        spawnQuadraticFactor: 350         // Quadratic spawn rate scaling
    },
    items: {
        size: 16,
        magnetRadius: 40,                 // Auto-pickup radius
        despawnTime: 30000,               // Items despawn after 30 seconds
        dropRate: 0.15,                   // 15% chance per enemy kill
        types: {
            attackSpeed: {
                name: 'Attack Speed',
                color: '#00ffff',         // Cyan
                speedReduction: 50,       // Reduces attack interval by 50ms
                duration: Infinity,       // Permanent (never expires)
                stackable: true,          // Multiple pickups stack duration
                maxStacks: 5              // Max 5 stacks
            },
            damage: {
                name: 'Damage Boost',
                color: '#ff4444',         // Red
                damageBonus: 1,           // +1 damage per pickup
                duration: Infinity,       // Permanent (never expires)
                stackable: true,
                maxStacks: 5
            },
            speed: {
                name: 'Speed Boost',
                color: '#00ff00',         // Green
                speedBonus: 50,           // +50 speed per pickup
                duration: Infinity,       // Permanent (never expires)
                stackable: true,
                maxStacks: 5
            },
            health: {
                name: 'Health Pack',
                color: '#ff0088',         // Pink
                healthRestore: 30,        // Restores 30 HP
                duration: 0,              // Instant effect
                stackable: false          // Health is restored immediately
            }
        }
    }
};
