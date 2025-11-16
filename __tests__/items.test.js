/**
 * Item and Buff System Tests
 * Tests for item drops, pickups, and buff effects
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Game } from '../game.js';
import { CONFIG } from '../config.js';

describe('Item and Buff System', () => {
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
    game.state.currentTime = 1000;
  });

  describe('Item Dropping', () => {
    test('should drop item with correct drop rate probability', () => {
      // Mock random to always drop
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Less than drop rate of 0.15

      game.dropItem(100, 100);

      expect(game.items.length).toBe(1);

      Math.random = originalRandom;
    });

    test('should not drop item when random exceeds drop rate', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.2); // Greater than drop rate of 0.15

      game.dropItem(100, 100);

      expect(game.items.length).toBe(0);

      Math.random = originalRandom;
    });

    test('should drop one of three item types', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // Pass drop rate check
        .mockReturnValueOnce(0.3); // Choose item type

      game.dropItem(100, 100);

      const item = game.items[0];
      expect(['attackSpeed', 'damage', 'speed']).toContain(item.type);

      Math.random = originalRandom;
    });

    test('should set spawn time for dropped items', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1);

      game.state.currentTime = 5000;
      game.dropItem(100, 100);

      expect(game.items[0].spawnTime).toBe(5000);

      Math.random = originalRandom;
    });

    test('should drop item when enemy dies', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1);

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

      expect(game.items.length).toBe(1);

      Math.random = originalRandom;
    });
  });

  describe('Item Pickup', () => {
    test('should pickup item when player is within magnet radius', () => {
      game.items.push({
        type: 'attackSpeed',
        x: game.player.worldX,
        y: game.player.worldY,
        spawnTime: game.state.currentTime
      });

      game.updateItems(game.state.currentTime + 100);

      expect(game.items.length).toBe(0);
      expect(game.player.buffs.attackSpeed.stacks).toBe(1);
    });

    test('should not pickup item when player is outside magnet radius', () => {
      game.items.push({
        type: 'attackSpeed',
        x: game.player.worldX + 1000,
        y: game.player.worldY + 1000,
        spawnTime: game.state.currentTime
      });

      game.updateItems(game.state.currentTime + 100);

      expect(game.items.length).toBe(1);
      expect(game.player.buffs.attackSpeed.stacks).toBe(0);
    });

    test('should show UI notification on item pickup', () => {
      game.items.push({
        type: 'damage',
        x: game.player.worldX,
        y: game.player.worldY,
        spawnTime: game.state.currentTime
      });

      game.updateItems(game.state.currentTime + 100);

      expect(uiManager.showItemPickup).toHaveBeenCalledWith('damage', 1);
    });
  });

  describe('Attack Speed Buff', () => {
    test('should increase buff stacks on pickup', () => {
      game.pickupItem({ type: 'attackSpeed' }, game.state.currentTime);

      expect(game.player.buffs.attackSpeed.stacks).toBe(1);
    });

    test('should stack up to max stacks', () => {
      for (let i = 0; i < 10; i++) {
        game.pickupItem({ type: 'attackSpeed' }, game.state.currentTime);
      }

      expect(game.player.buffs.attackSpeed.stacks).toBe(CONFIG.items.types.attackSpeed.maxStacks);
    });

    test('should set expiration time on pickup', () => {
      const timestamp = 5000;
      game.pickupItem({ type: 'attackSpeed' }, timestamp);

      const expectedExpiration = timestamp + CONFIG.items.types.attackSpeed.duration;
      expect(game.player.buffs.attackSpeed.expirationTime).toBe(expectedExpiration);
    });

    test('should expire after duration', () => {
      const timestamp = 5000;
      game.pickupItem({ type: 'attackSpeed' }, timestamp);

      expect(game.player.buffs.attackSpeed.stacks).toBe(1);

      // Update past expiration time
      game.updateItems(timestamp + CONFIG.items.types.attackSpeed.duration + 1);

      expect(game.player.buffs.attackSpeed.stacks).toBe(0);
    });

    test('should extend duration on additional pickup', () => {
      const timestamp1 = 5000;
      game.pickupItem({ type: 'attackSpeed' }, timestamp1);

      const timestamp2 = 10000;
      game.pickupItem({ type: 'attackSpeed' }, timestamp2);

      const expectedExpiration = timestamp2 + CONFIG.items.types.attackSpeed.duration;
      expect(game.player.buffs.attackSpeed.expirationTime).toBe(expectedExpiration);
      expect(game.player.buffs.attackSpeed.stacks).toBe(2);
    });
  });

  describe('Damage Buff', () => {
    test('should increase buff stacks on pickup', () => {
      game.pickupItem({ type: 'damage' }, game.state.currentTime);

      expect(game.player.buffs.damage.stacks).toBe(1);
    });

    test('should stack up to max stacks', () => {
      for (let i = 0; i < 10; i++) {
        game.pickupItem({ type: 'damage' }, game.state.currentTime);
      }

      expect(game.player.buffs.damage.stacks).toBe(CONFIG.items.types.damage.maxStacks);
    });

    test('should increase projectile damage', () => {
      game.player.buffs.damage.stacks = 3;
      game.enemies.push({
        type: 'regular',
        x: 100,
        y: 0,
        hp: 10,
        maxHP: 10
      });

      game.spawnProjectile();

      const expectedDamage = 1 + (3 * CONFIG.items.types.damage.damageBonus);
      expect(game.projectiles[0].damage).toBe(expectedDamage);
    });

    test('should expire after duration', () => {
      const timestamp = 5000;
      game.pickupItem({ type: 'damage' }, timestamp);

      expect(game.player.buffs.damage.stacks).toBe(1);

      game.updateItems(timestamp + CONFIG.items.types.damage.duration + 1);

      expect(game.player.buffs.damage.stacks).toBe(0);
    });
  });

  describe('Speed Buff', () => {
    test('should increase buff stacks on pickup', () => {
      game.pickupItem({ type: 'speed' }, game.state.currentTime);

      expect(game.player.buffs.speed.stacks).toBe(1);
    });

    test('should stack up to max stacks', () => {
      for (let i = 0; i < 10; i++) {
        game.pickupItem({ type: 'speed' }, game.state.currentTime);
      }

      expect(game.player.buffs.speed.stacks).toBe(CONFIG.items.types.speed.maxStacks);
    });

    test('should increase player movement speed', () => {
      game.player.buffs.speed.stacks = 2;
      inputManager.getMovementDirection.mockReturnValue({ dx: 1, dy: 0 });

      const initialX = game.player.worldX;
      game.updatePlayer(1.0);

      const expectedSpeed = CONFIG.player.speed + (2 * CONFIG.items.types.speed.speedBonus);
      expect(game.player.worldX).toBe(initialX + expectedSpeed * 1.0);
    });

    test('should be permanent (never expire)', () => {
      const timestamp = 5000;
      game.pickupItem({ type: 'speed' }, timestamp);

      expect(game.player.buffs.speed.stacks).toBe(1);

      // Update way past normal expiration time
      game.updateItems(timestamp + 1000000);

      expect(game.player.buffs.speed.stacks).toBe(1); // Still has buff
    });

    test('should set expiration time to Infinity', () => {
      game.pickupItem({ type: 'speed' }, game.state.currentTime);

      expect(game.player.buffs.speed.expirationTime).toBe(Infinity);
    });
  });

  describe('Item Despawn', () => {
    test('should despawn items after timeout', () => {
      const spawnTime = 1000;
      game.items.push({
        type: 'attackSpeed',
        x: 500,
        y: 500,
        spawnTime: spawnTime
      });

      game.updateItems(spawnTime + CONFIG.items.despawnTime + 1);

      expect(game.items.length).toBe(0);
    });

    test('should not despawn items before timeout', () => {
      const spawnTime = 1000;
      game.items.push({
        type: 'attackSpeed',
        x: 500,
        y: 500,
        spawnTime: spawnTime
      });

      game.updateItems(spawnTime + CONFIG.items.despawnTime - 100);

      expect(game.items.length).toBe(1);
    });
  });

  describe('Multiple Buff Types', () => {
    test('should allow multiple different buffs simultaneously', () => {
      game.pickupItem({ type: 'attackSpeed' }, game.state.currentTime);
      game.pickupItem({ type: 'damage' }, game.state.currentTime);
      game.pickupItem({ type: 'speed' }, game.state.currentTime);

      expect(game.player.buffs.attackSpeed.stacks).toBe(1);
      expect(game.player.buffs.damage.stacks).toBe(1);
      expect(game.player.buffs.speed.stacks).toBe(1);
    });

    test('should expire temporary buffs independently', () => {
      const timestamp = 5000;
      game.pickupItem({ type: 'attackSpeed' }, timestamp);
      game.pickupItem({ type: 'damage' }, timestamp);
      game.pickupItem({ type: 'speed' }, timestamp);

      // Expire attack speed
      game.updateItems(timestamp + CONFIG.items.types.attackSpeed.duration + 1);

      expect(game.player.buffs.attackSpeed.stacks).toBe(0);
      expect(game.player.buffs.damage.stacks).toBe(0); // Same duration
      expect(game.player.buffs.speed.stacks).toBe(1); // Permanent
    });
  });
});
