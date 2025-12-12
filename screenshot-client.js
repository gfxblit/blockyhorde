/**
 * Screenshot utility for capturing game canvas
 * This module provides functions to capture and save screenshots
 */

export class ScreenshotCapture {
  constructor(canvas, serverUrl = 'http://localhost:3000') {
    this.canvas = canvas;
    this.serverUrl = serverUrl;
    this.setupKeyboardShortcut();
  }

  /**
   * Capture the current canvas as a PNG screenshot
   * @returns {Promise<string>} Base64 encoded PNG data
   */
  async capture() {
    return new Promise((resolve, reject) => {
      try {
        const dataUrl = this.canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save screenshot to server
   * @returns {Promise<Object>} Server response with filename
   */
  async saveToServer() {
    try {
      const imageData = await this.capture();

      const response = await fetch(`${this.serverUrl}/api/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Screenshot saved: ${result.filename}`);
        this.showNotification(`Screenshot saved: ${result.filename}`);
      } else {
        console.error('Failed to save screenshot:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Error saving screenshot:', error);
      // Fallback: download in browser
      this.downloadInBrowser();
    }
  }

  /**
   * Download screenshot directly in browser
   */
  async downloadInBrowser() {
    try {
      const imageData = await this.capture();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;

      const link = document.createElement('a');
      link.href = imageData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`📥 Screenshot downloaded: ${filename}`);
      this.showNotification(`Screenshot downloaded: ${filename}`);
    } catch (error) {
      console.error('Error downloading screenshot:', error);
    }
  }

  /**
   * Show a brief notification
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 10000;
      animation: fadeInOut 3s;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        10%, 90% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 3000);
  }

  /**
   * Setup keyboard shortcut (F9) to take screenshots
   */
  setupKeyboardShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        console.log('📸 Taking screenshot...');
        this.saveToServer();
      }
    });
    console.log('📸 Screenshot utility loaded. Press F9 to capture.');
  }
}

/**
 * Initialize screenshot capture for a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to capture
 * @param {string} serverUrl - Optional server URL
 * @returns {ScreenshotCapture} Screenshot capture instance
 */
export function initScreenshotCapture(canvas, serverUrl) {
  return new ScreenshotCapture(canvas, serverUrl);
}
