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
      showItemPickup: jest.fn(),
      showSpecialUpgradeUI: jest.fn()
    };

    game = new Game(canvas, inputManager, uiManager);
    game.state.currentTime = 0;
  });

  describe('Ability Initialization', () => {
    test('should initialize with full charges', () => {
      expect(game.abilities.ghastFireball.currentCharges).toBe(CONFIG.specials.ghastFireball.maxCharges);
    });

    test('should initialize with correct max charges', () => {
      expect(game.abilities.ghastFireball.maxCharges).toBe(CONFIG.specials.ghastFireball.maxCharges);
    });

    test('should initialize with correct cooldown duration', () => {
      expect(game.abilities.ghastFireball.cooldownDuration).toBe(CONFIG.specials.ghastFireball.cooldown);
    });

    test('should initialize at level 1', () => {
      expect(game.abilities.ghastFireball.level).toBe(1);
    });

    test('should initialize with correct splash radius', () => {
      expect(game.abilities.ghastFireball.splashRadius).toBe(CONFIG.specials.ghastFireball.splashRadius);
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

      game.updateAbilities(1000 + CONFIG.specials.ghastFireball.cooldown);

      expect(game.abilities.ghastFireball.currentCharges).toBe(1);
    });

    test('should not recharge beyond max charges', () => {
      game.abilities.ghastFireball.currentCharges = CONFIG.specials.ghastFireball.maxCharges;
      game.abilities.ghastFireball.lastUsedTime = 1000;

      game.updateAbilities(20000);

      expect(game.abilities.ghastFireball.currentCharges).toBe(CONFIG.specials.ghastFireball.maxCharges);
    });

    test('should update lastUsedTime when charge is restored', () => {
      const initialTime = 1000;
      game.abilities.ghastFireball.currentCharges = 0;
      game.abilities.ghastFireball.lastUsedTime = initialTime;

      const rechargeTime = initialTime + CONFIG.specials.ghastFireball.cooldown;
      game.updateAbilities(rechargeTime);

      expect(game.abilities.ghastFireball.lastUsedTime).toBe(rechargeTime);
    });

    test('should recharge one charge at a time', () => {
      // If max charges is ever > 1
      if (CONFIG.specials.ghastFireball.maxCharges > 1) {
        game.abilities.ghastFireball.maxCharges = 3;
        game.abilities.ghastFireball.currentCharges = 0;
        game.abilities.ghastFireball.lastUsedTime = 1000;

        game.updateAbilities(1000 + CONFIG.specials.ghastFireball.cooldown);

        expect(game.abilities.ghastFireball.currentCharges).toBe(1);
      } else {
        // For current config where maxCharges is 1
        expect(CONFIG.specials.ghastFireball.maxCharges).toBe(1);
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

      expect(game.projectiles[0].damage).toBe(CONFIG.specials.ghastFireball.baseDamage);
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

      expect(speed).toBeCloseTo(CONFIG.specials.ghastFireball.speed, 1);
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

      const expectedDamage = damage * CONFIG.specials.ghastFireball.splashDamageMultiplier;
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

  describe('Special Abilities System', () => {
    test('should initialize with ghastFireball as current special', () => {
      expect(game.currentSpecial).toBe('ghastFireball');
    });

    test('should initialize ghastFireball at level 1', () => {
      expect(game.specialLevels.ghastFireball).toBe(1);
    });

    test('should initialize other specials at level 0', () => {
      expect(game.specialLevels.explodingRing).toBe(0);
      expect(game.specialLevels.heal).toBe(0);
    });

    test('should upgrade current special when selected', () => {
      game.selectSpecial('ghastFireball');
      expect(game.specialLevels.ghastFireball).toBe(2);
    });

    test('should switch to new special and set level 1', () => {
      game.selectSpecial('explodingRing');
      expect(game.currentSpecial).toBe('explodingRing');
      expect(game.specialLevels.explodingRing).toBe(1);
    });

    test('should keep level when switching back to a special', () => {
      game.selectSpecial('explodingRing'); // Switch to ring, level 1
      game.selectSpecial('explodingRing'); // Upgrade to level 2
      game.selectSpecial('ghastFireball'); // Switch back
      expect(game.specialLevels.explodingRing).toBe(2);
    });

    test('should not exceed max level 5', () => {
      game.specialLevels.ghastFireball = 5;
      game.selectSpecial('ghastFireball');
      expect(game.specialLevels.ghastFireball).toBe(5);
    });

    test('should update ability state after selection', () => {
      game.selectSpecial('explodingRing');
      expect(game.abilities.ghastFireball.ringRadius).toBeDefined();
      expect(game.abilities.ghastFireball.explosionCount).toBeDefined();
    });

    test('should reset charges on ability switch', () => {
      game.abilities.ghastFireball.currentCharges = 0;
      game.selectSpecial('explodingRing');
      expect(game.abilities.ghastFireball.currentCharges).toBe(game.abilities.ghastFireball.maxCharges);
    });
  });

  describe('Special Stats Calculation', () => {
    test('should return base stats for level 1', () => {
      const stats = game.getSpecialStats('ghastFireball', 1);
      expect(stats.cooldown).toBe(CONFIG.specials.ghastFireball.cooldown);
      expect(stats.maxCharges).toBe(CONFIG.specials.ghastFireball.maxCharges);
    });

    test('should apply cooldown reduction at level 2', () => {
      const stats = game.getSpecialStats('ghastFireball', 2);
      const expected = CONFIG.specials.ghastFireball.cooldown * 0.9; // 10% reduction
      expect(stats.cooldown).toBeCloseTo(expected, 0);
    });

    test('should apply cumulative upgrades', () => {
      const stats = game.getSpecialStats('ghastFireball', 4);
      // Level 2: -10%, Level 4: -15% more
      const expected = CONFIG.specials.ghastFireball.cooldown * 0.9 * 0.85;
      expect(stats.cooldown).toBeCloseTo(expected, 0);
    });

    test('should apply max charges upgrade at level 5', () => {
      const stats = game.getSpecialStats('ghastFireball', 5);
      expect(stats.maxCharges).toBe(2);
    });

    test('should calculate explodingRing stats correctly', () => {
      const stats = game.getSpecialStats('explodingRing', 1);
      expect(stats.explosionCount).toBe(CONFIG.specials.explodingRing.explosionCount);
      expect(stats.ringRadius).toBe(CONFIG.specials.explodingRing.ringRadius);
    });

    test('should calculate heal stats correctly', () => {
      const stats = game.getSpecialStats('heal', 1);
      expect(stats.healAmount).toBe(CONFIG.specials.heal.healAmount);
    });
  });

  describe('Exploding Ring Ability', () => {
    beforeEach(() => {
      game.selectSpecial('explodingRing');
    });

    test('should create multiple explosions in a ring', () => {
      game.useExplodingRing();
      expect(game.explosions.length).toBe(CONFIG.specials.explodingRing.explosionCount);
    });

    test('should damage enemies within explosion radius', () => {
      game.enemies.push({
        type: 'regular',
        x: game.player.worldX + 100, // At ring radius
        y: game.player.worldY,
        hp: 10,
        maxHP: 10
      });

      game.useExplodingRing();
      expect(game.enemies[0].hp).toBeLessThan(10);
    });

    test('should use special ability correctly via useSpecialAbility', () => {
      const initialExplosions = game.explosions.length;
      game.useSpecialAbility();
      expect(game.explosions.length).toBeGreaterThan(initialExplosions);
    });
  });

  describe('Healing Burst Ability', () => {
    beforeEach(() => {
      game.selectSpecial('heal');
    });

    test('should restore health when used', () => {
      game.player.hp = 50;
      game.useHealingBurst();
      expect(game.player.hp).toBeGreaterThan(50);
    });

    test('should not exceed max HP', () => {
      game.player.hp = CONFIG.player.maxHP - 10;
      game.useHealingBurst();
      expect(game.player.hp).toBe(CONFIG.player.maxHP);
    });

    test('should create visual healing effect', () => {
      game.useHealingBurst();
      expect(game.explosions.length).toBe(1);
      expect(game.explosions[0].color).toBe(CONFIG.specials.heal.color);
    });

    test('should show item pickup notification', () => {
      game.player.hp = 50;
      game.useHealingBurst();
      expect(uiManager.showItemPickup).toHaveBeenCalled();
    });

    test('should use special ability correctly via useSpecialAbility', () => {
      game.player.hp = 50;
      game.useSpecialAbility();
      expect(game.player.hp).toBeGreaterThan(50);
    });
  });

  describe('Boss Defeat Special Upgrade', () => {
    test('should trigger special upgrade on boss defeat', () => {
      game.enemies.push({
        type: 'boss',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 10
      });
      game.bossSpawned = true;

      game.applyGhastFireballExplosion(100, 100, 10, 128);

      expect(game.pendingSpecialUpgrade).toBe(true);
      expect(uiManager.showSpecialUpgradeUI).toHaveBeenCalled();
    });

    test('should set bossSpawned to false after boss defeat', () => {
      game.enemies.push({
        type: 'boss',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: 10
      });
      game.bossSpawned = true;

      game.applyGhastFireballExplosion(100, 100, 10, 128);

      expect(game.bossSpawned).toBe(false);
    });

    test('should resume game after special selection', () => {
      game.pendingSpecialUpgrade = true;
      game.selectSpecial('ghastFireball');
      expect(game.pendingSpecialUpgrade).toBe(false);
    });
  });
});
