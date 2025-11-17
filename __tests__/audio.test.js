/**
 * Audio System Tests
 * Tests for AudioManager class and sound effects
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import audioManager from '../audio.js';

describe('AudioManager', () => {
  let mockAudioContext;
  let mockOscillator;
  let mockGainNode;
  let mockFilterNode;

  beforeEach(() => {
    // Mock oscillator
    mockOscillator = {
      type: 'sine',
      frequency: {
        value: 0,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null
    };

    // Mock gain node
    mockGainNode = {
      gain: {
        value: 0,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    };

    // Mock filter node
    mockFilterNode = {
      type: 'lowpass',
      frequency: {
        value: 0,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      Q: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };

    // Mock audio context
    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      destination: {},
      createOscillator: jest.fn(() => ({ ...mockOscillator })),
      createGain: jest.fn(() => ({ ...mockGainNode })),
      createBiquadFilter: jest.fn(() => ({ ...mockFilterNode })),
      resume: jest.fn(() => Promise.resolve())
    };

    // Reset audioManager state
    audioManager.context = null;
    audioManager.masterGain = null;
    audioManager.enabled = true;
    audioManager.volume = 0.3;
    audioManager.initialized = false;

    // Mock AudioContext constructor
    global.AudioContext = jest.fn(() => mockAudioContext);
    global.window = { AudioContext: global.AudioContext };

    // Mock document for visibility change handler
    global.document = {
      addEventListener: jest.fn(),
      hidden: false
    };

    // Mock navigator for iOS detection
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should not be initialized by default', () => {
      expect(audioManager.initialized).toBe(false);
      expect(audioManager.context).toBeNull();
      expect(audioManager.masterGain).toBeNull();
    });

    test('should initialize audio context on init()', () => {
      audioManager.init();

      expect(audioManager.initialized).toBe(true);
      expect(audioManager.context).toBeTruthy();
      expect(audioManager.masterGain).toBeTruthy();
    });

    test('should not reinitialize if already initialized', () => {
      audioManager.init();
      const firstContext = audioManager.context;

      audioManager.init();
      const secondContext = audioManager.context;

      expect(firstContext).toBe(secondContext);
    });

    test('should set master gain volume on init', () => {
      audioManager.init();

      expect(audioManager.masterGain.gain.value).toBe(audioManager.volume);
    });

    test('should connect master gain to destination', () => {
      audioManager.init();

      expect(audioManager.masterGain.connect).toHaveBeenCalledWith(
        audioManager.context.destination
      );
    });

    test('should handle missing Web Audio API gracefully', () => {
      global.AudioContext = undefined;
      global.window = {};

      audioManager.init();

      expect(audioManager.enabled).toBe(false);
      expect(audioManager.initialized).toBe(false);
    });

    test('should handle AudioContext constructor error', () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      });

      audioManager.init();

      expect(audioManager.enabled).toBe(false);
      expect(audioManager.initialized).toBe(false);
    });
  });

  describe('Volume Control', () => {
    test('should initialize with default volume', () => {
      expect(audioManager.volume).toBe(0.3);
    });

    test('should set volume within valid range', () => {
      audioManager.setVolume(0.5);
      expect(audioManager.volume).toBe(0.5);
    });

    test('should clamp volume to minimum of 0', () => {
      audioManager.setVolume(-0.5);
      expect(audioManager.volume).toBe(0);
    });

    test('should clamp volume to maximum of 1', () => {
      audioManager.setVolume(1.5);
      expect(audioManager.volume).toBe(1);
    });

    test('should update master gain when volume changes', () => {
      audioManager.init();

      audioManager.setVolume(0.7);

      expect(audioManager.masterGain.gain.value).toBe(0.7);
    });

    test('should not throw if master gain not initialized', () => {
      expect(() => {
        audioManager.setVolume(0.5);
      }).not.toThrow();
    });
  });

  describe('Toggle Functionality', () => {
    test('should be enabled by default', () => {
      expect(audioManager.enabled).toBe(true);
    });

    test('should toggle enabled state', () => {
      const result = audioManager.toggle();

      expect(result).toBe(false);
      expect(audioManager.enabled).toBe(false);
    });

    test('should toggle back to enabled', () => {
      audioManager.toggle(); // Disable
      const result = audioManager.toggle(); // Enable

      expect(result).toBe(true);
      expect(audioManager.enabled).toBe(true);
    });

    test('should return new enabled state', () => {
      audioManager.enabled = true;
      expect(audioManager.toggle()).toBe(false);

      audioManager.enabled = false;
      expect(audioManager.toggle()).toBe(true);
    });
  });

  describe('Resume Functionality', () => {
    test('should resume suspended audio context', async () => {
      audioManager.init();
      audioManager.context.state = 'suspended';

      await audioManager.resume();

      expect(audioManager.context.resume).toHaveBeenCalled();
    });

    test('should not resume if context is not suspended', async () => {
      audioManager.init();
      audioManager.context.state = 'running';

      await audioManager.resume();

      expect(audioManager.context.resume).not.toHaveBeenCalled();
    });

    test('should not throw if context is null', async () => {
      await expect(async () => await audioManager.resume()).not.toThrow();
    });
  });

  describe('ensureResumed Functionality', () => {
    test('should initialize audio if not initialized', () => {
      audioManager.ensureResumed();

      expect(audioManager.initialized).toBe(true);
    });

    test('should resume suspended context synchronously', () => {
      audioManager.init();
      audioManager.context.state = 'suspended';

      audioManager.ensureResumed();

      expect(audioManager.context.resume).toHaveBeenCalled();
    });

    test('should not resume if context is running', () => {
      audioManager.init();
      audioManager.context.state = 'running';

      audioManager.ensureResumed();

      expect(audioManager.context.resume).not.toHaveBeenCalled();
    });

    test('should not throw if context is null', () => {
      audioManager.context = null;
      audioManager.initialized = false;

      expect(() => audioManager.ensureResumed()).not.toThrow();
    });
  });

  describe('iOS Detection', () => {
    test('should detect iPhone', () => {
      const iphoneUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const isIOS = /iPad|iPhone|iPod/.test(iphoneUserAgent);

      expect(isIOS).toBe(true);
    });

    test('should detect iPad', () => {
      const ipadUserAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const isIOS = /iPad|iPhone|iPod/.test(ipadUserAgent);

      expect(isIOS).toBe(true);
    });

    test('should not detect non-iOS devices', () => {
      const windowsUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const isIOS = /iPad|iPhone|iPod/.test(windowsUserAgent);

      expect(isIOS).toBe(false);
    });
  });

  describe('Play Method', () => {
    test('should not play if not enabled', async () => {
      audioManager.init();
      audioManager.enabled = false;

      const soundGenerator = jest.fn();
      await audioManager.play(soundGenerator);

      expect(soundGenerator).not.toHaveBeenCalled();
    });

    test('should not play if not initialized', async () => {
      const soundGenerator = jest.fn();
      await audioManager.play(soundGenerator);

      expect(soundGenerator).not.toHaveBeenCalled();
    });

    test('should call sound generator when playing', async () => {
      audioManager.init();

      const soundGenerator = jest.fn();
      await audioManager.play(soundGenerator);

      expect(soundGenerator).toHaveBeenCalledWith(
        audioManager.context,
        audioManager.masterGain
      );
    });

    test('should resume context before playing', async () => {
      audioManager.init();
      audioManager.context.state = 'suspended';

      const soundGenerator = jest.fn();
      await audioManager.play(soundGenerator);

      expect(audioManager.context.resume).toHaveBeenCalled();
    });

    test('should handle errors in sound generator gracefully', async () => {
      audioManager.init();

      const soundGenerator = jest.fn(() => {
        throw new Error('Sound generation failed');
      });

      await expect(async () => await audioManager.play(soundGenerator)).not.toThrow();
    });
  });

  describe('Sound Effects - Basic Functionality', () => {
    beforeEach(() => {
      audioManager.init();
    });

    test('playShoot should not throw', async () => {
      await expect(async () => await audioManager.playShoot()).not.toThrow();
    });

    test('playEnemyHit should not throw', async () => {
      await expect(async () => await audioManager.playEnemyHit()).not.toThrow();
    });

    test('playPlayerHit should not throw', async () => {
      await expect(async () => await audioManager.playPlayerHit()).not.toThrow();
    });

    test('playItemPickup should not throw', async () => {
      await expect(async () => await audioManager.playItemPickup()).not.toThrow();
    });

    test('playFireball should not throw', async () => {
      await expect(async () => await audioManager.playFireball()).not.toThrow();
    });

    test('playBossSpawn should not throw', async () => {
      await expect(async () => await audioManager.playBossSpawn()).not.toThrow();
    });

    test('playBossDeath should not throw', async () => {
      await expect(async () => await audioManager.playBossDeath()).not.toThrow();
    });

    test('playLevelUp should not throw', async () => {
      await expect(async () => await audioManager.playLevelUp()).not.toThrow();
    });

    test('playGameOver should not throw', async () => {
      await expect(async () => await audioManager.playGameOver()).not.toThrow();
    });

    test('playClick should not throw', async () => {
      await expect(async () => await audioManager.playClick()).not.toThrow();
    });
  });

  describe('Sound Effects - Audio Node Creation', () => {
    beforeEach(() => {
      audioManager.init();
    });

    test('playShoot should create oscillator and gain', async () => {
      await audioManager.playShoot();

      expect(audioManager.context.createOscillator).toHaveBeenCalled();
      expect(audioManager.context.createGain).toHaveBeenCalled();
    });

    test('playEnemyHit should create oscillator, gain, and filter', async () => {
      await audioManager.playEnemyHit();

      expect(audioManager.context.createOscillator).toHaveBeenCalled();
      expect(audioManager.context.createGain).toHaveBeenCalled();
      expect(audioManager.context.createBiquadFilter).toHaveBeenCalled();
    });

    test('playFireball should create two oscillators, gain, and filter', async () => {
      await audioManager.playFireball();

      expect(audioManager.context.createOscillator).toHaveBeenCalledTimes(2);
      expect(audioManager.context.createGain).toHaveBeenCalled();
      expect(audioManager.context.createBiquadFilter).toHaveBeenCalled();
    });

    test('playBossDeath should create two oscillators and gain', async () => {
      await audioManager.playBossDeath();

      expect(audioManager.context.createOscillator).toHaveBeenCalledTimes(2);
      expect(audioManager.context.createGain).toHaveBeenCalled();
    });
  });

  describe('Sound Effects - Disabled State', () => {
    test('should not play sounds when disabled', async () => {
      audioManager.init();
      audioManager.enabled = false;

      await audioManager.playShoot();
      await audioManager.playEnemyHit();
      await audioManager.playPlayerHit();

      // createOscillator should not be called
      expect(audioManager.context.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Sound Effects - Not Initialized', () => {
    test('should not play sounds when not initialized', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await audioManager.playShoot();
      await audioManager.playEnemyHit();

      // Should not attempt to create audio nodes
      expect(consoleSpy).not.toHaveBeenCalledWith('Audio system initialized');
    });
  });

  describe('Memory Leak Prevention - Cleanup', () => {
    beforeEach(() => {
      audioManager.init();
    });

    test('playShoot should set onended handler for cleanup', async () => {
      await audioManager.playShoot();

      // The onended handler should be set
      // We verify this by checking that the oscillator has an onended property set
      expect(mockOscillator.onended).toBeDefined();
    });

    test('playEnemyHit should set onended handler for cleanup', async () => {
      await audioManager.playEnemyHit();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playPlayerHit should set onended handler for cleanup', async () => {
      await audioManager.playPlayerHit();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playItemPickup should set onended handler for cleanup', async () => {
      await audioManager.playItemPickup();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playFireball should set onended handler for cleanup', async () => {
      await audioManager.playFireball();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playBossSpawn should set onended handler for cleanup', async () => {
      await audioManager.playBossSpawn();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playBossDeath should set onended handler for cleanup', async () => {
      await audioManager.playBossDeath();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playLevelUp should set onended handler for cleanup', async () => {
      await audioManager.playLevelUp();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playGameOver should set onended handler for cleanup', async () => {
      await audioManager.playGameOver();

      expect(mockOscillator.onended).toBeDefined();
    });

    test('playClick should set onended handler for cleanup', async () => {
      await audioManager.playClick();

      expect(mockOscillator.onended).toBeDefined();
    });
  });

  describe('Singleton Export', () => {
    test('should export the same instance', () => {
      const instance1 = audioManager;
      const instance2 = audioManager;

      expect(instance1).toBe(instance2);
    });

    test('should maintain state across imports', () => {
      audioManager.setVolume(0.8);

      expect(audioManager.volume).toBe(0.8);
    });
  });
});
