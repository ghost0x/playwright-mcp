# Screenshot Streaming Examples

This directory contains examples demonstrating how to use the screenshot streaming feature with Playwright MCP.

## Overview

The screenshot streaming feature allows you to:
- Capture screenshots from a Playwright browser session every second (configurable)
- Stream these screenshots in real-time over WebSocket
- View the stream on a different computer or in a different browser tab
- Keep screenshots in memory (no disk writes) to avoid filling up disk space
- Continue using Claude/AI to control the browser through MCP while streaming

## Examples

### 1. `screenshot-stream-viewer.html`

A simple HTML/JavaScript viewer that connects to the WebSocket stream and displays screenshots in real-time.

**Features:**
- Real-time screenshot display
- FPS (frames per second) counter
- Latency measurement
- Frame count statistics
- Connect/disconnect controls

**Usage:**
1. Start one of the example servers below
2. Open `screenshot-stream-viewer.html` in a web browser
3. Click "Connect" to start viewing the stream
4. The default WebSocket URL is `ws://localhost:8765`

### 2. `basic-usage.js`

Demonstrates basic screenshot streaming without MCP integration.

**Usage:**
```bash
cd examples
node basic-usage.js
```

This will:
1. Launch a Chromium browser
2. Start streaming screenshots on port 8765
3. Navigate to a few websites
4. Keep streaming until you press Ctrl+C

### 3. `mcp-with-streaming.js`

Shows how to integrate screenshot streaming with the MCP server, allowing Claude/AI to control the browser while screenshots are streamed.

**Usage:**
```bash
cd examples
node mcp-with-streaming.js
```

This example demonstrates:
- Starting both MCP server and screenshot streaming
- Using a custom browser context
- Allowing Claude/AI to control the browser via MCP
- Streaming all browser activity to remote viewers

## Configuration Options

The `ScreenshotStreamer` class accepts the following options:

```javascript
const streamer = new ScreenshotStreamer({
  port: 8765,           // WebSocket server port (default: 8765)
  interval: 1000,       // Screenshot interval in ms (default: 1000)
  quality: 80,          // JPEG quality 1-100 (default: 80)
  format: 'jpeg',       // 'jpeg' or 'png' (default: 'jpeg')
  fullPage: false,      // Capture full page or viewport (default: false)
});
```

## API Usage

### Starting a Stream

```javascript
const { ScreenshotStreamer } = require('@playwright/mcp');
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage();

const streamer = new ScreenshotStreamer({ port: 8765 });
const port = await streamer.start(page);
console.log(`Streaming on port ${port}`);
```

### Stopping a Stream

```javascript
await streamer.stop();
```

### Getting Stream Status

```javascript
const status = streamer.getStatus();
console.log(status);
// { isStreaming: true, clientCount: 2, port: 8765 }
```

## WebSocket Protocol

The WebSocket server sends JSON messages with the following format:

```json
{
  "type": "screenshot",
  "format": "jpeg",
  "data": "base64-encoded-image-data",
  "timestamp": 1234567890123
}
```

Clients can connect to `ws://hostname:port` and will receive screenshots as they are captured.

## Use Cases

1. **Remote Monitoring**: Watch browser automation from a different computer
2. **Debugging**: See what Claude/AI is doing in real-time
3. **Demonstrations**: Show browser automation to stakeholders
4. **Recording**: Build a simple recording solution by saving received frames
5. **Multiple Viewers**: Multiple clients can connect to view the same stream

## Performance Tips

1. **Use JPEG format**: Smaller file size, better for streaming
2. **Adjust quality**: Lower quality (60-80) for better performance
3. **Increase interval**: Capture every 2-3 seconds if 1 second is too fast
4. **Viewport only**: Set `fullPage: false` for better performance
5. **Network**: Ensure good network connection between server and viewers

## Security Considerations

⚠️ **Important**: The WebSocket server does not include authentication. Anyone who can reach the port can view your browser session. Only use on trusted networks or add authentication if needed.

## Troubleshooting

### "Port already in use" error
Change the port number in the configuration:
```javascript
const streamer = new ScreenshotStreamer({ port: 8766 });
```

### High latency
- Reduce image quality
- Increase capture interval
- Use JPEG instead of PNG
- Ensure good network connection

### Viewer not connecting
- Check that the WebSocket URL matches the server port
- Verify no firewall is blocking the port
- Ensure the server is running before connecting
