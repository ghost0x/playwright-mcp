# Screenshot Streaming Usage Guide

## Overview

This guide explains how to use the screenshot streaming feature in Playwright MCP to create a real-time video feed of your browser automation, all while allowing Claude/AI to control the browser through MCP.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │  MCP    │                  │  WS     │                 │
│  Claude/AI      │────────▶│  Playwright MCP  │────────▶│  Remote Viewer  │
│                 │ Control │  + Streamer      │ Stream  │  (Browser)      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │   Browser    │
                            │  (Chromium)  │
                            └──────────────┘
```

## Quick Start

### Step 1: Install Dependencies

```bash
npm install @playwright/mcp ws
```

### Step 2: Create Your Streaming Script

Create a file `stream-browser.js`:

```javascript
const { createConnection, ScreenshotStreamer } = require('@playwright/mcp');
const { chromium } = require('playwright');

async function main() {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create and start screenshot streamer
  const streamer = new ScreenshotStreamer({
    port: 8765,
    interval: 1000,  // 1 screenshot per second
    format: 'jpeg',
    quality: 80,
  });

  await streamer.start(page);
  console.log('Screenshot streaming started on ws://localhost:8765');

  // Start MCP server with the existing context
  const mcpServer = await createConnection({}, async () => context);
  console.log('MCP server ready for Claude/AI control');

  // Keep running
  process.on('SIGINT', async () => {
    await streamer.stop();
    await browser.close();
    process.exit(0);
  });

  // Initial navigation
  await page.goto('https://example.com');
}

main().catch(console.error);
```

### Step 3: Run the Server

```bash
node stream-browser.js
```

### Step 4: View the Stream

Open `examples/screenshot-stream-viewer.html` in any web browser and click "Connect".

## Configuration Options

### ScreenshotStreamer Options

```javascript
new ScreenshotStreamer({
  // WebSocket server port
  port: 8765,
  
  // Screenshot capture interval in milliseconds
  // Default: 1000 (1 second, 1 FPS)
  // Recommended: 500-2000ms depending on use case
  interval: 1000,
  
  // Image format: 'jpeg' or 'png'
  // JPEG is recommended for streaming (smaller size)
  format: 'jpeg',
  
  // JPEG quality (1-100, ignored for PNG)
  // Lower = smaller files, faster streaming
  // Recommended: 60-80 for streaming
  quality: 80,
  
  // Capture full page or just viewport
  // false = viewport only (faster, recommended)
  // true = full scrollable page (slower)
  fullPage: false,
});
```

## Use Cases

### 1. Remote Debugging

Watch what Claude/AI is doing in real-time on a different computer:

```javascript
// On your server (where Claude/AI runs)
const streamer = new ScreenshotStreamer({ 
  port: 8765,
  interval: 500  // 2 FPS for real-time debugging
});
await streamer.start(page);

// Connect from your laptop/desktop to watch
// Open viewer.html and enter: ws://server-ip:8765
```

### 2. Live Demonstrations

Show browser automation to stakeholders:

```javascript
// Use higher quality for presentations
const streamer = new ScreenshotStreamer({ 
  port: 8765,
  format: 'jpeg',
  quality: 90,  // Higher quality
  interval: 1000
});
```

### 3. Multi-Viewer Monitoring

Multiple people can watch the same automation:

```javascript
// Server automatically handles multiple WebSocket connections
// Each viewer connects to ws://server-ip:8765
// Check connected viewers:
console.log(`Active viewers: ${streamer.getStatus().clientCount}`);
```

### 4. Recording/Archiving

Save screenshots to build a video:

```javascript
// Client-side (in viewer)
const frames = [];
ws.onmessage = (event) => {
  const { data, timestamp } = JSON.parse(event.data);
  frames.push({ data, timestamp });
  
  // Later: convert frames to video using ffmpeg
};
```

## Performance Optimization

### Network Bandwidth

| Format | Quality | Viewport Size | Approx. Size/Frame | Bandwidth (1 FPS) |
|--------|---------|---------------|-------------------|-------------------|
| JPEG   | 60      | 1920x1080    | ~50-100 KB        | ~50-100 KB/s      |
| JPEG   | 80      | 1920x1080    | ~100-150 KB       | ~100-150 KB/s     |
| JPEG   | 90      | 1920x1080    | ~150-250 KB       | ~150-250 KB/s     |
| PNG    | N/A     | 1920x1080    | ~500 KB - 2 MB    | ~500 KB - 2 MB/s  |

### CPU Usage

Capturing and encoding screenshots uses CPU. Tips to reduce:
- Use JPEG instead of PNG
- Lower quality (60-70)
- Increase interval (2000-3000ms)
- Use viewport-only capture
- Reduce viewport size if possible

### Memory Usage

Screenshots are kept in memory briefly:
- Each frame: 50-500 KB depending on settings
- Frames are immediately sent and discarded
- No disk storage (as designed)
- Memory usage is minimal and constant

## Advanced Usage

### Custom WebSocket Server

If you need authentication or custom logic:

```javascript
const streamer = new ScreenshotStreamer({ port: 8765 });

// Access the underlying WebSocket server
// (after calling start())
// Add custom authentication, logging, etc.
```

### Dynamic Configuration

Change settings during runtime:

```javascript
// Create with initial settings
const streamer = new ScreenshotStreamer({ 
  port: 8765,
  interval: 1000 
});

// Update settings (only when stopped)
await streamer.stop();
streamer.updateOptions({ 
  interval: 500,  // Faster capture
  quality: 70     // Lower quality
});
await streamer.start(page);
```

### Status Monitoring

Check streaming status:

```javascript
const status = streamer.getStatus();
console.log(`
  Streaming: ${status.isStreaming}
  Connected viewers: ${status.clientCount}
  Port: ${status.port}
`);
```

## Building a Custom Viewer

### Minimal HTML Viewer

```html
<!DOCTYPE html>
<html>
<head>
  <title>Screenshot Viewer</title>
</head>
<body>
  <img id="screenshot" style="width: 100%; height: auto;">
  <script>
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'screenshot') {
        const img = document.getElementById('screenshot');
        img.src = `data:image/${msg.format};base64,${msg.data}`;
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Disconnected');
    };
  </script>
</body>
</html>
```

### Node.js Viewer/Recorder

```javascript
const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://localhost:8765');
const frames = [];

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'screenshot') {
    frames.push({
      data: msg.data,
      format: msg.format,
      timestamp: msg.timestamp
    });
    
    console.log(`Received frame ${frames.length}`);
    
    // Save every 10 frames
    if (frames.length % 10 === 0) {
      fs.writeFileSync(
        `frame-${frames.length}.${msg.format}`,
        Buffer.from(msg.data, 'base64')
      );
    }
  }
});

ws.on('close', () => {
  console.log(`Recording complete: ${frames.length} frames`);
});
```

## Troubleshooting

### Port Already in Use

```javascript
// Try a different port
const streamer = new ScreenshotStreamer({ port: 8766 });
```

### High Latency

1. Reduce image quality: `quality: 60`
2. Increase interval: `interval: 2000`
3. Use JPEG: `format: 'jpeg'`
4. Reduce viewport size: `await page.setViewportSize({ width: 1280, height: 720 })`

### Viewer Not Connecting

1. Check firewall settings
2. Verify server is running: `netstat -an | grep 8765`
3. Try localhost first: `ws://localhost:8765`
4. Check browser console for WebSocket errors

### Screenshots Not Capturing

1. Ensure page is loaded before starting stream
2. Check that page is visible (not minimized)
3. Verify browser is not closed
4. Check console for error messages

## Security Considerations

⚠️ **Important**: The WebSocket server does NOT include authentication by default.

### Recommendations

1. **Local Development**: Use `localhost` only
2. **Trusted Networks**: Only use on private, trusted networks
3. **Production**: Add authentication layer
4. **Firewall**: Block port 8765 from external access if not needed

### Adding Authentication (Advanced)

```javascript
// Not built-in, but you can wrap the streamer:
const http = require('http');
const { WebSocketServer } = require('ws');

// Create authenticated server manually
// Then pass page to capture screenshots
```

## Examples

See the `examples/` directory for complete working examples:

- `basic-usage.js` - Standalone streaming
- `mcp-with-streaming.js` - MCP + streaming integration  
- `screenshot-stream-viewer.html` - Web viewer with stats
- `README.md` - Detailed examples documentation

## FAQ

**Q: Can I stream to multiple computers?**
A: Yes! Multiple WebSocket clients can connect to the same server.

**Q: Does this record video files?**
A: No, it streams screenshots in real-time. You can build recording functionality in your viewer.

**Q: Can I use this with headless browsers?**
A: Yes, streaming works in both headed and headless modes.

**Q: What's the difference between this and Playwright's video recording?**
A: Playwright's video recording saves to disk. This streams in real-time to remote viewers without disk I/O.

**Q: Can Claude/AI control the browser while streaming?**
A: Yes! That's the main use case. The streamer runs alongside the MCP server.

**Q: Does this work with Firefox/WebKit?**
A: Yes, it works with any Playwright-supported browser.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review example code in `examples/` directory
3. Open an issue on GitHub

## License

This feature is part of Playwright MCP and follows the same Apache 2.0 license.
