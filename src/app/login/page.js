"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiMail, FiAlertCircle } from "react-icons/fi";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Execute the NextAuth credential handshake protocol
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        // Auth success, route into the application layer workspace
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An unexpected authentication error occurred.");
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

        {/* Security Warning Alert */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <FiAlertCircle className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

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
                type="password"
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Authenticating session..." : "Sign in"}
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