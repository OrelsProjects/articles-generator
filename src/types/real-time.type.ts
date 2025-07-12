export type RealTimeConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "suspended"
  | "closed"
  | "failed";

export const buildClientRoomName = (userId: string): `client:${string}` =>
  `client:${userId}`;
