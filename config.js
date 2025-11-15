/**
 * Game Configuration
 * Contains all game constants and settings
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
        speedMultiplierPerMinute: 0.5,  // +50% speed per minute
        damageMultiplierPerMinute: 0.4, // +40% damage per minute
        hpMultiplierPerMinute: 0.3      // +30% HP per minute
    }
};
