import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  signInWithEmailAndPassword,
  googleProvider,
  signInWithPopup,
} from "@/lib/firebase";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        await signInWithEmailAndPassword(auth, email, password);

        // Verify/prime backend session (backend verifies ID token)
        try {
          await api.backendMe();
        } catch (e) {
          console.warn("backend /auth/me failed", e);
        }

        // navigation will be handled by useEffect redirect when auth state updates
      } catch (err) {
        console.error("Auth error:", err);
        // TODO: show UI error
      }
    })();
  };

  const handleGoogleSignIn = () => {
    (async () => {
      try {
        await signInWithPopup(auth, googleProvider);
        try {
          await api.backendMe();
        } catch (e) {
          console.warn("backend /auth/me failed", e);
        }
        navigate("/chat");
      } catch (e) {
        console.error("Google sign-in error", e);
      }
    })();
  };

  // Redirect already-authenticated users away from auth page
  useEffect(() => {
    if (!loading && user) {
      navigate("/chat");
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold" style={{ letterSpacing: 0, lineHeight: 1.4 }}>
            مرحباً بعودتك
          </h1>
          <p className="text-base text-muted-foreground" style={{ lineHeight: 1.8 }}>
            سجّل دخولك للمتابعة
          </p>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-border hover:bg-muted/50 text-base"
            onClick={handleGoogleSignIn}
          >
            <svg className="ml-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            المتابعة بحساب جوجل
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="عنوان البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              style={{ textAlign: 'right' }}
              required
            />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              style={{ textAlign: 'right' }}
              required
            />
            <Button type="submit" className="w-full h-12 text-base font-semibold">
              تسجيل الدخول
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
