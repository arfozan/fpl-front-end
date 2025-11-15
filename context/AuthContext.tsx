// context/AuthContext.tsx
import { BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface Team {
  id: number;
  username: string;
  name: string;
  manager_name: string;
  manager_photo: string;
  logo: string;
  current_balance: number;
}

interface AuthContextType {
  user: Team | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: any) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------
  // 1. Load user on app start + auto-refresh token
  // ---------------------------------------------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const refresh = await AsyncStorage.getItem("refreshToken");

      if (!refresh) {
        setLoading(false);
        return;
      }

      // Try refreshing token immediately (like Facebook/Instagram)
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();

          await AsyncStorage.setItem("accessToken", data.access);
          if (data.refresh) {
            await AsyncStorage.setItem("refreshToken", data.refresh);
          }

          await fetchMyTeam(data.access);
        } else {
          await logout();
        }
      } catch {
        await logout();
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  // ---------------------------------------------------------------------
  // 2. Background silent refresh (every 15 min like Instagram)
  // ---------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(async () => {
      const refresh = await AsyncStorage.getItem("refreshToken");
      if (!refresh) return;

      try {
        const refreshRes = await fetch(`${BASE_URL}/api/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();

          await AsyncStorage.setItem("accessToken", data.access);
          if (data.refresh) {
            await AsyncStorage.setItem("refreshToken", data.refresh);
          }
        }
      } catch (err) {
        console.log("Silent refresh failed:", err);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Invalid username or password");
      }

      await AsyncStorage.setItem("accessToken", data.access);
      await AsyncStorage.setItem("refreshToken", data.refresh);

      await fetchMyTeam(data.access);
    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
  };

  // ---------------------------------------------------------------------
  // Fetch the logged-in manager's team
  // ---------------------------------------------------------------------
  const fetchMyTeam = async (token: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/my-team/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const team: Team = await res.json();
      setUser(team);
    } catch (err) {
      console.error("Fetch team error:", err);
      setUser(null);
    }
  };

  // ---------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------
  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    setUser(null);
  };

  // ---------------------------------------------------------------------
  // Fetch with auto-refresh
  // ---------------------------------------------------------------------
  const fetchWithAuth = async (url: string, options: any = {}) => {
    let accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    const opts: any = { ...options, headers: { ...(options.headers || {}) } };

    // Attach access token
    opts.headers["Authorization"] = `Bearer ${accessToken}`;

    // Handle body automatically
    if (opts.body instanceof FormData) {
      // Do not set Content-Type for FormData
    } else if (opts.body && typeof opts.body === "object") {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }

    let res = await fetch(url, opts);

    // If access token expired → refresh
    if (res.status === 401 && refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();

        await AsyncStorage.setItem("accessToken", data.access);
        if (data.refresh)
          await AsyncStorage.setItem("refreshToken", data.refresh);

        accessToken = data.access;
        opts.headers["Authorization"] = `Bearer ${accessToken}`;

        // Retry original request
        res = await fetch(url, opts);
      } else {
        console.log("Refresh failed, logging out.");
        await logout();
      }
    }

    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
