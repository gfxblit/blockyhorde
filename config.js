/**
 * Game Configuration
 * Central configuration object for all game parameters
 */
export const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
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
        baseDamage: 2.0,              // 200% of player base damage
        splashRadius: 64,             // 2x player hitbox size (32 * 2)
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
    }
};
