"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001";

/**
 * Opens a Socket.IO connection authenticated with a short-lived room token
 * (minted server-side by createRealtimeToken) and wires up event listeners.
 * `token` is fetched by the caller — pass null while it's still loading and
 * the hook waits before connecting.
 */
export function useRealtime(token: string | null | undefined, handlers: Record<string, (payload: unknown) => void>) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(REALTIME_URL, { auth: { token }, transports: ["websocket", "polling"] });

    const boundEvents = Object.keys(handlersRef.current);
    for (const event of boundEvents) {
      socket.on(event, (payload: unknown) => handlersRef.current[event]?.(payload));
    }

    return () => {
      socket.disconnect();
    };
  }, [token]);
}
