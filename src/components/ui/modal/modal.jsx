"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  FiX, FiCheckCircle, FiAlertTriangle, FiInfo, FiAlertCircle, FiLoader
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
  closeOnOverlayClick = true,
  icon
}) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
      document.body.style.overflow = "hidden";
    } else if (isRendered) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsAnimatingOut(false);
      }, 250); // Matches the 0.25s animation duration
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isRendered) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) onClose();
  };

  const renderAlertIcon = () => {
    const getIconClass = () => {
      switch (variant) {
        case "success": return styles.iconSuccess;
        case "warning": return styles.iconWarning;
        case "error":
        case "destructive": return styles.iconError;
        case "info":
        default: return styles.iconInfo;
      }
    };

    if (icon) {
      return <div className={`${styles.headerIcon} ${getIconClass()}`}>{icon}</div>;
    }

    switch (variant) {
      case "success":
        return <FiCheckCircle className={`${styles.headerIcon} ${styles.iconSuccess}`} />;
      case "warning":
        return <FiAlertTriangle className={`${styles.headerIcon} ${styles.iconWarning}`} />;
      case "error":
      case "destructive":
        return <FiAlertCircle className={`${styles.headerIcon} ${styles.iconError}`} />;
      case "info":
      default:
        return <FiInfo className={`${styles.headerIcon} ${styles.iconInfo}`} />;
    }
  };

  const modalComponent = (
    <div 
      className={`${styles.modalOverlay} ${isAnimatingOut ? styles.fadeOut : styles.fadeIn}`} 
      onClick={handleOverlayClick}
    >
      <div 
        className={`${styles.modalCard} ${styles[size]} ${styles[type]} ${isAnimatingOut ? styles.zoomOut : styles.zoomIn}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleBlock}>
            {(type === "alert" || icon) && renderAlertIcon()}
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
                {primaryAction.loading ? (
                  <FiLoader className={styles.spinAnimation} style={{ marginRight: 0 }} />
                ) : (
                  <>
                    {primaryAction.icon && <span className={styles.btnIcon}>{primaryAction.icon}</span>}
                    {primaryAction.label}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalComponent, document.body);
}