/**
 * Game Core Logic Tests
 * Tests for player movement, collision detection, and core game mechanics
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Game Core Logic', () => {
  let canvas, inputManager, uiManager, game;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    // Mock input manager
    inputManager = {
      getMovementDirection: jest.fn(() => ({ dx: 0, dy: 0 })),
      isAbilityPressed: jest.fn(() => false)
    };

    // Mock UI manager
    uiManager = {
      updateAll: jest.fn(),
      showGameOver: jest.fn(),
      showDifficultyNotification: jest.fn(),
      showItemPickup: jest.fn()
    };

    game = new Game(canvas, inputManager, uiManager);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(game.player.hp).toBe(CONFIG.player.maxHP);
      expect(game.player.x).toBe(CONFIG.canvas.width / 2);
      expect(game.player.y).toBe(CONFIG.canvas.height / 2);
      expect(game.player.worldX).toBe(0);
      expect(game.player.worldY).toBe(0);
      expect(game.enemies).toEqual([]);
      expect(game.projectiles).toEqual([]);
      expect(game.state.kills).toBe(0);
      expect(game.state.isRunning).toBe(false);
    });

    test('should initialize buffs with zero stacks', () => {
      expect(game.player.buffs.attackSpeed.stacks).toBe(0);
      expect(game.player.buffs.damage.stacks).toBe(0);
      expect(game.player.buffs.speed.stacks).toBe(0);
    });

    test('should initialize abilities with full charges', () => {
      expect(game.abilities.ghastFireball.currentCharges).toBe(CONFIG.ghastFireball.maxCharges);
      expect(game.abilities.ghastFireball.maxCharges).toBe(CONFIG.ghastFireball.maxCharges);
    });
  });

  describe('Player Movement', () => {
    test('should update player world position when moving right', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      const initialX = game.player.worldX;
      game.updatePlayer(1.0); // 1 second delta

      expect(game.player.worldX).toBeGreaterThan(initialX);
      expect(game.player.worldX).toBe(initialX + CONFIG.player.speed * 1.0);
    });

    test('should update player world position when moving up', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 0, dy: -1 });

      const initialY = game.player.worldY;
      game.updatePlayer(1.0);

      expect(game.player.worldY).toBeLessThan(initialY);
      expect(game.player.worldY).toBe(initialY - CONFIG.player.speed * 1.0);
    });

    test('should handle diagonal movement', () => {
      const normalized = 1 / Math.sqrt(2);
      inputManager.getMovementDirection.mockReturnValue({ dx: normalized, dy: normalized });

      const initialX = game.player.worldX;
      const initialY = game.player.worldY;
      game.updatePlayer(1.0);

      expect(game.player.worldX).toBeGreaterThan(initialX);
      expect(game.player.worldY).toBeGreaterThan(initialY);
    });

    test('should keep player screen position centered', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 1 });

      game.updatePlayer(1.0);

      expect(game.player.x).toBe(CONFIG.canvas.width / 2);
      expect(game.player.y).toBe(CONFIG.canvas.height / 2);
    });

    test('should update camera to follow player', () => {
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      game.updatePlayer(1.0);

      const expectedCameraX = game.player.worldX - CONFIG.canvas.width / 2 + CONFIG.player.size / 2;
      const expectedCameraY = game.player.worldY - CONFIG.canvas.height / 2 + CONFIG.player.size / 2;

      expect(game.state.camera.x).toBe(expectedCameraX);
      expect(game.state.camera.y).toBe(expectedCameraY);
    });

    test('should apply speed buff to player movement', () => {
      game.player.buffs.speed.stacks = 1;
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      const initialX = game.player.worldX;
      game.updatePlayer(1.0);

      const expectedSpeed = CONFIG.player.speed + CONFIG.items.types.speed.speedBonus;
      expect(game.player.worldX).toBe(initialX + expectedSpeed * 1.0);
    });

    test('should stack speed buffs correctly', () => {
      game.player.buffs.speed.stacks = 3;
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      const initialX = game.player.worldX;
      game.updatePlayer(1.0);

      const expectedSpeed = CONFIG.player.speed + (CONFIG.items.types.speed.speedBonus * 3);
      expect(game.player.worldX).toBe(initialX + expectedSpeed * 1.0);
    });
  });

  describe('Collision Detection', () => {
    test('should detect collision when rectangles overlap', () => {
      const result = game.checkCollision(0, 0, 10, 5, 5, 10);
      expect(result).toBe(true);
    });

    test('should not detect collision when rectangles do not overlap', () => {
      const result = game.checkCollision(0, 0, 10, 20, 20, 10);
      expect(result).toBe(false);
    });

    test('should detect edge collision', () => {
      const result = game.checkCollision(0, 0, 10, 10, 0, 10);
      expect(result).toBe(false); // AABB collision - edges touching but not overlapping
    });

    test('should detect collision with exact overlap', () => {
      const result = game.checkCollision(0, 0, 10, 0, 0, 10);
      expect(result).toBe(true);
    });
  });

  describe('Game State', () => {
    test('should start game correctly', () => {
      const mockNow = 1000;
      global.performance.now = jest.fn(() => mockNow);

      game.start();

      expect(game.state.isRunning).toBe(true);
      expect(game.state.startTime).toBe(mockNow);
    });

    test('should increment kill counter when enemy dies', () => {
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

  describe('Player Damage', () => {
    test('should damage player when hit by enemy', () => {
      const initialHP = game.player.hp;
      game.damagePlayer(false);

      expect(game.player.hp).toBeLessThan(initialHP);
      expect(game.player.hp).toBe(initialHP - CONFIG.enemy.damage);
    });

    test('should damage player more when hit by boss', () => {
      const initialHP = game.player.hp;
      game.damagePlayer(true);

      expect(game.player.hp).toBe(initialHP - CONFIG.boss.damage);
      expect(CONFIG.boss.damage).toBeGreaterThan(CONFIG.enemy.damage);
    });

    test('should respect damage cooldown', () => {
      const initialHP = game.player.hp;
      game.damagePlayer(false);
      const hpAfterFirstHit = game.player.hp;

      // Try to damage again immediately
      game.damagePlayer(false);

      expect(game.player.hp).toBe(hpAfterFirstHit); // No additional damage
    });

    test('should trigger game over when HP reaches 0', () => {
      game.player.hp = 10;
      game.player.lastDamageTime = 0;

      game.damagePlayer(false);

      expect(game.state.isRunning).toBe(false);
      expect(uiManager.showGameOver).toHaveBeenCalled();
    });

    test('should apply difficulty damage multiplier', () => {
      game.difficultyMultipliers.damage = 2.0;
      game.player.lastDamageTime = 0;

      const initialHP = game.player.hp;
      game.damagePlayer(false);

      const expectedDamage = Math.ceil(CONFIG.enemy.damage * 2.0);
      expect(game.player.hp).toBe(initialHP - expectedDamage);
    });
  });
});
