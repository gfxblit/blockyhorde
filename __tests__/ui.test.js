/**
 * UI Manager Tests
 * Tests for UI updates, especially cooldown timer behavior
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UIManager } from '../ui.js';
import { CONFIG } from '../config.js';

describe('UIManager', () => {
  let uiManager;
  let mockElements;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="hpValue">100</div>
      <div id="healthFill" style="width: 100%"></div>
      <div id="timeValue">0:00</div>
      <div id="killsValue">0</div>
      <div id="gameOver" style="display: none"></div>
      <div id="finalTime">0:00</div>
      <div id="finalKills">0</div>
      <div id="abilityCooldown" style="--cooldown-progress: 0"></div>
      <div id="abilityCharges">●</div>
      <div id="difficultyNotification"></div>
      <div id="itemPickupNotification"></div>
      <div id="audioToggle"></div>
      <div id="specialUpgradeOverlay"></div>
      <div id="specialOptions"></div>
    `;

    uiManager = new UIManager();
  });

  describe('Cooldown Timer Display', () => {
    test('should update cooldown for ghastFireball when passed as currentSpecial', () => {
      const gameState = {
        startTime: 0,
        currentTime: 5000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        },
        explodingRing: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 15000
        }
      };

      uiManager.updateAll(gameState, player, abilities, 'ghastFireball');

      const cooldownProgress = parseFloat(
        uiManager.elements.abilityCooldown.style.getPropertyValue('--cooldown-progress')
      );

      // Should be 50% complete (5000ms / 10000ms)
      expect(cooldownProgress).toBeCloseTo(0.5, 1);
    });

    test('should update cooldown for explodingRing when passed as currentSpecial', () => {
      const gameState = {
        startTime: 0,
        currentTime: 7500,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        },
        explodingRing: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 15000
        }
      };

      uiManager.updateAll(gameState, player, abilities, 'explodingRing');

      const cooldownProgress = parseFloat(
        uiManager.elements.abilityCooldown.style.getPropertyValue('--cooldown-progress')
      );

      // Should be 50% complete (7500ms / 15000ms)
      expect(cooldownProgress).toBeCloseTo(0.5, 1);
    });

    test('should update cooldown for heal when passed as currentSpecial', () => {
      const gameState = {
        startTime: 0,
        currentTime: 10000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        },
        heal: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 20000
        }
      };

      uiManager.updateAll(gameState, player, abilities, 'heal');

      const cooldownProgress = parseFloat(
        uiManager.elements.abilityCooldown.style.getPropertyValue('--cooldown-progress')
      );

      // Should be 50% complete (10000ms / 20000ms)
      expect(cooldownProgress).toBeCloseTo(0.5, 1);
    });

    test('should update charge display for current special', () => {
      const gameState = {
        startTime: 0,
        currentTime: 5000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        },
        explodingRing: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 15000
        }
      };

      // Update for ghastFireball (0 charges)
      uiManager.updateAll(gameState, player, abilities, 'ghastFireball');
      expect(uiManager.elements.abilityCharges.textContent).toBe('○');
      expect(uiManager.elements.abilityCharges.classList.contains('depleted')).toBe(true);

      // Switch to explodingRing (1 charge)
      uiManager.updateAll(gameState, player, abilities, 'explodingRing');
      expect(uiManager.elements.abilityCharges.textContent).toBe('●');
      expect(uiManager.elements.abilityCharges.classList.contains('depleted')).toBe(false);
    });

    test('should NOT use hardcoded ghastFireball when currentSpecial is different', () => {
      const gameState = {
        startTime: 0,
        currentTime: 5000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        },
        explodingRing: {
          currentCharges: 0,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 20000
        }
      };

      // When explodingRing is current, it should use explodingRing's cooldown (20000)
      // not ghastFireball's cooldown (10000)
      uiManager.updateAll(gameState, player, abilities, 'explodingRing');

      const cooldownProgress = parseFloat(
        uiManager.elements.abilityCooldown.style.getPropertyValue('--cooldown-progress')
      );

      // Should be 25% complete (5000ms / 20000ms) for explodingRing
      // NOT 50% (5000ms / 10000ms) for ghastFireball
      expect(cooldownProgress).toBeCloseTo(0.25, 1);
      expect(cooldownProgress).not.toBeCloseTo(0.5, 1);
    });

    test('should handle abilities parameter being null', () => {
      const gameState = {
        startTime: 0,
        currentTime: 5000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      // Should not throw when abilities is null
      expect(() => {
        uiManager.updateAll(gameState, player, null, 'ghastFireball');
      }).not.toThrow();
    });

    test('should handle currentSpecial not existing in abilities', () => {
      const gameState = {
        startTime: 0,
        currentTime: 5000,
        kills: 0
      };

      const player = {
        hp: 100
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        }
      };

      // Should not throw when currentSpecial doesn't exist in abilities
      expect(() => {
        uiManager.updateAll(gameState, player, abilities, 'nonexistent');
      }).not.toThrow();
    });
  });

  describe('Health Display', () => {
    test('should update health value', () => {
      uiManager.updateHealth(75);
      expect(uiManager.elements.hpValue.textContent).toBe('75');
    });

    test('should update health fill width', () => {
      uiManager.updateHealth(50);
      const expectedWidth = (50 / CONFIG.player.maxHP) * 100;
      expect(uiManager.elements.healthFill.style.width).toBe(`${expectedWidth}%`);
    });

    test('should not show negative health', () => {
      uiManager.updateHealth(-10);
      expect(uiManager.elements.hpValue.textContent).toBe('0');
    });
  });

  describe('Time Display', () => {
    test('should format time correctly', () => {
      const startTime = 0;
      const currentTime = 125000; // 125 seconds
      uiManager.updateTime(startTime, currentTime);
      expect(uiManager.elements.timeValue.textContent).toBe('2:05');
    });

    test('should pad seconds with zero', () => {
      const startTime = 0;
      const currentTime = 61000; // 61 seconds
      uiManager.updateTime(startTime, currentTime);
      expect(uiManager.elements.timeValue.textContent).toBe('1:01');
    });
  });

  describe('Kills Display', () => {
    test('should update kills value', () => {
      uiManager.updateKills(42);
      expect(uiManager.elements.killsValue.textContent).toBe('42');
    });
  });

  describe('updateAll Integration', () => {
    test('should update all UI elements in one call', () => {
      const gameState = {
        startTime: 0,
        currentTime: 61000,
        kills: 15
      };

      const player = {
        hp: 75
      };

      const abilities = {
        ghastFireball: {
          currentCharges: 1,
          maxCharges: 1,
          lastUsedTime: 0,
          cooldownDuration: 10000
        }
      };

      uiManager.updateAll(gameState, player, abilities, 'ghastFireball');

      expect(uiManager.elements.hpValue.textContent).toBe('75');
      expect(uiManager.elements.timeValue.textContent).toBe('1:01');
      expect(uiManager.elements.killsValue.textContent).toBe('15');
      expect(uiManager.elements.abilityCharges.textContent).toBe('●');
    });
  });
});
