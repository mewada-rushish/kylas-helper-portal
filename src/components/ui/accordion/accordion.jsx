"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./accordion.module.css";

export default function Accordion({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.wrapper}>
      <button 
        type="button" 
        className={styles.header} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h2>
          {Icon && <Icon className={styles.headerIcon} />}
          <span>{title}</span>
        </h2>
        <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.iconRotated : ""}`} />
      </button>
      <div className={`${styles.body} ${isOpen ? styles.open : ""}`}>
        {children}
      </div>
    </div>
  );
}