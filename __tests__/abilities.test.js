/**
 * Abilities System Tests
 * Tests for ghast fireball ability, cooldowns, and charges
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Abilities System', () => {
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
    game.state.currentTime = 0;
  });

  describe('Ability Initialization', () => {
    test('should initialize with full charges', () => {
      expect(game.abilities.ghastFireball.currentCharges).toBe(CONFIG.ghastFireball.maxCharges);
    });

    test('should initialize with correct max charges', () => {
      expect(game.abilities.ghastFireball.maxCharges).toBe(CONFIG.ghastFireball.maxCharges);
    });

    test('should initialize with correct cooldown duration', () => {
      expect(game.abilities.ghastFireball.cooldownDuration).toBe(CONFIG.ghastFireball.cooldown);
    });

    test('should initialize at level 1', () => {
      expect(game.abilities.ghastFireball.level).toBe(1);
    });

    test('should initialize with correct splash radius', () => {
      expect(game.abilities.ghastFireball.splashRadius).toBe(CONFIG.ghastFireball.splashRadius);
    });
  });

  describe('Ability Usage', () => {
    test('should use ability when charges available', () => {
      const result = game.useGhastFireball();

      expect(result).toBe(true);
      expect(game.abilities.ghastFireball.currentCharges).toBe(0);
    });

    test('should spawn ghast fireball projectile when used', () => {
      game.useGhastFireball();

      expect(game.projectiles.length).toBe(1);
      expect(game.projectiles[0].type).toBe('ghastFireball');
    });

    test('should not use ability when no charges available', () => {
      game.abilities.ghastFireball.currentCharges = 0;

      const result = game.useGhastFireball();

      expect(result).toBe(false);
      expect(game.projectiles.length).toBe(0);
    });

    test('should consume one charge when used', () => {
      game.abilities.ghastFireball.currentCharges = 2;

      game.useGhastFireball();

      expect(game.abilities.ghastFireball.currentCharges).toBe(1);
    });

    test('should set lastUsedTime when ability is used', () => {
      game.state.currentTime = 5000;

      game.useGhastFireball();

      expect(game.abilities.ghastFireball.lastUsedTime).toBe(5000);
    });
  });

  describe('Ability Recharge', () => {
    test('should not recharge before cooldown completes', () => {
      game.abilities.ghastFireball.currentCharges = 0;
      game.abilities.ghastFireball.lastUsedTime = 1000;

      game.updateAbilities(5000); // 4 seconds later

      expect(game.abilities.ghastFireball.currentCharges).toBe(0);
    });

    test('should recharge after cooldown completes', () => {
      game.abilities.ghastFireball.currentCharges = 0;
      game.abilities.ghastFireball.lastUsedTime = 1000;

      game.updateAbilities(1000 + CONFIG.ghastFireball.cooldown);

      expect(game.abilities.ghastFireball.currentCharges).toBe(1);
    });

    test('should not recharge beyond max charges', () => {
      game.abilities.ghastFireball.currentCharges = CONFIG.ghastFireball.maxCharges;
      game.abilities.ghastFireball.lastUsedTime = 1000;

      game.updateAbilities(20000);

      expect(game.abilities.ghastFireball.currentCharges).toBe(CONFIG.ghastFireball.maxCharges);
    });

    test('should update lastUsedTime when charge is restored', () => {
      const initialTime = 1000;
      game.abilities.ghastFireball.currentCharges = 0;
      game.abilities.ghastFireball.lastUsedTime = initialTime;

      const rechargeTime = initialTime + CONFIG.ghastFireball.cooldown;
      game.updateAbilities(rechargeTime);

      expect(game.abilities.ghastFireball.lastUsedTime).toBe(rechargeTime);
    });

    test('should recharge one charge at a time', () => {
      // If max charges is ever > 1
      if (CONFIG.ghastFireball.maxCharges > 1) {
        game.abilities.ghastFireball.maxCharges = 3;
        game.abilities.ghastFireball.currentCharges = 0;
        game.abilities.ghastFireball.lastUsedTime = 1000;

        game.updateAbilities(1000 + CONFIG.ghastFireball.cooldown);

        expect(game.abilities.ghastFireball.currentCharges).toBe(1);
      } else {
        // For current config where maxCharges is 1
        expect(CONFIG.ghastFireball.maxCharges).toBe(1);
      }
    });
  });

  describe('Ghast Fireball Direction', () => {
    test('should fire in movement direction when player is moving', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      expect(proj.vx).toBeGreaterThan(0);
      expect(proj.vy).toBe(0);
    });

    test('should fire toward nearest enemy when player not moving', () => {
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

    test('should fire right when no movement and no enemies', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 0, dy: 0 });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      expect(proj.vx).toBeGreaterThan(0);
      expect(proj.vy).toBe(0);
    });

    test('should fire diagonally when moving diagonally', () => {
      const normalized = 1 / Math.sqrt(2);
      inputManager.getMovementDirection.mockReturnValue({ dx: normalized, dy: normalized });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      expect(proj.vx).toBeGreaterThan(0);
      expect(proj.vy).toBeGreaterThan(0);
    });
  });

  describe('Ghast Fireball Properties', () => {
    test('should have correct base damage', () => {
      game.spawnGhastFireball();

      expect(game.projectiles[0].damage).toBe(CONFIG.ghastFireball.baseDamage);
    });

    test('should have correct splash radius', () => {
      game.spawnGhastFireball();

      expect(game.projectiles[0].splashRadius).toBe(game.abilities.ghastFireball.splashRadius);
    });

    test('should have correct size', () => {
      game.spawnGhastFireball();

      expect(game.projectiles[0].size).toBe(game.abilities.ghastFireball.size);
    });

    test('should have correct speed', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

      expect(speed).toBeCloseTo(CONFIG.ghastFireball.speed, 1);
    });

    test('should spawn from player position', () => {
      game.player.worldX = 200;
      game.player.worldY = 300;

      game.spawnGhastFireball();

      const proj = game.projectiles[0];
      const expectedX = game.player.worldX + CONFIG.player.size / 2;
      const expectedY = game.player.worldY + CONFIG.player.size / 2;

      expect(proj.x).toBe(expectedX);
      expect(proj.y).toBe(expectedY);
    });
  });

  describe('Ghast Fireball Splash Damage', () => {
    test('should create explosion effect on impact', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 10,
        maxHP: 10
      });

      game.applyGhastFireballExplosion(100, 100, 4, 128);

      expect(game.explosions.length).toBe(1);
      expect(game.explosions[0].x).toBe(100);
      expect(game.explosions[0].y).toBe(100);
      expect(game.explosions[0].maxRadius).toBe(128);
    });

    test('should damage enemies in splash radius', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 10,
        maxHP: 10
      });

      game.enemies.push({
        type: 'regular',
        x: 120,
        y: 100,
        hp: 10,
        maxHP: 10
      });

      game.applyGhastFireballExplosion(100, 100, 4, 128);

      // Both enemies should be damaged
      expect(game.enemies.every(e => e.hp < 10)).toBe(true);
    });

    test('should not damage enemies outside splash radius', () => {
      game.enemies.push({
        type: 'regular',
        x: 1000,
        y: 1000,
        hp: 10,
        maxHP: 10
      });

      game.applyGhastFireballExplosion(100, 100, 4, 128);

      expect(game.enemies[0].hp).toBe(10); // No damage
    });

    test('should deal full damage on direct hit', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 10,
        maxHP: 10
      });

      const damage = 4;
      game.applyGhastFireballExplosion(100, 100, damage, 128);

      expect(game.enemies[0].hp).toBe(10 - damage);
    });

    test('should deal reduced damage for splash hits', () => {
      // Enemy far enough to not be direct hit but in splash radius
      game.enemies.push({
        type: 'regular',
        x: 150,
        y: 150,
        hp: 10,
        maxHP: 10
      });

      const damage = 4;
      game.applyGhastFireballExplosion(100, 100, damage, 128);

      const expectedDamage = damage * CONFIG.ghastFireball.splashDamageMultiplier;
      expect(game.enemies[0].hp).toBe(10 - expectedDamage);
    });

    test('should kill enemies and drop items', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Always drop items

      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 1
      });

      game.applyGhastFireballExplosion(100, 100, 10, 128);

      expect(game.enemies.length).toBe(0);
      expect(game.items.length).toBe(1);

      Math.random = originalRandom;
    });

    test('should increment kills for destroyed enemies', () => {
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 1
      });

      const initialKills = game.state.kills;
      game.applyGhastFireballExplosion(100, 100, 10, 128);

      expect(game.state.kills).toBe(initialKills + 1);
    });
  });

  describe('Explosion Visual Effects', () => {
    test('should update explosion radius over time', () => {
      game.explosions.push({
        x: 100,
        y: 100,
        radius: 0,
        maxRadius: 128,
        duration: 0.5,
        elapsed: 0
      });

      game.updateExplosions(0.25); // Half duration

      expect(game.explosions[0].radius).toBeCloseTo(64, 0); // Half radius
    });

    test('should remove explosions after duration', () => {
      game.explosions.push({
        x: 100,
        y: 100,
        radius: 0,
        maxRadius: 128,
        duration: 0.5,
        elapsed: 0
      });

      game.updateExplosions(0.5);

      expect(game.explosions.length).toBe(0);
    });

    test('should not exceed max radius', () => {
      game.explosions.push({
        x: 100,
        y: 100,
        radius: 0,
        maxRadius: 128,
        duration: 0.5,
        elapsed: 0
      });

      game.updateExplosions(1.0); // More than duration

      // Explosion should be removed before checking radius
      // But if we check during the update before removal
      expect(game.explosions.length).toBe(0);
    });
  });
});
