/**
 * Interactive Puppeteer Test Script
 * This script launches the game, interacts with it, and captures screenshots
 * at various states to verify functionality.
 *
 * Usage:
 *   node puppeteer-interactive-test.js [scenario]
 *
 * Scenarios:
 *   basic    - Basic gameplay test (default)
 *   combat   - Combat and enemy interaction test
 *   abilities - Special abilities test
 *   survival - Long-term survival test
 *   custom   - Run custom interaction script
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const GAME_URL = process.env.GAME_URL || 'http://localhost:3000';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './test-screenshots';
const SCENARIO = process.argv[2] || 'basic';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Find an installed browser
 */
function findBrowser() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const browserPath of possiblePaths) {
    if (fs.existsSync(browserPath)) {
      return browserPath;
    }
  }
  return null;
}

/**
 * Game interaction helpers
 */
class GameTester {
  constructor(page) {
    this.page = page;
    this.screenshotCount = 0;
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name) {
    const filename = `${String(this.screenshotCount).padStart(3, '0')}-${name}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await this.page.screenshot({ path: filepath });
    console.log(`📸 Screenshot: ${filename}`);
    this.screenshotCount++;
    return filepath;
  }

  /**
   * Wait for game to be ready
   */
  async waitForGameReady() {
    console.log('⏳ Waiting for game to initialize...');
    await this.page.waitForSelector('#gameCanvas', { timeout: 10000 });
    await this.page.waitForTimeout(2000); // Extra time for game initialization
    console.log('✅ Game ready!');
  }

  /**
   * Get game state from the page
   */
  async getGameState() {
    return await this.page.evaluate(() => {
      const hp = document.getElementById('hpValue')?.textContent || '0';
      const time = document.getElementById('timeValue')?.textContent || '0:00';
      const kills = document.getElementById('killsValue')?.textContent || '0';
      const gameOver = document.getElementById('gameOver')?.style.display !== 'none';

      return {
        hp: parseInt(hp),
        time: time,
        kills: parseInt(kills),
        gameOver: gameOver,
        isPlaying: !gameOver
      };
    });
  }

  /**
   * Press a key for a duration
   */
  async pressKey(key, duration = 1000) {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  /**
   * Move in a direction
   */
  async move(direction, duration = 1000) {
    const keyMap = {
      up: 'w',
      down: 's',
      left: 'a',
      right: 'd'
    };

    const key = keyMap[direction.toLowerCase()];
    if (!key) {
      console.warn(`Unknown direction: ${direction}`);
      return;
    }

    console.log(`🏃 Moving ${direction} for ${duration}ms`);
    await this.pressKey(key, duration);
  }

  /**
   * Shoot (press space)
   */
  async shoot(count = 1) {
    console.log(`🔫 Shooting ${count} time(s)`);
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press('Space');
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Use special ability
   */
  async useSpecialAbility() {
    console.log('✨ Using special ability');
    await this.page.click('#abilityButton');
  }

  /**
   * Click at coordinates on canvas
   */
  async clickCanvas(x, y) {
    const canvas = await this.page.$('#gameCanvas');
    const box = await canvas.boundingBox();
    await this.page.mouse.click(box.x + x, box.y + y);
  }

  /**
   * Wait and observe
   */
  async wait(duration, message = 'Waiting') {
    console.log(`⏱️  ${message} (${duration}ms)...`);
    await this.page.waitForTimeout(duration);
  }

  /**
   * Log current game state
   */
  async logState() {
    const state = await this.getGameState();
    console.log(`📊 Game State: HP=${state.hp}, Time=${state.time}, Kills=${state.kills}, Playing=${state.isPlaying}`);
    return state;
  }

  /**
   * Play for a duration with random movements
   */
  async playRandomly(duration = 10000) {
    console.log(`🎮 Playing randomly for ${duration}ms`);
    const startTime = Date.now();
    const directions = ['up', 'down', 'left', 'right'];

    while (Date.now() - startTime < duration) {
      const state = await this.getGameState();
      if (state.gameOver) {
        console.log('💀 Game over during random play');
        break;
      }

      // Random movement
      const direction = directions[Math.floor(Math.random() * directions.length)];
      await this.move(direction, 500);

      // Random shooting
      if (Math.random() > 0.5) {
        await this.shoot(1);
      }

      await this.wait(300, 'Between actions');
    }
  }
}

/**
 * Test Scenarios
 */
const scenarios = {
  /**
   * Basic gameplay test
   */
  async basic(tester) {
    console.log('\n🧪 Running BASIC gameplay test\n');

    await tester.waitForGameReady();
    await tester.screenshot('01-initial-state');
    await tester.logState();

    // Test movement in all directions
    console.log('\n▶️  Testing movement');
    await tester.move('right', 1000);
    await tester.screenshot('02-moved-right');

    await tester.move('up', 1000);
    await tester.screenshot('03-moved-up');

    await tester.move('left', 1000);
    await tester.screenshot('04-moved-left');

    await tester.move('down', 1000);
    await tester.screenshot('05-moved-down');

    // Test shooting
    console.log('\n▶️  Testing shooting');
    await tester.shoot(5);
    await tester.screenshot('06-after-shooting');

    // Wait to see enemy interactions
    await tester.wait(3000, 'Observing enemies');
    await tester.screenshot('07-enemy-interaction');
    await tester.logState();

    console.log('\n✅ Basic test complete!');
  },

  /**
   * Combat test
   */
  async combat(tester) {
    console.log('\n🧪 Running COMBAT test\n');

    await tester.waitForGameReady();
    await tester.screenshot('01-combat-start');

    // Play for 20 seconds with combat focus
    console.log('\n▶️  Engaging in combat');
    for (let i = 0; i < 4; i++) {
      await tester.shoot(3);
      await tester.move('right', 800);
      await tester.shoot(3);
      await tester.move('left', 800);

      const state = await tester.logState();
      await tester.screenshot(`02-combat-round-${i + 1}`);

      if (state.gameOver) break;
    }

    console.log('\n✅ Combat test complete!');
  },

  /**
   * Abilities test
   */
  async abilities(tester) {
    console.log('\n🧪 Running ABILITIES test\n');

    await tester.waitForGameReady();
    await tester.screenshot('01-abilities-start');

    // Play until we can use special ability
    console.log('\n▶️  Playing until special ability is available');
    await tester.playRandomly(10000);
    await tester.screenshot('02-before-special');

    try {
      await tester.useSpecialAbility();
      await tester.wait(1000, 'After special ability');
      await tester.screenshot('03-after-special');
    } catch (error) {
      console.log('⚠️  Special ability not available yet');
    }

    await tester.logState();
    console.log('\n✅ Abilities test complete!');
  },

  /**
   * Survival test - play for an extended period
   */
  async survival(tester) {
    console.log('\n🧪 Running SURVIVAL test\n');

    await tester.waitForGameReady();
    await tester.screenshot('01-survival-start');

    const duration = 60000; // 1 minute
    const checkInterval = 10000; // Check every 10 seconds
    const startTime = Date.now();
    let round = 1;

    while (Date.now() - startTime < duration) {
      const state = await tester.getGameState();

      if (state.gameOver) {
        console.log('💀 Game over!');
        await tester.screenshot('99-game-over');
        break;
      }

      console.log(`\n▶️  Survival round ${round}`);
      await tester.playRandomly(checkInterval);
      await tester.screenshot(`${String(round + 1).padStart(2, '0')}-survival-${state.time.replace(':', '-')}`);
      await tester.logState();

      round++;
    }

    console.log('\n✅ Survival test complete!');
  },

  /**
   * Custom scenario - for ad-hoc testing
   */
  async custom(tester) {
    console.log('\n🧪 Running CUSTOM test\n');

    await tester.waitForGameReady();
    await tester.screenshot('01-custom-start');

    // Add your custom test logic here
    console.log('💡 Customize this scenario in puppeteer-interactive-test.js');

    // Example custom test:
    await tester.move('right', 2000);
    await tester.shoot(10);
    await tester.wait(5000, 'Observing results');
    await tester.screenshot('02-custom-end');
    await tester.logState();

    console.log('\n✅ Custom test complete!');
  }
};

/**
 * Main execution
 */
async function runTest() {
  console.log('🎮 Blocky Horde Interactive Test');
  console.log('==================================\n');
  console.log(`Scenario: ${SCENARIO}`);
  console.log(`Game URL: ${GAME_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Launch browser
  const browserPath = findBrowser();
  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  };

  if (browserPath) {
    console.log(`✅ Found browser: ${browserPath}`);
    launchOptions.executablePath = browserPath;
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error('❌ Failed to launch browser:', error.message);
    console.log('\n💡 Install a browser: npx playwright install chromium');
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Navigate to game
  console.log(`📡 Loading game from ${GAME_URL}...`);
  try {
    await page.goto(GAME_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
  } catch (error) {
    console.error('❌ Failed to load game:', error.message);
    console.log('\n💡 Make sure server is running: npm run serve');
    await browser.close();
    process.exit(1);
  }

  // Run the test scenario
  const tester = new GameTester(page);

  const scenarioFn = scenarios[SCENARIO];
  if (!scenarioFn) {
    console.error(`❌ Unknown scenario: ${SCENARIO}`);
    console.log('\nAvailable scenarios:', Object.keys(scenarios).join(', '));
    await browser.close();
    process.exit(1);
  }

  try {
    await scenarioFn(tester);
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await tester.screenshot('error-state');
  }

  // Cleanup
  console.log('\n👋 Closing browser...');
  await browser.close();

  console.log(`\n✅ Test complete! Screenshots saved to: ${OUTPUT_DIR}`);
  console.log(`📊 Total screenshots: ${tester.screenshotCount}`);
}

// Run the test
runTest().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
