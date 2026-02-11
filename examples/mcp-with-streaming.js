/**
 * Example: Integrating Screenshot Streaming with MCP Server
 * 
 * This example shows how to use screenshot streaming alongside
 * the MCP server, allowing Claude/AI to control the browser while
 * screenshots are streamed to a remote viewer.
 */

const { createConnection, ScreenshotStreamer } = require('./packages/playwright-mcp/index');
const { chromium } = require('playwright');

async function main() {
  console.log('Starting MCP Server with Screenshot Streaming...\n');

  // Configuration for the MCP connection
  const config = {
    browser: {
      name: 'chromium',
      launchOptions: {
        headless: false, // Run in headed mode
      },
    },
    server: {
      type: 'stdio', // Use stdio transport for MCP
    },
  };

  // Create a browser context that we can control
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create screenshot streamer
  const streamer = new ScreenshotStreamer({
    port: 8765,
    interval: 1000,
    format: 'jpeg',
    quality: 80,
  });

  // Start streaming screenshots
  const port = await streamer.start(page);
  console.log(`✅ Screenshot stream started on port ${port}`);
  console.log(`📺 View stream at: ws://localhost:${port}\n`);

  // Now you can create MCP connection with a custom context getter
  // This allows the MCP server to use our existing page
  const mcpConnection = await createConnection(config, async () => context);
  
  console.log('✅ MCP Server started');
  console.log('🤖 Claude/AI can now control the browser through MCP');
  console.log('📺 Screenshots are being streamed to connected viewers\n');

  // Example: Navigate to a page
  await page.goto('https://example.com');
  
  // The MCP server will handle tool calls from Claude/AI
  // while the screenshot streamer continues to broadcast
  // all browser activity to connected WebSocket clients

  console.log('💡 The MCP server is running alongside the screenshot stream');
  console.log('   - Claude can control the browser via MCP tools');
  console.log('   - Screenshots are continuously streamed via WebSocket');
  console.log('   - All browser activity is visible to remote viewers\n');

  // Keep running until interrupted
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    await streamer.stop();
    await browser.close();
    console.log('✅ Stopped successfully');
    process.exit(0);
  });

  // Keep the process alive
  await new Promise(() => {});
}

main().catch(console.error);
