/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Page } from 'playwright';
import type { Server } from 'http';

export interface ScreenshotStreamOptions {
  port?: number;
  interval?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
  fullPage?: boolean;
}

export class ScreenshotStreamer {
  private wsServer: WebSocketServer | null = null;
  private httpServer: Server | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private page: Page | null = null;
  private clients: Set<WebSocket> = new Set();
  private options: Required<ScreenshotStreamOptions>;
  private isStreaming = false;

  constructor(options: ScreenshotStreamOptions = {}) {
    this.options = {
      port: options.port ?? 8765,
      interval: options.interval ?? 1000,
      quality: options.quality ?? 80,
      format: options.format ?? 'jpeg',
      fullPage: options.fullPage ?? false,
    };
  }

  async start(page: Page): Promise<number> {
    if (this.isStreaming) {
      throw new Error('Screenshot streaming is already active');
    }

    this.page = page;
    this.isStreaming = true;

    // Create HTTP server and WebSocket server
    const http = await import('http');
    this.httpServer = http.createServer();
    this.wsServer = new WebSocketServer({ server: this.httpServer });

    // Handle WebSocket connections
    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
        this.clients.delete(ws);
      });
    });

    // Start the HTTP server
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(this.options.port, () => {
        console.log(`Screenshot stream WebSocket server listening on port ${this.options.port}`);
        resolve();
      });
      this.httpServer!.on('error', reject);
    });

    // Start capturing and broadcasting screenshots
    this.startCapture();

    return this.options.port;
  }

  private startCapture(): void {
    this.intervalId = setInterval(async () => {
      if (!this.page || !this.isStreaming || this.clients.size === 0) {
        return;
      }

      try {
        // Capture screenshot to memory as Buffer
        const screenshotBuffer = await this.page.screenshot({
          type: this.options.format,
          quality: this.options.format === 'jpeg' ? this.options.quality : undefined,
          fullPage: this.options.fullPage,
        });

        // Broadcast to all connected clients
        const base64Image = screenshotBuffer.toString('base64');
        const message = JSON.stringify({
          type: 'screenshot',
          format: this.options.format,
          data: base64Image,
          timestamp: Date.now(),
        });

        this.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error('Error capturing screenshot:', error);
      }
    }, this.options.interval);
  }

  async stop(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    this.isStreaming = false;

    // Stop capturing
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();

    // Close WebSocket server
    if (this.wsServer) {
      await new Promise<void>((resolve) => {
        this.wsServer!.close(() => {
          resolve();
        });
      });
      this.wsServer = null;
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          resolve();
        });
      });
      this.httpServer = null;
    }

    this.page = null;
    console.log('Screenshot streaming stopped');
  }

  getStatus(): { isStreaming: boolean; clientCount: number; port: number } {
    return {
      isStreaming: this.isStreaming,
      clientCount: this.clients.size,
      port: this.options.port,
    };
  }

  updateOptions(options: Partial<ScreenshotStreamOptions>): void {
    if (this.isStreaming) {
      throw new Error('Cannot update options while streaming is active');
    }
    
    if (options.port !== undefined) this.options.port = options.port;
    if (options.interval !== undefined) this.options.interval = options.interval;
    if (options.quality !== undefined) this.options.quality = options.quality;
    if (options.format !== undefined) this.options.format = options.format;
    if (options.fullPage !== undefined) this.options.fullPage = options.fullPage;
  }
}
