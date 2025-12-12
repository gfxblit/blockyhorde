# Screenshot Capture & Interactive Testing System

This project includes a comprehensive screenshot capture and automated testing system that allows capturing the game's rendering and interacting with it programmatically for debugging and analysis.

## Features

- 📸 **Manual Screenshots**: Press F9 during gameplay to capture screenshots
- 🤖 **Automated Puppeteer Screenshots**: Capture screenshots programmatically
- 🎮 **Interactive Testing**: Automated gameplay with screenshots at different states
- 🧪 **Test Scenarios**: Pre-built test scenarios for common gameplay patterns
- 💾 **Server-side Storage**: Screenshots are saved to disk for later review
- 🌐 **Browser Downloads**: Fallback to browser downloads if server is unavailable

## Quick Start

### Method 1: Manual Screenshots (Easiest)

1. Start the game server:
   ```bash
   npm run serve
   ```

2. Open your browser to http://localhost:3000

3. Press **F9** to capture a screenshot
   - Screenshots are saved to the `screenshots/` folder
   - A notification will confirm the save

### Method 2: Puppeteer Automated Screenshots

This method captures screenshots without manual interaction, useful for automated testing or CI/CD.

1. **Prerequisites**: Install Chrome or Chromium
   ```bash
   # Ubuntu/Debian
   sudo apt-get install chromium-browser

   # macOS
   brew install chromium

   # Or use Playwright's bundled browser
   npx playwright install chromium
   ```

2. Start the game server (in one terminal):
   ```bash
   npm run serve
   ```

3. Run the screenshot script (in another terminal):
   ```bash
   npm run screenshot
   ```

4. For continuous screenshots:
   ```bash
   npm run screenshot:interactive
   ```
   Press Ctrl+C to stop.

### Method 3: Interactive Automated Testing (Recommended for Development)

This method runs automated gameplay scenarios and captures screenshots at key moments. Perfect for testing changes!

1. Start the game server:
   ```bash
   npm run serve
   ```

2. Run a test scenario (in another terminal):
   ```bash
   # Basic gameplay test (movement, shooting)
   npm run test:play

   # Combat-focused test
   npm run test:combat

   # Special abilities test
   npm run test:abilities

   # Extended survival test (1 minute)
   npm run test:survival

   # Custom scenario (edit puppeteer-interactive-test.js)
   npm run test:custom
   ```

3. Screenshots are saved to `test-screenshots/` with descriptive names

**What happens during a test:**
- Browser launches and loads the game
- Automated player movements (WASD keys)
- Automated shooting and abilities
- Screenshots at different game states
- Game state logged (HP, time, kills)
- Results saved for review

**Example workflow when making changes:**
```bash
# Terminal 1: Start server
npm run serve

# Terminal 2: Make your code changes, then test
npm run test:play

# Review screenshots in test-screenshots/ folder
```

## Files Overview

- **screenshot-server.js**: HTTP server that serves the game and handles screenshot uploads
- **screenshot-client.js**: Client-side screenshot capture utility (integrated into the game)
- **puppeteer-screenshot.js**: Automated screenshot capture using Puppeteer
- **puppeteer-interactive-test.js**: Interactive testing with automated gameplay
- **screenshots/**: Directory where manual/automated screenshots are saved
- **test-screenshots/**: Directory where interactive test screenshots are saved

## Usage Examples

### Custom Screenshot Delay
```bash
node puppeteer-screenshot.js http://localhost:3000 ./screenshots 10000
```
Waits 10 seconds before taking screenshot.

### Screenshot During Gameplay
While playing the game:
1. Press **F9** at any time to capture the current state
2. Screenshots are timestamped and saved automatically
3. Continue playing without interruption

## Troubleshooting

### Browser Not Found
If you get "Failed to launch browser" errors:

1. Install a browser:
   ```bash
   npx playwright install chromium
   ```

2. Or set the browser path manually:
   ```bash
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium node puppeteer-screenshot.js
   ```

### Server Connection Errors
If screenshots fail to save to server:
- Ensure `npm run serve` is running
- Screenshots will automatically download to your browser as fallback

### F9 Not Working
- Make sure the game window has focus
- Check browser console for any errors
- Try clicking on the game canvas first

## Integration with CI/CD

You can use the Puppeteer script in automated testing:

```bash
#!/bin/bash
npm run serve &
SERVER_PID=$!
sleep 2
npm run screenshot
kill $SERVER_PID
```

## Advanced Usage

### Custom Screenshot Locations
```javascript
import { initScreenshotCapture } from './screenshot-client.js';

// Custom server URL
const capture = initScreenshotCapture(canvas, 'http://custom-server:8080');
```

### Programmatic Capture
```javascript
// In your game code
const screenshotCapture = new ScreenshotCapture(canvas);
await screenshotCapture.saveToServer();
```

## Customizing Interactive Tests

You can create custom test scenarios by editing `puppeteer-interactive-test.js`:

```javascript
// Edit the 'custom' scenario in scenarios object
async custom(tester) {
  await tester.waitForGameReady();
  await tester.screenshot('01-start');

  // Your custom test logic
  await tester.move('right', 2000);   // Move right for 2 seconds
  await tester.shoot(5);              // Shoot 5 times
  await tester.useSpecialAbility();   // Use special ability
  await tester.wait(3000);            // Wait 3 seconds

  await tester.screenshot('02-end');
  await tester.logState();            // Log HP, time, kills
}
```

**Available tester methods:**
- `screenshot(name)` - Take a screenshot with descriptive name
- `move(direction, duration)` - Move in direction ('up', 'down', 'left', 'right')
- `shoot(count)` - Shoot N times
- `useSpecialAbility()` - Click the special ability button
- `wait(duration, message)` - Wait for specified milliseconds
- `getGameState()` - Get current HP, time, kills, gameOver status
- `logState()` - Log current game state to console
- `playRandomly(duration)` - Play with random movements for duration

## How This Helps Development

**For Claude (AI Assistant):**
When making changes to the game, I can:
1. Make code modifications
2. Run `npm run test:play` (or other scenario)
3. Review the screenshots to see if the changes work correctly
4. Verify game state (HP, kills, time) is as expected

**For You:**
- Automated regression testing
- Visual verification of features
- Quick gameplay testing without manual play
- Screenshot-based documentation

## Notes

- Screenshots are PNG format with lossless compression
- Filenames include timestamps and descriptive names for easy organization
- The canvas is captured at its current resolution
- Manual screenshots: `screenshots/` directory
- Test screenshots: `test-screenshots/` directory
- Both directories are excluded from git (see .gitignore)
