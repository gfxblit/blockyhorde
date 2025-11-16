/**
 * Enemy System Tests
 * Tests for enemy spawning, movement, and behavior
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Enemy System', () => {
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

  describe('Enemy Spawning', () => {
    test('should spawn enemy at correct distance from player', () => {
      game.spawnEnemy();

      expect(game.enemies.length).toBe(1);

      const enemy = game.enemies[0];
      const dx = enemy.x - game.player.worldX;
      const dy = enemy.y - game.player.worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(distance).toBeCloseTo(400, 0);
    });

    test('should spawn regular enemy with correct properties', () => {
      game.spawnEnemy();

      const enemy = game.enemies[0];
      expect(enemy.type).toBe('regular');
      expect(enemy.hp).toBe(1);
      expect(enemy.maxHP).toBe(1);
    });

    test('should apply difficulty HP multiplier to spawned enemies', () => {
      game.difficultyMultipliers.hp = 2.5;
      game.spawnEnemy();

      const enemy = game.enemies[0];
      expect(enemy.hp).toBe(3); // Math.ceil(1 * 2.5)
      expect(enemy.maxHP).toBe(3);
    });

    test('should spawn boss with correct properties', () => {
      game.spawnBoss();

      expect(game.enemies.length).toBe(1);
      expect(game.bossSpawned).toBe(true);

      const boss = game.enemies[0];
      expect(boss.type).toBe('boss');
      expect(boss.hp).toBe(CONFIG.boss.health);
      expect(boss.maxHP).toBe(CONFIG.boss.health);
      expect(boss.lastProjectileTime).toBe(0);
    });

    test('should spawn boss at greater distance than regular enemies', () => {
      game.spawnBoss();

      const boss = game.enemies[0];
      const dx = boss.x - game.player.worldX;
      const dy = boss.y - game.player.worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(distance).toBeCloseTo(450, 0);
    });

    test('should apply difficulty HP multiplier to bosses', () => {
      game.difficultyMultipliers.hp = 2.0;
      game.spawnBoss();

      const boss = game.enemies[0];
      expect(boss.hp).toBe(CONFIG.boss.health * 2);
    });
  });

  describe('Enemy Movement', () => {
    test('should move enemy toward player', () => {
      game.enemies.push({
        type: 'regular',
        x: 500,
        y: 500,
        hp: 1,
        maxHP: 1
      });

      const initialX = game.enemies[0].x;
      const initialY = game.enemies[0].y;

      game.updateEnemies(1.0);

      // Enemy should have moved closer to player at (0, 0)
      expect(game.enemies[0].x).toBeLessThan(initialX);
      expect(game.enemies[0].y).toBeLessThan(initialY);
    });

    test('should apply speed multiplier to enemy movement', () => {
      game.difficultyMultipliers.speed = 2.0;
      game.enemies.push({
        type: 'regular',
        x: 500,
        y: 0,
        hp: 1,
        maxHP: 1
      });

      const initialX = game.enemies[0].x;
      game.updateEnemies(1.0);

      const distanceMoved = initialX - game.enemies[0].x;
      const expectedDistance = CONFIG.enemy.speed * 2.0 * 1.0;

      expect(distanceMoved).toBeCloseTo(expectedDistance, 1);
    });

    test('should move boss slower than regular enemies', () => {
      game.enemies.push({
        type: 'regular',
        x: 500,
        y: 0,
        hp: 1,
        maxHP: 1
      });

      game.enemies.push({
        type: 'boss',
        x: 500,
        y: 0,
        hp: CONFIG.boss.health,
        maxHP: CONFIG.boss.health,
        lastProjectileTime: 0
      });

      const initialRegularX = game.enemies[0].x;
      const initialBossX = game.enemies[1].x;

      game.updateEnemies(1.0);

      const regularDistance = initialRegularX - game.enemies[0].x;
      const bossDistance = initialBossX - game.enemies[1].x;

      expect(bossDistance).toBeLessThan(regularDistance);
      expect(CONFIG.boss.speed).toBeLessThan(CONFIG.enemy.speed);
    });
  });

  describe('Enemy-Player Collision', () => {
    test('should damage player when enemy collides', () => {
      const initialHP = game.player.hp;

      game.enemies.push({
        type: 'regular',
        x: game.player.worldX,
        y: game.player.worldY,
        hp: 1,
        maxHP: 1
      });

      game.updateEnemies(0.016);

      expect(game.player.hp).toBeLessThan(initialHP);
    });

    test('should damage player more when boss collides', () => {
      game.player.lastDamageTime = 0;
      const initialHP = game.player.hp;

      game.enemies.push({
        type: 'boss',
        x: game.player.worldX,
        y: game.player.worldY,
        hp: CONFIG.boss.health,
        maxHP: CONFIG.boss.health,
        lastProjectileTime: 0
      });

      game.updateEnemies(0.016);

      expect(game.player.hp).toBe(initialHP - CONFIG.boss.damage);
    });
  });

  describe('Boss Projectiles', () => {
    test('should fire projectiles at regular intervals', () => {
      game.state.currentTime = 5000;
      game.enemies.push({
        type: 'boss',
        x: 100,
        y: 100,
        hp: CONFIG.boss.health,
        maxHP: CONFIG.boss.health,
        lastProjectileTime: 0
      });

      const initialProjectileCount = game.projectiles.length;
      game.updateEnemies(0.016);

      expect(game.projectiles.length).toBe(initialProjectileCount + 1);
      expect(game.projectiles[0].type).toBe('bossProjectile');
    });

    test('should not fire boss projectiles too frequently', () => {
      game.state.currentTime = 1000;
      game.enemies.push({
        type: 'boss',
        x: 100,
        y: 100,
        hp: CONFIG.boss.health,
        maxHP: CONFIG.boss.health,
        lastProjectileTime: 999
      });

      game.updateEnemies(0.016);

      expect(game.projectiles.length).toBe(0);
    });

    test('should create boss projectile aimed at player', () => {
      game.player.worldX = 200;
      game.player.worldY = 200;

      const boss = {
        type: 'boss',
        x: 100,
        y: 100,
        hp: CONFIG.boss.health,
        maxHP: CONFIG.boss.health,
        lastProjectileTime: 0
      };

      game.spawnBossProjectile(boss);

      expect(game.projectiles.length).toBe(1);
      const proj = game.projectiles[0];

      expect(proj.type).toBe('bossProjectile');
      expect(proj.damage).toBe(CONFIG.boss.projectileDamage);
      expect(proj.size).toBe(CONFIG.boss.projectileSize);

      // Velocity should point toward player
      expect(proj.vx).toBeGreaterThan(0);
      expect(proj.vy).toBeGreaterThan(0);
    });
  });

  describe('Boss Spawning via Difficulty', () => {
    test('should reset bossSpawned flag when boss dies', () => {
      game.bossSpawned = true;
      game.enemies.push({
        type: 'boss',
        x: 100,
        y: 100,
        hp: 1,
        maxHP: CONFIG.boss.health
      });

      game.projectiles.push({
        type: 'regular',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        damage: 10,
        size: CONFIG.projectile.size
      });

      game.updateProjectiles(0.016);

      expect(game.bossSpawned).toBe(false);
    });
  });
});
