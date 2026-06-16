"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import styles from "./dropdown.module.css";

export default function CustomDropdown({ options, selectedValue, onSelect, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === selectedValue) || options[0];

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button 
        className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownActive : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.triggerContent}>
          {Icon && <Icon className={styles.iconPrefix} />}
          <span className={styles.labelText}>{selectedOption.label}</span>
        </span>
        <FiChevronDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`} />
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {options.map((opt) => (
            <li 
              key={opt.value} 
              className={`${styles.dropdownItem} ${opt.value === selectedValue ? styles.itemSelected : ""}`}
              onClick={() => {
                onSelect(opt.value);
                setIsOpen(false);
              }}
            >
              <span className={styles.itemLabel}>{opt.label}</span>
              {opt.value === selectedValue && <FiCheck className={styles.checkIcon} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}