/**
 * Difficulty Scaling Tests
 * Tests for difficulty multipliers and spawn rate scaling
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Difficulty System', () => {
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

  describe('Difficulty Multipliers', () => {
    test('should initialize with 1.0 multipliers', () => {
      expect(game.difficultyMultipliers.speed).toBe(1.0);
      expect(game.difficultyMultipliers.damage).toBe(1.0);
      expect(game.difficultyMultipliers.hp).toBe(1.0);
    });

    test('should increase multipliers after 1 minute', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000; // 1 minute

      game.updateDifficulty();

      expect(game.difficultyMultipliers.speed).toBe(1.0 + CONFIG.difficulty.speedMultiplierPerMinute);
      expect(game.difficultyMultipliers.damage).toBe(1.0 + CONFIG.difficulty.damageMultiplierPerMinute);
      expect(game.difficultyMultipliers.hp).toBe(1.0 + CONFIG.difficulty.hpMultiplierPerMinute);
    });

    test('should scale speed multiplier at +100% per minute', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;

      game.updateDifficulty();

      expect(game.difficultyMultipliers.speed).toBe(2.0);
    });

    test('should scale damage multiplier at +80% per minute', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;

      game.updateDifficulty();

      expect(game.difficultyMultipliers.damage).toBe(1.8);
    });

    test('should scale HP multiplier at +60% per minute', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;

      game.updateDifficulty();

      expect(game.difficultyMultipliers.hp).toBe(1.6);
    });

    test('should scale continuously over time', () => {
      game.state.startTime = 0;
      game.state.currentTime = 120000; // 2 minutes

      game.updateDifficulty();

      expect(game.difficultyMultipliers.speed).toBeCloseTo(3.0, 1);
      expect(game.difficultyMultipliers.damage).toBeCloseTo(2.6, 1);
      expect(game.difficultyMultipliers.hp).toBeCloseTo(2.2, 1);
    });

    test('should scale at half-minute intervals correctly', () => {
      game.state.startTime = 0;
      game.state.currentTime = 30000; // 30 seconds

      game.updateDifficulty();

      expect(game.difficultyMultipliers.speed).toBeCloseTo(1.5, 1);
      expect(game.difficultyMultipliers.damage).toBeCloseTo(1.4, 1);
      expect(game.difficultyMultipliers.hp).toBeCloseTo(1.3, 1);
    });
  });

  describe('Spawn Rate Scaling', () => {
    test('should start with initial spawn interval', () => {
      expect(game.currentSpawnInterval).toBe(CONFIG.enemy.initialSpawnInterval);
    });

    test('should reduce spawn interval over time (quadratic)', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000; // 1 minute

      game.updateDifficulty();

      const timeInMinutes = 1;
      const expectedReduction = timeInMinutes * timeInMinutes * CONFIG.difficulty.spawnQuadraticFactor;
      const expectedInterval = CONFIG.enemy.initialSpawnInterval - expectedReduction;

      expect(game.currentSpawnInterval).toBe(expectedInterval);
    });

    test('should have minimum spawn interval of 100ms', () => {
      game.state.startTime = 0;
      game.state.currentTime = 600000; // 10 minutes (very high)

      game.updateDifficulty();

      expect(game.currentSpawnInterval).toBeGreaterThanOrEqual(100);
    });

    test('should use quadratic scaling for spawn reduction', () => {
      game.state.startTime = 0;

      // At 0.5 minutes (30 seconds)
      game.state.currentTime = 30000;
      game.updateDifficulty();
      const interval30s = game.currentSpawnInterval;

      // At 1 minute
      game.state.currentTime = 60000;
      game.updateDifficulty();
      const interval1Min = game.currentSpawnInterval;

      // Reduction at 1 min should be 4x that of 30s (quadratic: 1^2 vs 0.5^2 = 4x)
      const reduction30s = CONFIG.enemy.initialSpawnInterval - interval30s;
      const reduction1Min = CONFIG.enemy.initialSpawnInterval - interval1Min;

      expect(reduction1Min).toBeCloseTo(reduction30s * 4, 0);
    });
  });

  describe('Difficulty Levels', () => {
    test('should track difficulty levels every 30 seconds', () => {
      game.state.startTime = 0;
      game.state.currentTime = 30000;

      game.updateDifficulty();

      expect(game.lastDifficultyLevel).toBe(1);
    });

    test('should show notification when reaching new difficulty level', () => {
      game.state.startTime = 0;
      game.state.currentTime = 30000;

      game.updateDifficulty();

      expect(uiManager.showDifficultyNotification).toHaveBeenCalledWith(1, game.difficultyMultipliers);
    });

    test('should not show notification for level 0', () => {
      game.state.startTime = 0;
      game.state.currentTime = 15000;

      game.updateDifficulty();

      expect(uiManager.showDifficultyNotification).not.toHaveBeenCalled();
    });

    test('should only trigger notification once per level', () => {
      game.state.startTime = 0;
      game.state.currentTime = 30000;

      game.updateDifficulty();
      game.updateDifficulty();

      expect(uiManager.showDifficultyNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Boss Spawning via Difficulty', () => {
    test('should spawn boss at difficulty level 2', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000; // 60 seconds = level 2

      game.updateDifficulty();

      expect(game.bossSpawned).toBe(true);
      expect(game.enemies.length).toBe(1);
      expect(game.enemies[0].type).toBe('boss');
    });

    test('should spawn boss at difficulty level 4', () => {
      game.state.startTime = 0;
      game.state.currentTime = 120000; // 120 seconds = level 4

      game.updateDifficulty();

      expect(game.bossSpawned).toBe(true);
    });

    test('should not spawn boss at odd difficulty levels', () => {
      game.state.startTime = 0;
      game.state.currentTime = 30000; // 30 seconds = level 1

      game.updateDifficulty();

      expect(game.bossSpawned).toBe(false);
      expect(game.enemies.length).toBe(0);

      game.state.currentTime = 90000; // 90 seconds = level 3
      game.updateDifficulty();

      expect(game.bossSpawned).toBe(false);
    });

    test('should not spawn multiple bosses if one already exists', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;

      game.updateDifficulty();
      const bossCount = game.enemies.length;

      // Try to trigger boss spawn again
      game.state.currentTime = 60001;
      game.updateDifficulty();

      expect(game.enemies.length).toBe(bossCount);
    });

    test('should allow new boss spawn after previous boss is killed', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000; // Level 2

      game.updateDifficulty();
      expect(game.bossSpawned).toBe(true);

      // Kill the boss
      game.enemies = [];
      game.bossSpawned = false;

      // Advance to level 4
      game.state.currentTime = 120000;
      game.updateDifficulty();

      expect(game.bossSpawned).toBe(true);
      expect(game.enemies.length).toBe(1);
    });

    test('should track current boss level', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;

      game.updateDifficulty();

      expect(game.currentBossLevel).toBe(2);
    });
  });

  describe('Difficulty Application to Enemies', () => {
    test('should apply HP multiplier to spawned enemies', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;
      game.updateDifficulty();

      // Clear any bosses that were auto-spawned
      game.enemies = [];

      game.spawnEnemy();

      const expectedHP = Math.ceil(1 * game.difficultyMultipliers.hp);
      const regularEnemy = game.enemies.find(e => e.type === 'regular');
      expect(regularEnemy.hp).toBe(expectedHP);
    });

    test('should apply HP multiplier to bosses', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;
      game.updateDifficulty();

      game.spawnBoss();

      const boss = game.enemies.find(e => e.type === 'boss');
      const expectedHP = Math.ceil(CONFIG.boss.health * game.difficultyMultipliers.hp);
      expect(boss.hp).toBe(expectedHP);
    });

    test('should apply speed multiplier to enemy movement', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;
      game.updateDifficulty();

      // Clear any auto-spawned enemies
      game.enemies = [];

      // Place enemy far from player to avoid collision
      game.enemies.push({
        type: 'regular',
        x: 500,
        y: 0,
        hp: 5,
        maxHP: 5
      });

      const initialX = game.enemies[0].x;
      game.updateEnemies(1.0);

      const distanceMoved = Math.abs(initialX - game.enemies[0].x);
      const expectedDistance = CONFIG.enemy.speed * game.difficultyMultipliers.speed * 1.0;

      expect(distanceMoved).toBeCloseTo(expectedDistance, 0);
    });

    test('should apply damage multiplier to player damage', () => {
      game.state.startTime = 0;
      game.state.currentTime = 60000;
      game.updateDifficulty();

      game.player.lastDamageTime = 0;
      const initialHP = game.player.hp;

      game.damagePlayer(false);

      const expectedDamage = Math.ceil(CONFIG.enemy.damage * game.difficultyMultipliers.damage);
      expect(game.player.hp).toBe(initialHP - expectedDamage);
    });
  });
});
