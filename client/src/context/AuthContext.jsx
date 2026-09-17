import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import http from "../api/http";
import { firebaseAuth, firebaseConfigured } from "../lib/firebase";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

async function createBackendSession(firebaseUser) {
  const idToken = await firebaseUser.getIdToken(true);
  const { data } = await http.post("/auth/firebase/session", { idToken });
  return data.user;
}

/*
 * Google provider
 */
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await http.get("/auth/me");
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!firebaseConfigured || !firebaseAuth) {
      refresh();
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async firebaseUser => {
        try {
          if (firebaseUser?.emailVerified) {
            const mongoUser = await createBackendSession(firebaseUser);
            setUser(mongoUser);
          } else {
            await refresh();
          }
        } catch {
          await refresh();
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
   * Email/password signup
   */
  const signup = async ({ username, email, password }) => {
    if (!firebaseConfigured || !firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not configured yet."
      );
    }

    let firebaseUser = null;

    try {
      const credential =
        await createUserWithEmailAndPassword(
          firebaseAuth,
          email.trim(),
          password
        );

      firebaseUser = credential.user;

      await updateProfile(firebaseUser, {
        displayName: username.trim()
      });

      await sendEmailVerification(firebaseUser);

      const idToken = await firebaseUser.getIdToken(true);

      const { data } = await http.post(
        "/auth/firebase/signup",
        {
          idToken,
          username: username.trim()
        }
      );

      await signOut(firebaseAuth);
      setUser(null);

      toast.success(
        "Account created. Check your email to verify your account."
      );

      return data;
    } catch (error) {
      if (firebaseUser) {
        try {
          await deleteUser(firebaseUser);
        } catch (_) {
          // Firebase cleanup can be handled manually if necessary.
        }
      }

      throw error;
    }
  };

  /*
   * Email/password login
   */
  const login = async ({ identifier, password }) => {
    const value = identifier.trim();

    if (
      firebaseConfigured &&
      firebaseAuth &&
      value.includes("@")
    ) {
      try {
        const credential =
          await signInWithEmailAndPassword(
            firebaseAuth,
            value,
            password
          );

        if (!credential.user.emailVerified) {
          await signOut(firebaseAuth);

          const error = new Error(
            "Please verify your email address before logging in."
          );

          error.code = "auth/email-not-verified";

          throw error;
        }

        const mongoUser =
          await createBackendSession(credential.user);

        setUser(mongoUser);

        toast.success("Welcome back!");

        return;
      } catch (error) {
        if (error?.code === "auth/email-not-verified") {
          throw error;
        }

        try {
          await signOut(firebaseAuth);
        } catch (_) {}

        /*
         * Preserve old NestVoyage local accounts.
         */
        try {
          const { data } = await http.post(
            "/auth/login",
            {
              identifier: value,
              password
            }
          );

          setUser(data.user);

          toast.success("Welcome back!");

          return;
        } catch (_) {
          throw error;
        }
      }
    }

    const { data } = await http.post(
      "/auth/login",
      {
        identifier: value,
        password
      }
    );

    setUser(data.user);

    toast.success("Welcome back!");
  };

  /*
   * Google login/signup
   *
   * The backend already handles both cases:
   * - Existing user → login/link Firebase
   * - New user → create NestVoyage user
   */
  const loginWithGoogle = async () => {
    if (!firebaseConfigured || !firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not configured yet."
      );
    }

    try {
      const result = await signInWithPopup(
        firebaseAuth,
        googleProvider
      );

      const firebaseUser = result.user;

      /*
       * Google accounts are considered verified by Firebase.
       */
      const mongoUser =
        await createBackendSession(firebaseUser);

      setUser(mongoUser);

      toast.success("Welcome to NestVoyage!");

      return mongoUser;
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user") {
        throw new Error(
          "Google sign-in was cancelled."
        );
      }

      if (error?.code === "auth/popup-blocked") {
        throw new Error(
          "Google sign-in popup was blocked. Please allow popups for localhost."
        );
      }

      if (
        error?.code ===
        "auth/account-exists-with-different-credential"
      ) {
        throw new Error(
          "An account already exists with this email using a different sign-in method."
        );
      }

      throw error;
    }
  };

  const resendVerification = async () => {
    if (!firebaseAuth?.currentUser) {
      throw new Error(
        "No pending Firebase signup was found."
      );
    }

    await sendEmailVerification(
      firebaseAuth.currentUser
    );
  };

  const logout = async () => {
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
      }

      await http.post("/auth/logout");
    } finally {
      setUser(null);
      toast.success("You are logged out.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        refresh,
        signup,
        login,
        loginWithGoogle,
        logout,
        resendVerification,
        firebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);