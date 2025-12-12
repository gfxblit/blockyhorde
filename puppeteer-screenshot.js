/**
 * Puppeteer-based screenshot capture
 * Launches the game in a headless browser and takes screenshots
 *
 * Usage:
 *   node puppeteer-screenshot.js [url] [output-path]
 *
 * Requirements:
 *   - Chrome/Chromium must be installed
 *   - Game server must be running (use npm run serve)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const GAME_URL = process.argv[2] || 'http://localhost:3000';
const OUTPUT_DIR = process.argv[3] || './screenshots';
const SCREENSHOT_DELAY = parseInt(process.argv[4]) || 5000; // Default 5 seconds

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

async function captureScreenshot() {
  console.log('🚀 Launching browser...');

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

  // Use custom browser path if found
  if (browserPath) {
    console.log(`✅ Found browser: ${browserPath}`);
    launchOptions.executablePath = browserPath;
  } else {
    console.log('⚠️  No browser path specified, using Puppeteer default');
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    console.error('❌ Failed to launch browser:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Make sure Chrome/Chromium is installed');
    console.log('  2. Try setting PUPPETEER_EXECUTABLE_PATH environment variable');
    console.log('  3. Or install browser: npx playwright install chromium');
    process.exit(1);
  }

  const page = await browser.newPage();

  // Set viewport to standard game size
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`📡 Navigating to ${GAME_URL}...`);

  try {
    await page.goto(GAME_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
  } catch (error) {
    console.error('❌ Failed to load game:', error.message);
    console.log('\n💡 Make sure the game server is running:');
    console.log('  npm run serve');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Game loaded!');
  console.log(`⏳ Waiting ${SCREENSHOT_DELAY}ms for game to initialize...`);

  // Wait for game to initialize
  await page.waitForTimeout(SCREENSHOT_DELAY);

  // Take initial screenshot
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(OUTPUT_DIR, `game-${timestamp}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  });

  console.log(`📸 Screenshot saved: ${screenshotPath}`);

  // Optional: Take screenshots at different game states
  if (process.argv.includes('--interactive')) {
    console.log('\n🎮 Interactive mode:');
    console.log('  Taking screenshots every 5 seconds...');
    console.log('  Press Ctrl+C to stop\n');

    let count = 1;
    const interval = setInterval(async () => {
      const path = `${OUTPUT_DIR}/game-auto-${count}.png`;
      await page.screenshot({ path });
      console.log(`📸 Screenshot ${count} saved: ${path}`);
      count++;
    }, 5000);

    // Keep the process running
    process.on('SIGINT', async () => {
      clearInterval(interval);
      console.log('\n👋 Closing browser...');
      await browser.close();
      process.exit(0);
    });
  } else {
    console.log('👋 Closing browser...');
    await browser.close();
    console.log('✅ Done!');
  }
}

// Main execution
console.log('🎮 Blocky Horde Screenshot Capture');
console.log('=====================================\n');

captureScreenshot().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
