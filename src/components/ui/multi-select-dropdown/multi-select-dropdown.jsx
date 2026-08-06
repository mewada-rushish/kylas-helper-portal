"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import styles from "./multi-select-dropdown.module.css";

export default function MultiSelectDropdown({ options, selectedValues = [], onSelect, icon: Icon, triggerClassName, placeholder, itemStyle, itemClassName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Focus search input on next tick if possible
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const displayLabel = placeholder || (options[0] ? options[0].label : "Select...");

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button 
        className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownActive : ""} ${triggerClassName || ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.triggerContent}>
          {Icon && <Icon className={styles.iconPrefix} />}
          <span className={styles.labelText} style={{ color: 'var(--text-muted)' }}>
            {displayLabel}
          </span>
        </span>
        <FiChevronDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`} />
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {options.length > 5 && (
            <div className={styles.searchInputWrapper}>
              <input 
                ref={searchInputRef}
                type="text" 
                className={styles.searchInput} 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li 
                key={opt.value} 
                className={`${styles.dropdownItem} ${selectedValues.includes(opt.value) ? styles.itemSelected : ""} ${itemClassName || ""}`}
                style={itemStyle}
                onClick={() => {
                  onSelect(opt.value);
                }}
              >
                <span className={styles.itemLabel}>{opt.label}</span>
                {selectedValues.includes(opt.value) && <FiCheck className={styles.checkIcon} />}
              </li>
            ))
          ) : (
            <li className={styles.dropdownItem} style={{ justifyContent: 'center', color: '#94a3b8' }}>
              No results found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}