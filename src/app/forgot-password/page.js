"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMail, FiLoader, FiAlertCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import styles from "../login/page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request password reset");
      }

      setIsSuccess(true);
      toast.success("Password reset link sent to your email!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.loginPageContainer}>
        <div className={styles.loginCard}>
          <header className={styles.cardHeader}>
            <div className={styles.brandBadge} style={{ background: "#e8f5e9", color: "#2e7d32", border: "none" }}>
              <FiCheckCircle size={24} />
            </div>
            <h1>Check your email</h1>
            <p style={{ marginTop: "12px", lineHeight: "1.5" }}>
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
          </header>
          <Link href="/login" className={styles.submitButton} style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPageContainer}>
      <div className={styles.loginCard}>
        
        <header className={styles.cardHeader}>
          <div className={styles.brandBadge}>A</div>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </header>

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

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !email}
            style={{ marginTop: "16px" }}
          >
            {isLoading ? (
              <>
                <FiLoader className={styles.spinAnimation} style={{ marginRight: 8 }} />
                Sending link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "#007aff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FiArrowLeft /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
