// src/hooks/useAuthPresence.ts
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
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed) return null;

      // 🔑 normalizamos: si viene con "id", lo copiamos a "_id"
      if (parsed.id && !parsed._id) {
        parsed._id = parsed.id;
      }

      return parsed;
    } catch {
      return null;
    }
  }, []);

  // ⚠️ usar siempre _id (el de Mongo)
  const userId: string | undefined = user?._id;

  const markedRef = useRef(false);

  // marca offline en backend + socket
  const markOffline = async () => {
    if (markedRef.current) return;
    markedRef.current = true;

    try {
      try {
        await api.post("/auth/logout");
      } catch {
        /* ignora si falla */
      }

      try {
        connectSocket();
        if (userId) {
          socket.emit("presence:offline", { userId });
          
        }
      } catch {
        console.log("[AuthPresence] ⚠️ error al emitir offline");
      }
    } finally {
      disconnectSocket();
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  useEffect(() => {

    if (token && !isTokenExpired(token)) {
      connectSocket();
      if (userId) {
        socket.emit("presence:online", { userId });
      }
    } else {
      void markOffline();
    }

    const resInterceptor = api.interceptors.response.use(
      (r) => r,
      async (error) => {
        if (error?.response?.status === 401) {
          await markOffline();
        }
        return Promise.reject(error);
      }
    );

    const onStorage = async (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) await markOffline();
    };
    window.addEventListener("storage", onStorage);

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
  }, [token, userId]);

  return { token, user, userId, markOffline };
}
