/**
 * Login Page
 * Authentication page for the CRM dashboard
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showBotCheck, setShowBotCheck] = useState(false);
  const [botCheckConfirmed, setBotCheckConfirmed] = useState(false);
  const attemptsResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Get redirect location from state (set by ProtectedRoute)
  const from = location.state?.from?.pathname || "/dashboard";

  const BOT_CHECK_THRESHOLD = 3; // Show bot check after 3 failed attempts
  const ATTEMPTS_RESET_TIME = 30000; // Reset attempts after 30 seconds

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  // Reset attempts after a period of inactivity
  useEffect(() => {
    if (loginAttempts > 0) {
      // Clear existing timeout
      if (attemptsResetTimeoutRef.current) {
        clearTimeout(attemptsResetTimeoutRef.current);
      }

      // Set new timeout to reset attempts
      attemptsResetTimeoutRef.current = setTimeout(() => {
        setLoginAttempts(0);
        setShowBotCheck(false);
        setBotCheckConfirmed(false);
      }, ATTEMPTS_RESET_TIME);

      return () => {
        if (attemptsResetTimeoutRef.current) {
          clearTimeout(attemptsResetTimeoutRef.current);
        }
      };
    }
  }, [loginAttempts]);

  // Show bot check when threshold is reached (only reset on first threshold hit)
  useEffect(() => {
    if (loginAttempts === BOT_CHECK_THRESHOLD) {
      setShowBotCheck(true);
      setBotCheckConfirmed(false);
    }
  }, [loginAttempts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if bot check is required and confirmed
    if (showBotCheck && !botCheckConfirmed) {
      setError("Please confirm you are not a bot");
      toast.error("Please confirm you are not a bot");
      return;
    }

    setError(null);

    // Validate inputs before setting loading state
    if (!email || !password) {
      setError("Email and password are required");
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        toast.success("Logged in successfully");
        // Reset attempts and bot check on success
        setLoginAttempts(0);
        setShowBotCheck(false);
        setBotCheckConfirmed(false);
        if (attemptsResetTimeoutRef.current) {
          clearTimeout(attemptsResetTimeoutRef.current);
        }
        navigate(from, { replace: true });
      } else {
        // Increment login attempts only on failed login attempt (actual API call failed)
        setLoginAttempts((prev) => prev + 1);
        const msg = result.error || "Invalid credentials";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      // Increment login attempts on exception during API call
      setLoginAttempts((prev) => prev + 1);
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-54 w-34 rounded-lg flex items-center justify-center bg-white ">
              <img
                src={`${import.meta.env.BASE_URL}ressy-logo.png`}
                alt="Ressy AI Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ressy Client Dashboard</h1>
          <p className="text-muted-foreground">Sign in to manage orders, reservations, and more.</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Bot Check */}
              {showBotCheck && (
                <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <Label htmlFor="bot-check" className="text-sm font-medium cursor-pointer">
                      Bot Check
                    </Label>
                    <Checkbox
                      id="bot-check"
                      checked={botCheckConfirmed}
                      onCheckedChange={(checked) => {
                        setBotCheckConfirmed(checked === true);
                        if (checked) {
                          setError(null);
                        }
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This check will reset automatically after 30 seconds of inactivity or when you
                    successfully sign in.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || (showBotCheck && !botCheckConfirmed)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Button
              variant="link"
              className="text-primary p-0 h-auto text-sm"
              onClick={() => window.open("mailto:info@ressy.ai")}
            >
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
