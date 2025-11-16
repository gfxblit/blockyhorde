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
    difficulty: {
        intervalReduction: 0.1,
        timePerReduction: 30,
        speedMultiplierPerMinute: 1.0,    // +100% speed per minute
        damageMultiplierPerMinute: 0.8,   // +80% damage per minute
        hpMultiplierPerMinute: 0.6,       // +60% HP per minute
        spawnQuadraticFactor: 350         // Quadratic spawn rate scaling
    }
};
