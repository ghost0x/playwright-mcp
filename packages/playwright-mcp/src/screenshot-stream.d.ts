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
import type { Page } from 'playwright';
export interface ScreenshotStreamOptions {
    port?: number;
    interval?: number;
    quality?: number;
    format?: 'png' | 'jpeg';
    fullPage?: boolean;
}
export declare class ScreenshotStreamer {
    private wsServer;
    private httpServer;
    private intervalId;
    private page;
    private clients;
    private options;
    private isStreaming;
    private isPaused;
    constructor(options?: ScreenshotStreamOptions);
    start(page: Page): Promise<number>;
    private startCapture;
    stop(): Promise<void>;
    getStatus(): {
        isStreaming: boolean;
        clientCount: number;
        port: number;
    };
    updateOptions(options: Partial<ScreenshotStreamOptions>): void;
}
