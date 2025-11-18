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
            upgradeSelection: document.getElementById('upgradeSelection'),
            upgradeOptions: document.getElementById('upgradeOptions')
        };

        this.notificationTimeout = null;
        this.itemPickupTimeout = null;
        this.upgradeSelectionCallback = null;
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

        // Update the active ability (only one can be active at a time)
        if (abilities) {
            const activeAbility = abilities.ghastFireball || abilities.explodingRing || abilities.heal;
            if (activeAbility) {
                this.updateAbilityCooldown(activeAbility, gameState.currentTime);
            }
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
     * Show upgrade selection screen after boss defeat
     * @param {Object} currentAbility - The player's current ability object
     * @param {Array} availableAbilities - Array of available ability config objects
     * @param {Function} callback - Function to call when player makes a selection
     */
    showUpgradeSelection(currentAbility, availableAbilities, callback) {
        this.upgradeSelectionCallback = callback;

        // Clear previous options
        this.elements.upgradeOptions.innerHTML = '';

        // Add current ability upgrade option if not at max level
        if (currentAbility && currentAbility.level < 5) {
            const abilityKey = this.getAbilityKeyFromName(currentAbility.name);
            const abilityConfig = CONFIG[abilityKey];
            const nextLevel = currentAbility.level + 1;
            const upgrade = abilityConfig.upgrades[`level${nextLevel}`];

            const card = this.createUpgradeCard({
                type: 'upgrade',
                abilityKey: abilityKey,
                title: abilityConfig.displayName,
                level: nextLevel,
                description: upgrade.description,
                icon: this.getAbilityIcon(abilityKey),
                color: abilityConfig.color
            });

            this.elements.upgradeOptions.appendChild(card);
        }

        // Add new ability options
        availableAbilities.forEach(abilityKey => {
            const abilityConfig = CONFIG[abilityKey];

            // Skip if this is the current ability
            if (currentAbility && currentAbility.name === abilityConfig.name) {
                return;
            }

            const card = this.createUpgradeCard({
                type: 'new',
                abilityKey: abilityKey,
                title: abilityConfig.displayName,
                level: 1,
                description: abilityConfig.description,
                icon: this.getAbilityIcon(abilityKey),
                color: abilityConfig.color
            });

            this.elements.upgradeOptions.appendChild(card);
        });

        // Show the modal
        this.elements.upgradeSelection.style.display = 'block';
    }

    /**
     * Create an upgrade card element
     * @param {Object} options - Card options
     * @returns {HTMLElement} The card element
     */
    createUpgradeCard(options) {
        const card = document.createElement('div');
        card.className = `upgrade-card ${options.type === 'upgrade' ? 'current-ability' : 'new-ability'}`;

        const icon = document.createElement('div');
        icon.className = 'upgrade-card-icon';
        icon.style.backgroundColor = options.color;
        icon.textContent = options.icon;

        const title = document.createElement('div');
        title.className = 'upgrade-card-title';
        title.textContent = options.title;

        const level = document.createElement('div');
        level.className = 'upgrade-card-level';
        level.textContent = `Level ${options.level}`;

        const description = document.createElement('div');
        description.className = 'upgrade-card-description';
        description.textContent = options.description;

        const effect = document.createElement('div');
        effect.className = 'upgrade-card-effect';
        effect.textContent = options.type === 'upgrade' ? 'UPGRADE' : 'SELECT';

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(level);
        card.appendChild(description);
        card.appendChild(effect);

        // Add click handler
        card.addEventListener('click', () => {
            this.handleUpgradeSelection(options.type, options.abilityKey);
        });

        return card;
    }

    /**
     * Handle upgrade card selection
     * @param {string} type - 'upgrade' or 'new'
     * @param {string} abilityKey - The ability key (e.g., 'ghastFireball')
     */
    handleUpgradeSelection(type, abilityKey) {
        // Hide the modal
        this.elements.upgradeSelection.style.display = 'none';

        // Call the callback with the selection
        if (this.upgradeSelectionCallback) {
            this.upgradeSelectionCallback(type, abilityKey);
            this.upgradeSelectionCallback = null;
        }
    }

    /**
     * Get ability icon emoji
     * @param {string} abilityKey - The ability key
     * @returns {string} Icon emoji
     */
    getAbilityIcon(abilityKey) {
        const icons = {
            ghastFireball: '💥',
            explodingRing: '💫',
            heal: '💚'
        };
        return icons[abilityKey] || '⭐';
    }

    /**
     * Get ability key from ability name
     * @param {string} name - The ability name (e.g., 'GhastFireball')
     * @returns {string} The ability key (e.g., 'ghastFireball')
     */
    getAbilityKeyFromName(name) {
        const mapping = {
            'Ghast Fireball': 'ghastFireball',
            'GhastFireball': 'ghastFireball',
            'ExplodingRing': 'explodingRing',
            'Heal': 'heal'
        };
        return mapping[name] || 'ghastFireball';
    }
}
