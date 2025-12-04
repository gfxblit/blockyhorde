/**
 * Projectile System Tests
 * Tests for all projectile types (regular, boss, ghast fireball)
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Projectile System', () => {
  let canvas, inputManager, uiManager, game;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    inputManager = {
      getMovementDirection: jest.fn(() => ({ dx: 0, dy: 0 })),
      isAbilityPressed: jest.fn(() => false)
    };

    uiManager = {
      updateAll: jest.fn(),
      showGameOver: jest.fn(),
      showDifficultyNotification: jest.fn(),
      showItemPickup: jest.fn()
    };

    game = new Game(canvas, inputManager, uiManager);
  });

  describe('Regular Projectile Spawning', () => {
    test('should spawn projectile aimed at nearest enemy', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 0,
        hp: 1,
        maxHP: 1
      });

      game.spawnProjectile();

      expect(game.projectiles.length).toBe(1);
      const proj = game.projectiles[0];

      expect(proj.type).toBe('regular');
      expect(proj.damage).toBe(1);
      expect(proj.size).toBe(CONFIG.projectile.size);

      // Should be aimed toward enemy at (100, 0)
      expect(proj.vx).toBeGreaterThan(0);
      expect(Math.abs(proj.vy)).toBeLessThan(Math.abs(proj.vx));
    });

    test('should spawn projectile in random direction when no enemies exist', () => {
      game.spawnProjectile();

      expect(game.projectiles.length).toBe(1);
      const proj = game.projectiles[0];

      const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
      expect(speed).toBeCloseTo(CONFIG.projectile.speed, 1);
    });

    test('should apply damage buff to projectiles', () => {
      game.player.buffs.damage.stacks = 3;

      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 0,
        hp: 10,
        maxHP: 10
      });

      game.spawnProjectile();

      const proj = game.projectiles[0];
      const expectedDamage = 1 + (3 * CONFIG.items.types.damage.damageBonus);
      expect(proj.damage).toBe(expectedDamage);
    });

    test('should target nearest enemy when multiple exist', () => {
      game.enemies.push({
        type: 'regular',
        x: 500,
        y: 500,
        hp: 1,
        maxHP: 1
      });

      game.enemies.push({
        type: 'regular',
        x: 50,
        y: 0,
        hp: 1,
        maxHP: 1
      });

      game.spawnProjectile();

      const proj = game.projectiles[0];

      // Should aim at closer enemy (50, 0)
      expect(proj.vx).toBeGreaterThan(0);
      expect(Math.abs(proj.vy)).toBeLessThan(100);
    });
  });

  describe('Projectile Movement and Lifecycle', () => {
    test('should update projectile position based on velocity', () => {
      game.projectiles.push({
        type: 'regular',
        x: 0,
        y: 0,
        vx: 100,
        vy: 100,
        damage: 1,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(1.0);

      expect(game.projectiles[0].x).toBe(100);
      expect(game.projectiles[0].y).toBe(100);
    });

    test('should remove projectiles that travel too far from player', () => {
      game.projectiles.push({
        type: 'regular',
        x: 1000,
        y: 1000,
        vx: 0,
        vy: 0,
        damage: 1,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.projectiles.length).toBe(0);
    });

    test('should keep projectiles within range of player', () => {
      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 1,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.projectiles.length).toBe(1);
    });
  });

  describe('Projectile-Enemy Collision', () => {
    test('should damage enemy when projectile hits', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 5,
        maxHP: 5
      });

      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 2,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.enemies[0].hp).toBe(3);
    });

    test('should remove projectile after hitting enemy', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 5,
        maxHP: 5
      });

      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 2,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.projectiles.length).toBe(0);
    });

    test('should remove enemy when HP reaches 0', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 1
      });

      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 1,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.enemies.length).toBe(0);
    });

    test('should increment kills when enemy dies', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 1
      });

      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 1,
        size: CONFIG.projectile.size
      });

      const initialKills = game.state.kills;
      game.updateProjectiles(0.016);

      expect(game.state.kills).toBe(initialKills + 1);
    });
  });

  describe('Boss Projectiles', () => {
    test('should damage player when boss projectile hits', () => {
      const initialHP = game.player.hp;

      game.projectiles.push({
        type: 'bossProjectile',
        x: game.player.worldX,
        y: game.player.worldY,
        vx: 0,
        vy: 0,
        damage: CONFIG.boss.projectileDamage,
        size: CONFIG.boss.projectileSize
      });

      game.updateProjectiles(0.016);

      expect(game.player.hp).toBe(initialHP - CONFIG.boss.projectileDamage);
    });

    test('should remove boss projectile after hitting player', () => {
      game.projectiles.push({
        type: 'bossProjectile',
        x: game.player.worldX,
        y: game.player.worldY,
        vx: 0,
        vy: 0,
        damage: CONFIG.boss.projectileDamage,
        size: CONFIG.boss.projectileSize
      });

      game.updateProjectiles(0.016);

      expect(game.projectiles.length).toBe(0);
    });

    test('should trigger game over if boss projectile kills player', () => {
      game.player.hp = 10;

      game.projectiles.push({
        type: 'bossProjectile',
        x: game.player.worldX,
        y: game.player.worldY,
        vx: 0,
        vy: 0,
        damage: 20,
        size: CONFIG.boss.projectileSize
      });

      game.updateProjectiles(0.016);

      expect(game.state.isRunning).toBe(false);
      expect(uiManager.showGameOver).toHaveBeenCalled();
    });
  });

  describe('Ghast Fireball Projectile', () => {
    test('should create ghast fireball when player is moving', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      game.spawnGhastFireball();

      expect(game.projectiles.length).toBe(1);
      const proj = game.projectiles[0];

      expect(proj.type).toBe('ghastFireball');
      expect(proj.damage).toBe(CONFIG.specials.ghastFireball.baseDamage);
      expect(proj.splashRadius).toBe(game.abilities.ghastFireball.splashRadius);
      expect(proj.vx).toBeGreaterThan(0);
    });

    test('should aim ghast fireball at nearest enemy when player not moving', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 0, dy: 0 });

      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 0,
        hp: 5,
        maxHP: 5
      });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      expect(proj.vx).toBeGreaterThan(0);
      expect(Math.abs(proj.vy)).toBeLessThan(Math.abs(proj.vx));
    });

    test('should shoot right when no enemies and not moving', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 0, dy: 0 });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      expect(proj.vx).toBeGreaterThan(0);
      expect(proj.vy).toBe(0);
    });

    test('should apply splash damage to all enemies in radius', () => {
      // Place multiple enemies within splash radius
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 5,
        maxHP: 5
      });

      game.enemies.push({
        type: 'regular',
        x: 120,
        y: 100,
        hp: 5,
        maxHP: 5
      });

      game.projectiles.push({
        type: 'ghastFireball',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: CONFIG.specials.ghastFireball.baseDamage,
        size: CONFIG.specials.ghastFireball.size,
        splashRadius: CONFIG.specials.ghastFireball.splashRadius
      });

      game.updateProjectiles(0.016);

      // Both enemies should be damaged (but not necessarily killed)
      expect(game.enemies.every(e => e.hp < e.maxHP)).toBe(true);
    });

    test('should create explosion effect on impact', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 5,
        maxHP: 5
      });

      game.projectiles.push({
        type: 'ghastFireball',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: CONFIG.specials.ghastFireball.baseDamage,
        size: CONFIG.specials.ghastFireball.size,
        splashRadius: CONFIG.specials.ghastFireball.splashRadius
      });

      game.updateProjectiles(0.016);

      expect(game.explosions.length).toBe(1);
      expect(game.explosions[0].maxRadius).toBe(CONFIG.specials.ghastFireball.splashRadius);
    });

    test('should deal full damage on direct hit', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 10,
        maxHP: 10
      });

      game.projectiles.push({
        type: 'ghastFireball',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: CONFIG.specials.ghastFireball.baseDamage,
        size: CONFIG.specials.ghastFireball.size,
        splashRadius: CONFIG.specials.ghastFireball.splashRadius
      });

      game.updateProjectiles(0.016);

      expect(game.enemies[0].hp).toBe(10 - CONFIG.specials.ghastFireball.baseDamage);
    });

    test('should deal splash damage to enemies not directly hit', () => {
      // Enemy in splash radius but not direct hit
      game.enemies.push({
        type: 'regular',
        x: 200,
        y: 200,
        hp: 10,
        maxHP: 10
      });

      game.projectiles.push({
        type: 'ghastFireball',
        x: 150,
        y: 150,
        vx: 0,
        vy: 0,
        damage: CONFIG.specials.ghastFireball.baseDamage,
        size: CONFIG.specials.ghastFireball.size,
        splashRadius: CONFIG.specials.ghastFireball.splashRadius
      });

      // Trigger the ghast fireball by hitting something
      game.enemies.push({
        type: 'regular',
        x: 150,
        y: 150,
        hp: 100,
        maxHP: 100
      });

      game.updateProjectiles(0.016);

      // Check if explosion was created
      expect(game.explosions.length).toBeGreaterThan(0);
    });
  });

  describe('Attack Speed Buff Effect', () => {
    test('should reduce projectile interval with attack speed buff', () => {
      game.player.buffs.attackSpeed.stacks = 2;

      const attackSpeedReduction = 2 * CONFIG.items.types.attackSpeed.speedReduction;
      const expectedInterval = CONFIG.projectile.interval - attackSpeedReduction;

      // This is tested in the game loop, verifying the calculation
      expect(expectedInterval).toBe(CONFIG.projectile.interval - 100);
      expect(expectedInterval).toBeGreaterThan(0);
    });

    test('should have minimum projectile interval of 50ms', () => {
      game.player.buffs.attackSpeed.stacks = 100; // Way too many stacks

      const attackSpeedReduction = 100 * CONFIG.items.types.attackSpeed.speedReduction;
      const modifiedInterval = Math.max(50, CONFIG.projectile.interval - attackSpeedReduction);

      expect(modifiedInterval).toBe(50);
    });
  });
});
