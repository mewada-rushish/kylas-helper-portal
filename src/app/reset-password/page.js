"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";
import styles from "./page.module.css";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password updated! Signing you out...");

      // signOut clears the cookie
      await signOut({ redirect: false });
      
      setTimeout(() => {
        window.location.replace("/login");
      }, 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.brandBadge}>A</div>
            <h1>Invalid Link</h1>
            <p>This password reset link is missing or malformed.</p>
          </div>
          <div className={styles.errorBanner} role="alert">
            <FiAlertCircle className={styles.errorIcon} />
            <span>Please request a new reset link from your administrator.</span>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen overlay rendered when success — covers any cached pages
  // that might bleed through during router.push navigation. This is what
  // eliminates the dashboard flash without needing a hard window redirect.
  if (isSuccess) {
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successOverlayCard}>
          <div className={styles.successCheckCircle}>
            <FiCheckCircle />
          </div>
          <h2>Password Updated</h2>
          <p>Signing you out of all sessions...</p>
          <div className={styles.successPulse} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.brandBadge}>A</div>
          <h1>Set New Password</h1>
          <p>Create a strong password for your AsmitA Ops account.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">New Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.fieldIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                placeholder="Min. 8 characters"
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

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.fieldIcon} />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                disabled={isLoading}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className={styles.spinAnimation} style={{ marginRight: 8 }} />
                Updating password...
              </>
            ) : (
              "Set New Password"
            )}
          </button>
        </form>

        <footer className={styles.cardFooter}>
          <p>This link expires after 24 hours. Contact your admin for a new link.</p>
        </footer>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
