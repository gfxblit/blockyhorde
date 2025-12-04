/**
 * UI Module
 * Handles all user interface updates and DOM manipulation
 */
import { CONFIG } from './config.js';
import audioManager from './audio.js';

/**
 * UI Manager
 */
export class UIManager {
    constructor() {
        this.elements = {
            hpValue: document.getElementById('hpValue'),
            healthFill: document.getElementById('healthFill'),
            timeValue: document.getElementById('timeValue'),
            killsValue: document.getElementById('killsValue'),
            gameOver: document.getElementById('gameOver'),
            finalTime: document.getElementById('finalTime'),
            finalKills: document.getElementById('finalKills'),
            playAgainButton: null,
            abilityCooldown: document.getElementById('abilityCooldown'),
            abilityCharges: document.getElementById('abilityCharges'),
            difficultyNotification: document.getElementById('difficultyNotification'),
            itemPickupNotification: document.getElementById('itemPickupNotification'),
            audioToggle: document.getElementById('audioToggle'),
            specialUpgradeOverlay: document.getElementById('specialUpgradeOverlay'),
            specialOptions: document.getElementById('specialOptions')
        };

        this.notificationTimeout = null;
        this.itemPickupTimeout = null;
        this.specialSelectCallback = null;
        this.initializeEventListeners();
    }

    /**
     * Initialize UI event listeners
     */
    initializeEventListeners() {
        // Find play again button and add event listener
        const playAgainButton = this.elements.gameOver.querySelector('button');
        if (playAgainButton) {
            this.elements.playAgainButton = playAgainButton;

            // Handle play again for both touch and mouse
            const handlePlayAgain = (e) => {
                e.preventDefault();
                e.stopPropagation();
                location.reload();
            };

            // Add both touch and click listeners for better touch device support
            playAgainButton.addEventListener('touchend', handlePlayAgain, { passive: false });
            playAgainButton.addEventListener('click', handlePlayAgain);
        }

        // Audio toggle button
        if (this.elements.audioToggle) {
            this.elements.audioToggle.addEventListener('click', () => {
                // Ensure audio is ready on click (critical for iOS Safari)
                audioManager.ensureResumed();
                const enabled = audioManager.toggle();
                this.updateAudioToggle(enabled);
                // Play click sound to confirm toggle
                if (enabled) {
                    audioManager.playClick();
                }
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.detectTouchDevice();
        });
    }

    /**
     * Update audio toggle button appearance
     * @param {boolean} enabled - Whether audio is enabled
     */
    updateAudioToggle(enabled) {
        if (!this.elements.audioToggle) return;

        if (enabled) {
            this.elements.audioToggle.textContent = '🔊';
            this.elements.audioToggle.classList.remove('muted');
            this.elements.audioToggle.title = 'Mute Sound';
        } else {
            this.elements.audioToggle.textContent = '🔇';
            this.elements.audioToggle.classList.add('muted');
            this.elements.audioToggle.title = 'Unmute Sound';
        }
    }

    /**
     * Detect touch device and adjust UI
     */
    detectTouchDevice() {
        const isTouchDevice = ('ontouchstart' in window) ||
                              (navigator.maxTouchPoints > 0) ||
                              (navigator.msMaxTouchPoints > 0);

        if (isTouchDevice || window.innerWidth <= 850) {
            document.getElementById('touchControls').style.display = 'block';
            document.querySelector('.instructions.desktop').style.display = 'none';
            document.querySelector('.instructions.mobile').style.display = 'block';
        }
    }

    /**
     * Update player health display
     * @param {number} currentHP - Current player HP
     */
    updateHealth(currentHP) {
        const displayHP = Math.max(0, Math.floor(currentHP));
        this.elements.hpValue.textContent = displayHP;

        const hpPercent = Math.max(0, (currentHP / CONFIG.player.maxHP) * 100);
        this.elements.healthFill.style.width = hpPercent + '%';
    }

    /**
     * Update time display
     * @param {number} startTime - Game start timestamp
     * @param {number} currentTime - Current timestamp
     */
    updateTime(startTime, currentTime) {
        const timeInSeconds = Math.floor((currentTime - startTime) / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        this.elements.timeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Update kills display
     * @param {number} kills - Number of kills
     */
    updateKills(kills) {
        this.elements.killsValue.textContent = kills;
    }

    /**
     * Update ability cooldown display
     * @param {Object} ability - Ability state object
     * @param {number} currentTime - Current game timestamp
     */
    updateAbilityCooldown(ability, currentTime) {
        const { currentCharges, maxCharges, lastUsedTime, cooldownDuration } = ability;

        // Update charge indicator
        let chargeText = '';
        for (let i = 0; i < maxCharges; i++) {
            chargeText += i < currentCharges ? '●' : '○';
        }
        this.elements.abilityCharges.textContent = chargeText;

        // Toggle depleted class
        if (currentCharges > 0) {
            this.elements.abilityCharges.classList.remove('depleted');
        } else {
            this.elements.abilityCharges.classList.add('depleted');
        }

        // Update cooldown overlay
        if (currentCharges < maxCharges) {
            const timeSinceLastUse = currentTime - lastUsedTime;
            const cooldownProgress = Math.min(1, timeSinceLastUse / cooldownDuration);
            this.elements.abilityCooldown.style.setProperty('--cooldown-progress', cooldownProgress);
        } else {
            this.elements.abilityCooldown.style.setProperty('--cooldown-progress', 1);
        }
    }

    /**
     * Update all UI elements
     * @param {Object} gameState - Current game state
     * @param {Object} player - Player object
     * @param {Object} abilities - Abilities state object (optional)
     */
    updateAll(gameState, player, abilities = null) {
        this.updateHealth(player.hp);
        this.updateTime(gameState.startTime, gameState.currentTime);
        this.updateKills(gameState.kills);

        if (abilities && abilities.ghastFireball) {
            this.updateAbilityCooldown(abilities.ghastFireball, gameState.currentTime);
        }
    }

    /**
     * Show game over screen
     * @param {number} startTime - Game start timestamp
     * @param {number} endTime - Game end timestamp
     * @param {number} kills - Final kill count
     */
    showGameOver(startTime, endTime, kills) {
        const timeInSeconds = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;

        this.elements.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.elements.finalKills.textContent = kills;
        this.elements.gameOver.style.display = 'block';
    }

    /**
     * Format time for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Show difficulty increase notification
     * @param {number} level - Current difficulty level (minute)
     * @param {Object} multipliers - Current difficulty multipliers
     */
    showDifficultyNotification(level, multipliers) {
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Format multiplier percentages
        const speedPercent = Math.round((multipliers.speed - 1) * 100);
        const damagePercent = Math.round((multipliers.damage - 1) * 100);
        const hpPercent = Math.round((multipliers.hp - 1) * 100);

        // Create notification content
        const notificationHTML = `
            <div class="difficulty-level">⚠ DIFFICULTY INCREASED ⚠</div>
            <div>Level ${level}</div>
            <div class="difficulty-stats">
                Speed +${speedPercent}% | Damage +${damagePercent}% | HP +${hpPercent}%
            </div>
        `;

        this.elements.difficultyNotification.innerHTML = notificationHTML;
        this.elements.difficultyNotification.classList.add('show');

        // Auto-hide after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            this.elements.difficultyNotification.classList.remove('show');
        }, 3000);
    }

    /**
     * Show item pickup notification
     * @param {string} itemType - Type of item picked up ('attackSpeed' or 'damage')
     * @param {number} stacks - Current number of stacks
     */
    showItemPickup(itemType, stacks) {
        // Clear any existing timeout
        if (this.itemPickupTimeout) {
            clearTimeout(this.itemPickupTimeout);
        }

        // Get item configuration
        const itemConfig = CONFIG.items.types[itemType];
        if (!itemConfig) return;

        // Create notification content based on item type
        let notificationHTML = '';
        let cssClass = '';

        if (itemType === 'attackSpeed') {
            notificationHTML = `<span class="item-icon">⚡</span> Attack Speed +${stacks}`;
            cssClass = 'attack-speed';
        } else if (itemType === 'damage') {
            notificationHTML = `<span class="item-icon">💥</span> Damage +${stacks}`;
            cssClass = 'damage';
        } else if (itemType === 'speed') {
            notificationHTML = `<span class="item-icon">🏃</span> Speed +${stacks}`;
            cssClass = 'speed';
        } else if (itemType === 'health') {
            notificationHTML = `<span class="item-icon">💚</span> Healed +${stacks}`;
            cssClass = 'health';
        }

        // Remove previous classes
        this.elements.itemPickupNotification.classList.remove('attack-speed', 'damage', 'speed', 'health');

        // Set content and class
        this.elements.itemPickupNotification.innerHTML = notificationHTML;
        this.elements.itemPickupNotification.classList.add(cssClass);
        this.elements.itemPickupNotification.classList.add('show');

        // Auto-hide after 1.5 seconds
        this.itemPickupTimeout = setTimeout(() => {
            this.elements.itemPickupNotification.classList.remove('show');
        }, 1500);
    }

    /**
     * Show the special upgrade selection UI
     * @param {string} currentSpecial - The currently equipped special ability key
     * @param {Object} specialLevels - Object mapping special keys to their current levels
     * @param {Function} onSelect - Callback function when a special is selected
     */
    showSpecialUpgradeUI(currentSpecial, specialLevels, onSelect) {
        this.specialSelectCallback = onSelect;

        // Clear existing options
        this.elements.specialOptions.innerHTML = '';

        // Get all available specials from config
        const specials = CONFIG.specials;

        // Create option for each special
        for (const [key, config] of Object.entries(specials)) {
            const level = specialLevels[key] || 0;
            const isCurrent = key === currentSpecial;
            const isMaxLevel = level >= 5;

            const option = document.createElement('div');
            option.className = 'special-option';

            if (isCurrent) {
                option.classList.add('current');
                if (!isMaxLevel) {
                    option.classList.add('upgrade');
                }
            }

            // Determine what happens on selection
            let actionText = '';
            let upgradeBonus = '';

            if (isCurrent && !isMaxLevel) {
                // Upgrade current special
                const nextLevel = level + 1;
                const upgradeConfig = config.upgrades[nextLevel];
                if (upgradeConfig) {
                    upgradeBonus = upgradeConfig.description;
                }
                actionText = `Level ${level} → ${nextLevel}`;
            } else if (!isCurrent && level === 0) {
                // Pick new special (starts at level 1)
                actionText = 'NEW - Level 1';
            } else if (!isCurrent) {
                // Switch to different special (keep its level)
                actionText = `Switch (Level ${level})`;
            } else {
                // Max level
                actionText = 'MAX LEVEL';
            }

            option.innerHTML = `
                <span class="special-icon">${config.icon}</span>
                <div class="special-name">${config.name}</div>
                <div class="special-level">${actionText}</div>
                <div class="special-description">${config.description}</div>
                ${upgradeBonus ? `<div class="special-upgrade-bonus">${upgradeBonus}</div>` : ''}
            `;

            // Add click handler (unless max level on current)
            if (!(isCurrent && isMaxLevel)) {
                const handleSelect = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideSpecialUpgradeUI();
                    if (this.specialSelectCallback) {
                        this.specialSelectCallback(key);
                    }
                };

                option.addEventListener('click', handleSelect);
                option.addEventListener('touchend', handleSelect, { passive: false });
            } else {
                option.style.opacity = '0.6';
                option.style.cursor = 'not-allowed';
            }

            this.elements.specialOptions.appendChild(option);
        }

        // Show the overlay
        this.elements.specialUpgradeOverlay.classList.add('show');

        // Play a sound effect
        audioManager.playLevelUp();
    }

    /**
     * Hide the special upgrade UI
     */
    hideSpecialUpgradeUI() {
        this.elements.specialUpgradeOverlay.classList.remove('show');
        this.specialSelectCallback = null;
    }

    /**
     * Check if special upgrade UI is currently showing
     * @returns {boolean}
     */
    isSpecialUpgradeUIVisible() {
        return this.elements.specialUpgradeOverlay.classList.contains('show');
    }
}
