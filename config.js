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
    ghastFireball: {
        name: 'Ghast Fireball',
        displayName: 'Ghast Fireball',
        description: 'Launch a large explosive fireball',
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
            level2: { cooldownReduction: 0.10, description: '10% faster cooldown' },
            level3: { sizeIncrease: 0.25, description: '25% larger explosion' },
            level4: { cooldownReduction: 0.15, description: '15% faster cooldown' },
            level5: { maxCharges: 2, damageMultiplier: 2.5, description: '2 charges + 250% damage' }
        }
    },
    explodingRing: {
        name: 'ExplodingRing',
        displayName: 'Exploding Ring',
        description: 'Create an expanding ring that damages all enemies',
        type: 'active',
        cooldown: 12000,              // 12 seconds in milliseconds
        baseRadius: 32,               // Starting radius (player size)
        maxRadius: 256,               // Max expansion radius
        expansionSpeed: 400,          // Pixels per second expansion
        baseDamage: 2.0,              // 200% of player base damage
        color: '#ff8800',             // Orange color
        ringWidth: 16,                // Thickness of the ring
        maxCharges: 1,
        currentLevel: 1,
        upgrades: {
            level2: { cooldownReduction: 0.10, description: '10% faster cooldown' },
            level3: { radiusIncrease: 0.30, description: '30% larger radius' },
            level4: { damageMultiplier: 1.5, description: '50% more damage' },
            level5: { maxCharges: 2, description: '2 charges' }
        }
    },
    heal: {
        name: 'Heal',
        displayName: 'Divine Heal',
        description: 'Restore health and gain temporary max HP',
        type: 'active',
        cooldown: 15000,              // 15 seconds in milliseconds
        healAmount: 40,               // Restore 40 HP
        maxHPBonus: 0,                // No bonus at level 1
        color: '#00ff88',             // Green-cyan color
        maxCharges: 1,
        currentLevel: 1,
        upgrades: {
            level2: { healIncrease: 0.25, description: '25% more healing' },
            level3: { cooldownReduction: 0.20, description: '20% faster cooldown' },
            level4: { maxHPBonus: 20, description: '+20 permanent max HP' },
            level5: { healIncrease: 0.50, description: '50% more healing' }
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
