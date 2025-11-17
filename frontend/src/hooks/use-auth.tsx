import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged, getIdToken } from "@/lib/firebase";

type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getToken = async () => {
    const current = auth.currentUser;
    if (!current) return null;
    try {
      return await getIdToken(current, /* forceRefresh */ false);
    } catch (e) {
      console.warn("Failed to get id token", e);
      return null;
    }
  };

  return <AuthContext.Provider value={{ user, loading, getToken }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
