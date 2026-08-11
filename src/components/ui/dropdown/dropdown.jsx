"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck, FiEdit2 } from "react-icons/fi";
import styles from "./dropdown.module.css";

export default function CustomDropdown({ options, selectedValue, onSelect, icon: Icon, triggerClassName, placeholder, allowCustom = false }) {
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

  const selectedOption = options.find(opt => opt.value === selectedValue);
  
  // If custom is allowed, and selectedValue doesn't match an option, display the custom value itself
  let displayLabel;
  if (selectedOption) {
    displayLabel = selectedOption.label;
  } else if (allowCustom && selectedValue) {
    displayLabel = selectedValue;
  } else {
    displayLabel = placeholder || (options[0] ? options[0].label : "Select...");
  }

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelect(searchQuery.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button 
        className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownActive : ""} ${triggerClassName || ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.triggerContent}>
          {Icon && <Icon className={styles.iconPrefix} />}
          <span className={styles.labelText} style={!selectedOption && !selectedValue && placeholder ? { color: 'var(--text-muted)' } : {}}>
            {displayLabel}
          </span>
        </span>
        <FiChevronDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`} />
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {(options.length > 5 || allowCustom) && (
            <div className={styles.searchInputWrapper}>
              <form onSubmit={handleCustomSubmit} style={{ width: '100%', margin: 0 }}>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  className={styles.searchInput} 
                  placeholder={allowCustom ? "Search or type custom path..." : "Search..."} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </form>
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
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
            ))
          ) : (
            !allowCustom && (
              <li className={styles.dropdownItem} style={{ justifyContent: 'center', color: '#94a3b8' }}>
                No results found
              </li>
            )
          )}
          
          {allowCustom && searchQuery.trim() && !filteredOptions.some(opt => opt.value === searchQuery.trim()) && (
            <li 
              className={`${styles.dropdownItem} ${styles.customItem}`}
              onClick={() => {
                onSelect(searchQuery.trim());
                setIsOpen(false);
              }}
              style={{ borderTop: '1px solid #e2e8f0', color: '#3b82f6', fontWeight: 500 }}
            >
              <FiEdit2 style={{ marginRight: '8px' }} /> Use custom: "{searchQuery.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}