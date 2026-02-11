/**
 * Simple test for screenshot streaming
 */

const { ScreenshotStreamer } = require('./packages/playwright-mcp/index');
const { chromium } = require('playwright');

async function test() {
  console.log('Testing ScreenshotStreamer...\n');

  // Test 1: Create instance
  console.log('✓ Creating ScreenshotStreamer instance...');
  const streamer = new ScreenshotStreamer({
    port: 8765,
    interval: 1000,
    format: 'jpeg',
    quality: 80,
  });
  console.log('  Instance created successfully');

  // Test 2: Launch browser and page
  console.log('✓ Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('  Browser launched successfully');

  // Test 3: Start streaming
  console.log('✓ Starting screenshot stream...');
  const port = await streamer.start(page);
  console.log(`  Stream started on port ${port}`);

  // Test 4: Check status
  console.log('✓ Checking stream status...');
  const status = streamer.getStatus();
  console.log(`  Status: isStreaming=${status.isStreaming}, clientCount=${status.clientCount}, port=${status.port}`);
  
  if (!status.isStreaming) {
    throw new Error('Stream should be active');
  }

  // Test 5: Navigate to a page
  console.log('✓ Creating a simple HTML page...');
  await page.setContent('<html><body><h1>Test Page</h1><p>Screenshot streaming test</p></body></html>');
  console.log('  Page loaded successfully');

  // Test 6: Stop streaming
  console.log('✓ Stopping stream...');
  await streamer.stop();
  console.log('  Stream stopped successfully');

  // Test 7: Verify status after stop
  const statusAfter = streamer.getStatus();
  console.log(`  Status after stop: isStreaming=${statusAfter.isStreaming}`);
  
  if (statusAfter.isStreaming) {
    throw new Error('Stream should be stopped');
  }

  // Cleanup
  await browser.close();
  console.log('  Browser closed');

  console.log('\n✅ All tests passed!');
}

test().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
