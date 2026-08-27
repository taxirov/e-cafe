import jwt from "jsonwebtoken";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001";
const JWT_SECRET = process.env.REALTIME_JWT_SECRET as string;
const API_KEY = process.env.REALTIME_API_KEY as string;

export const ADMIN_ROOM = "admin";
/** Staff room (owner/waiter/kitchen) — every live event for one cafe. */
export const cafeRoom = (cafeId: string) => `cafe:${cafeId}`;
/** Per-order room a guest customer's tracking page subscribes to. */
export const orderRoom = (orderId: string) => `order:${orderId}`;

/** Mints a short-lived token the browser uses to authenticate its Socket.IO connection. */
export function createRealtimeToken(params: { room: string; userId: string; role: string }) {
  return jwt.sign(params, JWT_SECRET, { expiresIn: "12h" });
}

/** Broadcasts an event to everyone connected to a room (called after DB writes). */
export async function broadcastToRoom(room: string, event: string, payload?: unknown) {
  try {
    await fetch(`${REALTIME_URL}/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ room, event, payload }),
    });
  } catch {
    // Realtime is a non-critical enhancement — never fail the calling mutation because of it.
  }
}

export function broadcastToCafe(cafeId: string, event: string, payload?: unknown) {
  return broadcastToRoom(cafeRoom(cafeId), event, payload);
}

export function broadcastToOrder(orderId: string, event: string, payload?: unknown) {
  return broadcastToRoom(orderRoom(orderId), event, payload);
}

/** Notifies every connected Super Admin (e.g. a new cafe just registered). */
export function broadcastToAdmins(event: string, payload?: unknown) {
  return broadcastToRoom(ADMIN_ROOM, event, payload);
}
