"use client";

import styles from "./button.module.css";

export default function AdminButton({ 
  children, 
  icon: Icon, 
  variant = "secondary", 
  onClick, 
  isActive = false, 
  disabled = false,
  type = "button",
  className = "" 
}) {
  const buttonClassName = [
    styles.btnBase,
    styles[`btn_${variant}`],
    isActive ? styles.btnActive : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <button 
      type={type}
      className={buttonClassName} 
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.btnContent}>
        {Icon && <Icon className={styles.btnIcon} />}
        {children && <span className={styles.btnText}>{children}</span>}
      </span>
    </button>
  );
}