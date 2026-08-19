"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiMail, FiAlertCircle, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import styles from "./page.module.css";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Execute the NextAuth credential handshake protocol
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        const errorMsg = "Invalid email or password. Please try again.";
        toast.error(errorMsg);
        setIsLoading(false);
      } else {
        // Auth success, route into the application layer workspace
        router.push(callbackUrl);
      }
    } catch (err) {
      const errorMsg = "An unexpected authentication error occurred.";
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPageContainer}>
      <div className={styles.loginCard}>
        
        {/* Core Brand Header */}
        <header className={styles.cardHeader}>
          <div className={styles.brandBadge}>A</div>
          <h1>Sign in to AsmitA Ops</h1>
          <p>Kylas Integration & Helper Portal</p>
        </header>

        {/* Credential Form Sheet */}
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email address</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.fieldIcon} />
              <input
                id="email"
                type="email"
                required
                disabled={isLoading}
                placeholder="admin@asmita.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.fieldIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.rememberMeGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me for 30 days</span>
            </label>
            <Link href="/forgot-password" className={styles.forgotPasswordLink}>
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className={styles.spinAnimation} style={{ marginRight: 8 }} />
                Authenticating session...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer Subtext */}
        <footer className={styles.cardFooter}>
          <p>Authorized personnel only. Sessions are fully instrumented.</p>
        </footer>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: "16px" }}>
        <div className="page-loader-spinner" />
        <span className="page-loader-text">Loading login...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}