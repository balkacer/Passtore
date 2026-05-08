/**
 * Future: native messaging / postMessage bridge for browser extensions.
 * Never pass plaintext passwords across the boundary without local unlock.
 * See docs/BROWSER_EXTENSION_BRIDGE.md and docs/AUTOFILL_PLATFORM_ARCHITECTURE.md
 */

export type ExtensionMessage =
  | { type: 'REQUEST_FILL'; credentialId: string; frameOrigin?: string }
  | { type: 'UNLOCK_SESSION' }
  | { type: 'PING'; nonce: string };

export type ExtensionReply =
  | { type: 'PONG'; nonce: string }
  | { type: 'ERROR'; code: string };

export const browserExtensionBridge = {
  async post(_message: ExtensionMessage): Promise<ExtensionReply | void> {
    /* wired when extension host exists */
  },
};
