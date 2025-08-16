import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { socket, connectSocket, disconnectSocket } from "../services/socket";

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

export function useAuthPresence() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const userId: string | undefined = user?._id ?? user?.id;
  const markedRef = useRef(false);

  // marca offline en backend + socket
  const markOffline = async () => {
    if (markedRef.current) return;
    markedRef.current = true;

    try {
      // avisa al backend (pone isConnected=false)
      try { await api.post("/auth/logout"); } catch { /* ignora si falla */ }

      // emite presencia por socket
      try {
        connectSocket();
        if (userId) socket.emit("presence:offline", { userId });
      } catch { /* ignora */ }
    } finally {
      disconnectSocket();
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  useEffect(() => {
    // Si hay token válido, conectamos socket y avisamos online
    if (token && !isTokenExpired(token)) {
      connectSocket();
      if (userId) socket.emit("presence:online", { userId });
    } else {
      // sin token válido => offline
      void markOffline();
    }

    // Interceptor global 401 -> offline
    const resInterceptor = api.interceptors.response.use(
      r => r,
      async (error) => {
        if (error?.response?.status === 401) {
          await markOffline();
        }
        return Promise.reject(error);
      }
    );

    // Si token se borra en otra pestaña -> offline
    const onStorage = async (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) await markOffline();
    };
    window.addEventListener("storage", onStorage);

    // Heartbeat simple para expiración
    const hb = setInterval(async () => {
      const t = localStorage.getItem("token");
      if (!t || isTokenExpired(t)) await markOffline();
    }, 15000);

    return () => {
      api.interceptors.response.eject(resInterceptor);
      window.removeEventListener("storage", onStorage);
      clearInterval(hb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { token, user, userId, markOffline };
}
