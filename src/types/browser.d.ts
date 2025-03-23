/**
 * Type definitions for Firefox's browser extension API
 */

interface BrowserRuntime {
  sendMessage(
    extensionId: string,
    message: any,
  ): Promise<any>;
}

interface BrowserAPI {
  runtime: BrowserRuntime;
}

declare global {
  interface Window {
    browser: BrowserAPI;
  }
  
  // Firefox global browser object
  var browser: BrowserAPI;
}

export {}; 