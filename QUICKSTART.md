# Screenshot Streaming - Quick Start

## 🚀 Get Started in 3 Steps

### 1. Install
```bash
npm install @playwright/mcp ws
```

### 2. Create `stream.js`
```javascript
const { ScreenshotStreamer } = require('@playwright/mcp');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const streamer = new ScreenshotStreamer({ port: 8765 });
  await streamer.start(page);
  
  console.log('🎬 Streaming at ws://localhost:8765');
  console.log('📺 Open examples/screenshot-stream-viewer.html to view!');
  
  await page.goto('https://example.com');
})();
```

### 3. Run and View
```bash
# Terminal 1: Start streaming
node stream.js

# Terminal 2: Open viewer in browser
open packages/playwright-mcp/examples/screenshot-stream-viewer.html
# Or manually open the HTML file in any browser
```

That's it! You're now streaming screenshots in real-time.

## 🎯 With Claude/AI Control

Want Claude to control the browser while you watch?

```javascript
const { createConnection, ScreenshotStreamer } = require('@playwright/mcp');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Start streaming
  const streamer = new ScreenshotStreamer({ port: 8765 });
  await streamer.start(page);
  console.log('🎬 Streaming at ws://localhost:8765');
  
  // Start MCP for Claude control
  await createConnection({}, async () => context);
  console.log('🤖 MCP ready for Claude control');
  
  await page.goto('https://example.com');
})();
```

Now Claude can control the browser through MCP while you watch the stream!

## 📖 More Information

- **Full Guide**: See `SCREENSHOT_STREAMING.md`
- **Examples**: Check `examples/` directory
- **API Docs**: See `examples/README.md`

## ⚙️ Common Configurations

### High FPS (2 FPS)
```javascript
new ScreenshotStreamer({ 
  port: 8765,
  interval: 500  // 500ms = 2 screenshots/second
});
```

### Low Bandwidth
```javascript
new ScreenshotStreamer({ 
  port: 8765,
  format: 'jpeg',
  quality: 60,    // Lower quality
  interval: 2000  // Less frequent
});
```

### High Quality
```javascript
new ScreenshotStreamer({ 
  port: 8765,
  format: 'png',  // Lossless
  interval: 1000
});
```

## 🐛 Troubleshooting

**Port in use?**
```javascript
new ScreenshotStreamer({ port: 8766 }) // Try different port
```

**Viewer won't connect?**
- Check WebSocket URL matches (default: `ws://localhost:8765`)
- Ensure server is running
- Check browser console for errors

**Need help?** See `SCREENSHOT_STREAMING.md` for detailed troubleshooting.

---

**Happy Streaming! 🎥**
