"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './modal.module.css';

export default function CentralizedModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  primaryAction,
  secondaryAction,
  size = 'md',
  variant = 'primary',
  type = 'content'
}) {
  const [isRendered, setIsRendered] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsRendered(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (overlayRef.current === e.target) {
      onClose();
    }
  };

  if (!isRendered) {
    return null;
  }

  const modalSizeClass = styles[size] || styles.md;
  const modalTypeClass = styles[type] || '';
  const animationClass = isOpen ? styles.zoomIn : styles.zoomOut;

  const iconVariantClass = {
    primary: styles.iconInfo,
    success: styles.iconSuccess,
    warning: styles.iconWarning,
    destructive: styles.iconError,
  }[variant];

  const primaryButtonVariantClass = {
    primary: styles.btnPrimary,
    destructive: styles.destructive,
  }[primaryAction?.variant];

  return (
    <div ref={overlayRef} className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div
        className={`${styles.modalCard} ${modalSizeClass} ${modalTypeClass} ${animationClass}`}
        onAnimationEnd={handleAnimationEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.modalHeader} ${modalTypeClass}`}>
          <div className={styles.headerTitleBlock}>
            {icon && (
              <div className={`${styles.headerIcon} ${iconVariantClass}`}>
                {icon}
              </div>
            )}
            <div className={styles.titleTextFrame}>
              {title && <h2 className={styles.modalTitle}>{title}</h2>}
              {description && <p className={styles.modalDescription}>{description}</p>}
            </div>
          </div>
          <button className={styles.closeCrossBtn} onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>
        <div className={`${styles.modalBody} ${modalTypeClass}`}>
          {children}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className={`${styles.modalFooter} ${modalTypeClass}`}>
            {secondaryAction && (
              <button
                className={styles.secondaryBtn}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled || (primaryAction && primaryAction.loading)}
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </button>
            )}
            {primaryAction && (
              <button
                className={`${styles.primaryBtn} ${primaryButtonVariantClass || ''}`}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.loading ? (
                  <span className={styles.buttonLoader}></span>
                ) : (
                  primaryAction.icon
                )}
                <span>
                  {primaryAction.loading
                    ? (primaryAction.loadingLabel || 'Processing...')
                    : primaryAction.label}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}