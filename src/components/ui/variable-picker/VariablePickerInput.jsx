"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiPlus, FiChevronDown, FiChevronRight, FiDatabase, FiBox } from "react-icons/fi";
import styles from "./VariablePickerInput.module.css";

// Helper to escape HTML to prevent XSS in contentEditable
const escapeHtml = (unsafe) => {
    return (unsafe || "").toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

export default function VariablePickerInput({ 
  value = "", 
  onChange, 
  availableVariables = [], // Expected format: [{ stepId, stepTitle, type: 'trigger|action', fields: [{ path, label, sample }] }]
  placeholder = "Type or insert variables...",
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSteps, setExpandedSteps] = useState({});
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);

  // Initialize contentEditable only once or when external value changes completely
  // In a robust implementation, you'd sync HTML to raw value (with {{tokens}}).
  // For simplicity, we store the raw value as "Hello {{step.path}}", 
  // and when rendering, we convert {{...}} to <span class="zap-pill">...</span>
  
  const rawToHtml = useCallback((rawStr) => {
    let html = escapeHtml(rawStr);
    // Convert {{path}} to pill
    html = html.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return `<span class="zap-pill" contenteditable="false" data-path="${escapeHtml(path)}">${escapeHtml(path)}</span>`;
    });
    return html;
  }, []);

  const htmlToRaw = useCallback((html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    // Replace pills with {{path}}
    const pills = temp.querySelectorAll('.zap-pill');
    pills.forEach(pill => {
      const path = pill.getAttribute('data-path');
      const textNode = document.createTextNode(`{{${path}}}`);
      pill.parentNode.replaceChild(textNode, pill);
    });
    
    // Convert remaining HTML (br tags, etc.) to text
    return temp.innerText || temp.textContent || "";
  }, []);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const newHtml = rawToHtml(value);
      if (editorRef.current.innerHTML !== newHtml) {
        editorRef.current.innerHTML = newHtml;
      }
    }
  }, [value, rawToHtml]);

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize all steps as expanded by default
  useEffect(() => {
    if (availableVariables.length > 0 && Object.keys(expandedSteps).length === 0) {
      const initialExpanded = {};
      availableVariables.forEach(g => initialExpanded[g.stepId] = true);
      setExpandedSteps(initialExpanded);
    }
  }, [availableVariables]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const raw = htmlToRaw(editorRef.current.innerHTML);
      if (onChange) onChange(raw);
    }
  };

  const insertVariable = (path) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      let range;

      if (savedSelectionRef.current) {
        range = savedSelectionRef.current;
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        // Fallback: append at the end
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Create pill element
      const pill = document.createElement("span");
      pill.className = "zap-pill";
      pill.contentEditable = "false";
      pill.setAttribute("data-path", path);
      pill.innerText = path;

      range.deleteContents();
      range.insertNode(pill);
      
      // Add a space after the pill
      const space = document.createTextNode("\u00A0"); // Non-breaking space
      range.setStartAfter(pill);
      range.insertNode(space);
      
      // Move cursor after space
      range.setStartAfter(space);
      range.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput(); // trigger onChange
    }
    setIsOpen(false);
  };

  const toggleStep = (stepId, e) => {
    e.stopPropagation();
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Filtering
  const filteredGroups = availableVariables.map(group => {
    if (!searchQuery) return group;
    const filteredFields = group.fields.filter(f => 
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (f.label && f.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.sample && String(f.sample).toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return { ...group, fields: filteredFields };
  }).filter(group => group.fields.length > 0);

  return (
    <div className={styles.pickerContainer} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <div 
          ref={editorRef}
          className={styles.editorArea}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={handleInput}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          style={style}
        ></div>
        <button 
          type="button"
          className={`${styles.triggerButton} ${isOpen ? styles.triggerActive : ""}`}
          onClick={() => {
            saveSelection();
            setIsOpen(!isOpen);
          }}
          title="Insert Data"
        >
          <FiDatabase size={14} />
          <FiPlus size={10} style={{ position: 'absolute', bottom: 6, right: 6, background: '#fff', borderRadius: '50%' }} />
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.searchHeader}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search variables..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ overflowY: 'auto' }}>
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <div key={group.stepId} className={styles.stepGroup}>
                  <div className={styles.stepHeader} onClick={(e) => toggleStep(group.stepId, e)}>
                    {expandedSteps[group.stepId] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    <FiBox className={styles.stepIcon} size={14} />
                    <span>{group.stepTitle}</span>
                  </div>
                  
                  {expandedSteps[group.stepId] && (
                    <div className={styles.variableList}>
                      {group.fields.map(field => (
                        <div 
                          key={field.path} 
                          className={styles.variableItem}
                          onClick={() => insertVariable(field.path)}
                        >
                          <div className={styles.varNameRow}>
                            <span className={styles.varName}>{field.label || field.path}</span>
                            <span className={styles.varType}>{typeof field.sample !== 'undefined' ? typeof field.sample : 'string'}</span>
                          </div>
                          {field.sample !== undefined && field.sample !== null && (
                            <div className={styles.varSample}>
                              {typeof field.sample === 'object' ? JSON.stringify(field.sample) : String(field.sample)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No variables found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
