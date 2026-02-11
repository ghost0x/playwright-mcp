"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotStreamer = void 0;
const ws_1 = require("ws");
class ScreenshotStreamer {
    constructor(options = {}) {
        this.wsServer = null;
        this.httpServer = null;
        this.intervalId = null;
        this.page = null;
        this.clients = new Set();
        this.isStreaming = false;
        this.isPaused = false;
        this.options = {
            port: options.port ?? 8765,
            interval: options.interval ?? 1000,
            quality: options.quality ?? 80,
            format: options.format ?? 'jpeg',
            fullPage: options.fullPage ?? false,
        };
    }
    async start(page) {
        if (this.isStreaming) {
            throw new Error('Screenshot streaming is already active');
        }
        this.page = page;
        this.isStreaming = true;
        // Create HTTP server and WebSocket server
        const http = await Promise.resolve().then(() => __importStar(require('http')));
        this.httpServer = http.createServer();
        this.wsServer = new ws_1.WebSocketServer({ server: this.httpServer });
        // Handle WebSocket connections
        this.wsServer.on('connection', (ws) => {
            console.log('WebSocket client connected');
            this.clients.add(ws);
            // Resume capture if it was paused
            if (this.isPaused && this.clients.size > 0) {
                this.isPaused = false;
            }
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
                // Pause capture when no clients are connected
                if (this.clients.size === 0) {
                    this.isPaused = true;
                }
            });
            ws.on('error', (error) => {
                console.error('WebSocket client error:', error);
                this.clients.delete(ws);
                // Pause capture when no clients are connected
                if (this.clients.size === 0) {
                    this.isPaused = true;
                }
            });
        });
        // Start the HTTP server
        await new Promise((resolve, reject) => {
            this.httpServer.listen(this.options.port, () => {
                console.log(`Screenshot stream WebSocket server listening on port ${this.options.port}`);
                resolve();
            });
            this.httpServer.on('error', reject);
        });
        // Start capturing and broadcasting screenshots
        this.startCapture();
        return this.options.port;
    }
    startCapture() {
        this.intervalId = setInterval(async () => {
            // Skip capture if paused (no clients connected)
            if (this.isPaused || !this.page || !this.isStreaming) {
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
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
            catch (error) {
                console.error('Error capturing screenshot:', error);
            }
        }, this.options.interval);
    }
    async stop() {
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
            await new Promise((resolve) => {
                this.wsServer.close(() => {
                    resolve();
                });
            });
            this.wsServer = null;
        }
        // Close HTTP server
        if (this.httpServer) {
            await new Promise((resolve) => {
                this.httpServer.close(() => {
                    resolve();
                });
            });
            this.httpServer = null;
        }
        this.page = null;
        console.log('Screenshot streaming stopped');
    }
    getStatus() {
        return {
            isStreaming: this.isStreaming,
            clientCount: this.clients.size,
            port: this.options.port,
        };
    }
    updateOptions(options) {
        if (this.isStreaming) {
            throw new Error('Cannot update options while streaming is active');
        }
        if (options.port !== undefined)
            this.options.port = options.port;
        if (options.interval !== undefined)
            this.options.interval = options.interval;
        if (options.quality !== undefined)
            this.options.quality = options.quality;
        if (options.format !== undefined)
            this.options.format = options.format;
        if (options.fullPage !== undefined)
            this.options.fullPage = options.fullPage;
    }
}
exports.ScreenshotStreamer = ScreenshotStreamer;
