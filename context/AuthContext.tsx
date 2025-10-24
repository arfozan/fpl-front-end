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
  name: string;  // ✅ team name
  manager_name: string;
  manager_photo: string;
  logo: string;
  current_balance: number;
}

interface AuthContextType {
  user: Team | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  fetchWithAuth: (url: string, options?: any) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        await fetchMyTeam(token);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
      // Try to read the error message returned by Django
      const errorData = await res.json().catch(() => null);
      const errorMsg =
        errorData?.detail || "Invalid username or password.";
      throw new Error(errorMsg);
    }

      const data = await res.json();
      await AsyncStorage.setItem("accessToken", data.access);
      await AsyncStorage.setItem("refreshToken", data.refresh);

      await fetchMyTeam(data.access);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const fetchMyTeam = async (token: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/my-team/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const team: Team = await res.json();
        setUser(team);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Fetch team error:", err);
      setUser(null);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    setUser(null);
  };

  // --- Fetch wrapper with auto-refresh ---
  const fetchWithAuth = async (url: string, options: any = {}) => {
  let token = await AsyncStorage.getItem("accessToken");
  const opts: any = { ...options, headers: { ...(options.headers || {}) } };

  // Add Authorization header
  opts.headers["Authorization"] = `Bearer ${token}`;

  // Detect body type
  if (opts.body instanceof FormData) {
    // ✅ FormData: DO NOT set Content-Type
  } else if (opts.body && typeof opts.body === "object") {
    // JSON: automatically stringify and set Content-Type
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }

  let res = await fetch(url, opts);

  // Handle token refresh
  if (res.status === 401) {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await AsyncStorage.setItem("accessToken", data.access);
        token = data.access;

        // Retry original request
        opts.headers["Authorization"] = `Bearer ${token}`;
        res = await fetch(url, opts);
      } else {
        console.log("Refresh token expired. Logging out.");
        await logout();
      }
    } else {
      await logout();
    }
  }
  return res;
};

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};