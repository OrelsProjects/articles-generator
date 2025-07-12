// services/realTimeService.ts (Pure service, no Redux)
import Ably from "ably";
import { buildClientRoomName } from "@/types/real-time.type";
import axiosInstance from "@/lib/axios-instance";

// keep main instance in global, to avoid multiple instances
let instance: RealTimeService | null = null;

export interface RealTimeServiceCallbacks {
  onConnectionStateChange: (state: string) => void;
  onRoomStateChange: (roomId: string, state: string) => void;
  onInitializingChange: (isInitializing: boolean) => void;
  onError: (error: string) => void;
}

class RealTimeService {
  private client: Ably.Realtime | null = null;
  private channels: Map<string, Ably.RealtimeChannel> = new Map();
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private currentUserId: string | null = null;
  private callbacks: RealTimeServiceCallbacks | null = null;

  setCallbacks(callbacks: RealTimeServiceCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize(userId: string, caller: string) {
    console.log(
      "[ABLY CONNECTION] Initializing for user:",
      userId,
      "caller:",
      caller,
    );
    if (
      this.currentUserId === userId &&
      (this.client?.connection.state === "connected" ||
        this.client?.connection.state === "connecting")
    ) {
      return; // Already initialized for this user
    }

    await this.cleanup();
    this.currentUserId = userId;

    this.callbacks?.onInitializingChange(true);
    this.callbacks?.onConnectionStateChange("connecting");

    try {
      const tokenResponse = await axiosInstance.post("/api/ably/token");
      console.log("[ABLY CONNECTION] Token response:", tokenResponse.data);

      this.client = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          callback(null, tokenResponse.data);
        },
        maxMessageSize: 1024 * 1024 * 10, // 10MB
      });

      this.setupConnectionHandlers();
    } catch (error: any) {
      console.error("[ABLY CONNECTION] Init failed:", error);
      this.callbacks?.onConnectionStateChange("failed");
      this.callbacks?.onError(error.message || "Failed to initialize");
    } finally {
      this.callbacks?.onInitializingChange(false);
    }
  }

  private setupConnectionHandlers() {
    if (!this.client) return;

    this.client.connection.on("connecting", () => {
      this.callbacks?.onConnectionStateChange("connecting");
    });

    this.client.connection.on("connected", () => {
      this.callbacks?.onConnectionStateChange("connected");
      console.log("✅ [ABLY] Connected successfully");
    });

    this.client.connection.on("disconnected", () => {
      this.callbacks?.onConnectionStateChange("disconnected");
    });

    this.client.connection.on("suspended", () => {
      this.callbacks?.onConnectionStateChange("suspended");
    });

    this.client.connection.on("closed", () => {
      this.callbacks?.onConnectionStateChange("closed");
      this.cleanup();
    });

    this.client.connection.on("failed", error => {
      this.callbacks?.onConnectionStateChange("failed");
      this.callbacks?.onError(
        error instanceof Error ? error.message : "Connection failed",
      );
      console.error("[ABLY CONNECTION] Failed:", error);
    });
  }

  async cleanup() {
    if (!this.client) return;

    // Clear subscriptions
    this.subscriptions.clear();

    // Unsubscribe from all channels
    this.channels.forEach((channel, roomId) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error(`Failed to unsubscribe from ${roomId}:`, error);
      }
    });

    this.channels.clear();

    // Close client connection
    try {
      this.client.close();
    } catch (error: any) {
      console.error("Failed to close Ably client:", error);
    }

    this.client = null;
    this.currentUserId = null;

    // Reset state via callbacks
    this.callbacks?.onConnectionStateChange("disconnected");
    this.callbacks?.onInitializingChange(false);
  }

  connectToRoom(clientId: string): boolean {
    if (!this.client || this.client.connection.state !== "connected") {
      console.warn("[ABLY] Cannot connect to room - client not ready");
      return false;
    }

    try {
      const roomName = buildClientRoomName(clientId);
      console.log("[ABLY] Attempting to connect to room:", roomName);

      let channel = this.channels.get(clientId);

      // If channel doesn't exist, create it
      if (!channel) {
        console.log("[ABLY] Creating new channel:", roomName);
        channel = this.client.channels.get(roomName);
        this.channels.set(clientId, channel);
      } else {
        // if it exists, check if it's connected. If connected, return true
        if (channel.state === "attached") {
          console.log("[ABLY] Room already connected:", roomName);
          return true;
        }
      }

      this.callbacks?.onRoomStateChange(clientId, "connecting");

      // Subscribe to messages
      channel.subscribe("message", message => {
        const callbacks = this.subscriptions.get(clientId);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error: any) {
              console.error(
                `[ABLY] Error in message callback for ${clientId}:`,
                error,
              );
            }
          });
        }
      });

      this.callbacks?.onRoomStateChange(clientId, "connected");
      console.log("✅ [ABLY SUBSCRIBE] Connected to room:", roomName);
      return true;
    } catch (error: any) {
      console.error(`[ABLY] Failed to connect to room ${clientId}:`, error);
      this.callbacks?.onRoomStateChange(clientId, "failed");
      return false;
    }
  }

  disconnectFromRoom(clientId: string): boolean {
    const channel = this.channels.get(clientId);
    if (!channel) return false;

    try {
      channel.unsubscribe();
      this.channels.delete(clientId);
      this.subscriptions.delete(clientId);

      // Note: We'll handle Redux state update in the hook
      console.log(`✅ [ABLY UNSUBSCRIBE] Disconnected from room ${clientId}`);
      return true;
    } catch (error: any) {
      console.error(
        `[ABLY] Failed to disconnect from room ${clientId}:`,
        error,
      );
      return false;
    }
  }

  async sendMessage(
    clientId: string,
    data: any,
    options: {
      subscribeIfNotConnected?: boolean;
    },
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client || this.client.connection.state !== "connected") {
      console.warn("[ABLY] Cannot send message - client not connected");
      return { success: false, error: "Client not connected" };
    }

    const channel = this.channels.get(clientId);
    if (!channel) {
      if (options.subscribeIfNotConnected) {
        this.connectToRoom(clientId);
      }
      console.warn("[ABLY] Channel not found");
      return { success: false, error: "Channel not found" };
    }

    try {
      await channel.publish("message", {
        data,
        senderId: this.currentUserId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `📤 [ABLY SEND] Message sent to room ${buildClientRoomName(clientId)}:`,
        data,
      );
      return { success: true };
    } catch (error: any) {
      console.error(
        `[ABLY] Failed to send message to room ${clientId}:`,
        error,
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      };
    }
  }

  subscribeToRoom(
    clientId: string,
    callback: (message: any) => void,
  ): () => void {
    if (!this.subscriptions.has(clientId)) {
      this.subscriptions.set(clientId, new Set());
    }

    const callbacks = this.subscriptions.get(clientId)!;
    callbacks.add(callback);

    // Auto-connect to room if not connected
    if (!this.channels.has(clientId)) {
      this.connectToRoom(clientId);
    }

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(clientId);
      }
    };
  }

  // Getters for current state (useful for debugging)
  getConnectionState(): string {
    return this.client?.connection.state || "disconnected";
  }

  getRoomChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  isClientReady(): boolean {
    return this.client?.connection.state === "connected";
  }

  getAllChannels(): Ably.RealtimeChannel[] {
    return Array.from(this.channels.values());
  }
}

// Export singleton instance
if (!instance) {
  instance = new RealTimeService();
}

export const realTimeService = instance;
