# Screenshot Capture System

This project includes a comprehensive screenshot capture system that allows capturing the game's rendering for debugging and analysis.

## Features

- 📸 **Manual Screenshots**: Press F9 during gameplay to capture screenshots
- 🤖 **Automated Puppeteer Screenshots**: Capture screenshots programmatically
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

## Files Overview

- **screenshot-server.js**: HTTP server that serves the game and handles screenshot uploads
- **screenshot-client.js**: Client-side screenshot capture utility (integrated into the game)
- **puppeteer-screenshot.js**: Automated screenshot capture using Puppeteer
- **screenshots/**: Directory where screenshots are saved

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

## Notes

- Screenshots are PNG format with lossless compression
- Filenames include timestamps for easy organization
- The canvas is captured at its current resolution
- All screenshots are stored in the `screenshots/` directory by default
