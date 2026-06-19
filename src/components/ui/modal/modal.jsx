"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  FiX, FiCheckCircle, FiAlertTriangle, FiInfo, FiAlertCircle 
} from "react-icons/fi";
import styles from "./modal.module.css";

export default function CentralizedModal({
  isOpen,
  onClose,
  type = "content",
  variant = "info",
  size = "md",
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  closeOnOverlayClick = true
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) onClose();
  };

  const renderAlertIcon = () => {
    switch (variant) {
      case "success":
        return <FiCheckCircle className={`${styles.alertIcon} ${styles.iconSuccess}`} />;
      case "warning":
        return <FiAlertTriangle className={`${styles.alertIcon} ${styles.iconWarning}`} />;
      case "error":
      case "destructive":
        return <FiAlertCircle className={`${styles.alertIcon} ${styles.iconError}`} />;
      case "info":
      default:
        return <FiInfo className={`${styles.alertIcon} ${styles.iconInfo}`} />;
    }
  };

  const modalComponent = (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div 
        className={`${styles.modalCard} ${styles[size]} ${styles[type]} ${type === "alert" ? styles[variant] : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleBlock}>
            {type === "alert" && renderAlertIcon()}
            <div className={styles.titleTextFrame}>
              <h3 className={styles.modalTitle}>{title}</h3>
              {description && <p className={styles.modalDescription}>{description}</p>}
            </div>
          </div>
          {type === "content" && (
            <button className={styles.closeCrossBtn} onClick={onClose} aria-label="Close modal">
              <FiX />
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          {children}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className={styles.modalFooter}>
            {secondaryAction && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                type={primaryAction.type || "button"}
                className={`${styles.primaryBtn} ${primaryAction.variant ? styles[primaryAction.variant] : styles.btnPrimary}`}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.loading ? "Processing..." : primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalComponent, document.body);
}