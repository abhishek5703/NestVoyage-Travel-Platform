import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export function Login() {
  const {
    login,
    loginWithGoogle,
    firebaseConfigured
  } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();

    setLoading(true);

    try {
      await login({
        identifier,
        password
      });

      navigate(
        params.get("next") || "/listings"
      );
    } catch (err) {
      toast.error(
        err?.code === "auth/email-not-verified"
          ? "Please verify your email first, then log in again."
          : err.response?.data?.message ||
              err.message ||
              "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!firebaseConfigured) {
      toast.error(
        "Firebase Authentication is not configured."
      );
      return;
    }

    setGoogleLoading(true);

    try {
      await loginWithGoogle();

      navigate(
        params.get("next") || "/listings"
      );
    } catch (err) {
      toast.error(
        err.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue your NestVoyage journey."
    >
      <form
        className="auth-form"
        onSubmit={submit}
      >
        {firebaseConfigured && (
          <>
            <button
              type="button"
              className="btn google-btn full"
              onClick={handleGoogleLogin}
              disabled={
                googleLoading || loading
              }
            >
              {googleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <span className="google-icon">
                    G
                  </span>
                  Continue with Google
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>
          </>
        )}

        <label>
          Email or username
          <input
            value={identifier}
            onChange={e =>
              setIdentifier(e.target.value)
            }
            required
            placeholder="you@example.com or traveler123"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
            required
          />
        </label>

        <div className="auth-meta-row">
          <span className="muted small-text">
            {firebaseConfigured
              ? "New accounts use Firebase email verification."
              : "Firebase setup is required for new accounts."}
          </span>

          <Link to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button
          disabled={
            loading || googleLoading
          }
          className="btn primary full"
        >
          {loading
            ? "Signing in..."
            : "Log in"}
        </button>

        <p className="auth-switch">
          New here?{" "}
          <Link to="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function Signup() {
  const {
    signup,
    loginWithGoogle,
    firebaseConfigured
  } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();

    if (!firebaseConfigured) {
      toast.error(
        "Configure Firebase Authentication before creating a new account."
      );
      return;
    }

    setLoading(true);

    try {
      await signup(form);

      navigate("/login?verify=1");
    } catch (err) {
      const code = err?.code || "";

      toast.error(
        code === "auth/email-already-in-use"
          ? "That email is already registered."
          : code === "auth/weak-password"
            ? "Use a stronger password."
            : err.response?.data?.message ||
                err.message ||
                "Signup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!firebaseConfigured) {
      toast.error(
        "Firebase Authentication is not configured."
      );
      return;
    }

    setGoogleLoading(true);

    try {
      /*
       * For Google accounts, the same Firebase
       * authentication flow handles both:
       *
       * - first-time signup
       * - returning login
       *
       * The backend creates a MongoDB user if
       * one does not already exist.
       */
      await loginWithGoogle();

      navigate("/listings");
    } catch (err) {
      toast.error(
        err.message ||
          "Google sign-up failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Join NestVoyage"
      subtitle="Create an account and start exploring."
    >
      <form
        className="auth-form"
        onSubmit={submit}
      >
        {firebaseConfigured && (
          <>
            <button
              type="button"
              className="btn google-btn full"
              onClick={handleGoogleSignup}
              disabled={
                googleLoading || loading
              }
            >
              {googleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <span className="google-icon">
                    G
                  </span>
                  Continue with Google
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>
                or create with email
              </span>
            </div>
          </>
        )}

        <label>
          Username
          <input
            value={form.username}
            placeholder="traveler123"
            onChange={e =>
              setForm({
                ...form,
                username: e.target.value
              })
            }
            required
          />
        </label>

        <label>
          Email
          <input
            value={form.email}
            placeholder="you@example.com"
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
            type="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            minLength="8"
            value={form.password}
            placeholder="At least 8 characters"
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            required
          />
        </label>

        <p className="auth-info">
          <strong>
            Email confirmation:
          </strong>{" "}
          Firebase will send a verification
          email after signup. Verify the
          address before your first login.
        </p>

        <button
          disabled={
            loading || googleLoading
          }
          className="btn primary full"
        >
          {loading
            ? "Creating..."
            : "Create account"}
        </button>

        <p className="auth-switch">
          Already registered?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children
}) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div>
          <div className="brand">
            <div className="brand-mark">
              N
            </div>

            <strong>
              Nest<span>Voyage</span>
            </strong>
          </div>

          <h1>
            Travel more intentionally.
          </h1>

          <p>
            Keep your stays, reviews,
            favorites, and hosting tools in
            one place.
          </p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">
            NestVoyage account
          </p>

          <h1>{title}</h1>

          <p className="muted">
            {subtitle}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}