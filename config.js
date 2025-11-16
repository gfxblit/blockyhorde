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
        color: '#f0c080'
    },
    enemy: {
        size: 28,
        speed: 80,
        damage: 10,
        damageInterval: 1000,
        initialSpawnInterval: 1500,
        color: '#80cc80'
    },
    projectile: {
        size: 8,
        speed: 300,
        interval: 500,
        color: '#ffff00'
    },
    ghastFireball: {
        name: 'GhastFireball',
        type: 'active',
        cooldown: 10000,              // 10 seconds in milliseconds
        size: 24,                     // Large white sphere
        speed: 150,                   // 0.75x player speed (200 * 0.75)
        baseDamage: 4.0,              // 400% of player base damage
        splashRadius: 128,            // 4x player hitbox size (32 * 4)
        splashDamageMultiplier: 0.5,  // 50% splash damage
        color: '#f8f8f8',             // White color for the fireball
        maxCharges: 1,                // Level 1-4: single charge
        currentLevel: 1,              // Track upgrade level
        // Upgrade levels configuration
        upgrades: {
            level2: { cooldownReduction: 0.10 },      // 10% reduction → 54s
            level3: { sizeIncrease: 0.25 },           // 25% size increase
            level4: { cooldownReduction: 0.15 },      // 15% reduction → 46s
            level5: {
                maxCharges: 2,                        // 2 charges
                damageMultiplier: 2.5                 // 250% base damage
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
                duration: 15000,          // 15 seconds
                stackable: true,          // Multiple pickups stack duration
                maxStacks: 5              // Max 5 stacks
            },
            damage: {
                name: 'Damage Boost',
                color: '#ff4444',         // Red
                damageBonus: 1,           // +1 damage per pickup
                duration: 15000,          // 15 seconds
                stackable: true,
                maxStacks: 5
            },
            speed: {
                name: 'Speed Boost',
                color: '#00ff00',         // Green
                speedBonus: 50,           // +50 speed per pickup
                duration: 15000,          // 15 seconds
                stackable: true,
                maxStacks: 5
            }
        }
    }
};
