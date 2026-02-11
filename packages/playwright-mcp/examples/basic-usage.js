/**
 * Example: Using ScreenshotStreamer with Playwright MCP
 * 
 * This example demonstrates how to:
 * 1. Create a connection to Playwright MCP
 * 2. Start a screenshot stream
 * 3. Control the browser through Claude/AI while streaming
 * 4. View the stream on a separate computer
 */

const { chromium } = require('playwright');
const { ScreenshotStreamer } = require('../index');

async function main() {
  console.log('Starting Playwright with Screenshot Streaming...\n');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Run in headed mode so you can see what's happening
  });

  // Create a new page
  const page = await browser.newPage();

  // Create screenshot streamer with custom options
  const streamer = new ScreenshotStreamer({
    port: 8765,           // WebSocket server port
    interval: 1000,       // Capture screenshot every 1000ms (1 second)
    quality: 80,          // JPEG quality (1-100)
    format: 'jpeg',       // Use JPEG for better performance
    fullPage: false,      // Only capture viewport, not full page
  });

  // Start streaming
  const port = await streamer.start(page);
  console.log(`✅ Screenshot stream started on port ${port}`);
  console.log(`📺 Open examples/screenshot-stream-viewer.html in a browser to view the stream`);
  console.log(`   Or connect to: ws://localhost:${port}\n`);

  // Navigate to a website
  console.log('Navigating to example.com...');
  await page.goto('https://example.com');
  
  // Wait a bit to let the stream start
  await page.waitForTimeout(2000);

  // Demonstrate some interactions
  console.log('Performing some browser interactions...');
  
  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(2000);

  // Navigate to another page
  await page.goto('https://playwright.dev');
  await page.waitForTimeout(3000);

  // Click on something
  try {
    await page.click('text=Get Started', { timeout: 5000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Could not click "Get Started" button, continuing...');
  }

  // Get streaming status
  const status = streamer.getStatus();
  console.log('\nStreaming Status:', status);

  console.log('\n🎥 Stream is running. Press Ctrl+C to stop...');
  
  // Keep the stream running until interrupted
  process.on('SIGINT', async () => {
    console.log('\n\nStopping stream...');
    await streamer.stop();
    await browser.close();
    console.log('✅ Stream stopped and browser closed');
    process.exit(0);
  });
}

main().catch(console.error);
