"use client";

import styles from "./title.module.css";

/**
 * Renders an alignment control UI utility.
 * Ensure the parent editor imports this: 
 * import { renderAlignmentControl } from "./title";
 */
export const renderAlignmentControl = (value, onChange) => (
  <div className={styles.alignmentPicker}>
    {['left', 'center', 'right'].map((align) => (
      <button
        key={align}
        onClick={() => onChange(align)}
        className={value === align ? styles.active : ""}
      >
        {align.charAt(0).toUpperCase() + align.slice(1)}
      </button>
    ))}
  </div>
);

/**
 * Placeholder for Advanced Inspector UI.
 * Ensure the parent editor imports this: 
 * import { renderAdvancedInspector } from "./title";
 */
export const renderAdvancedInspector = (widget, onUpdate) => (
  <div className={styles.inspectorPanel}>
    <p>Advanced settings for {widget.type} are currently being configured.</p>
  </div>
);

export function TitleElement({ widget, parseFn, context, onUpdate }) {
  const Tag = widget.htmlTag || "h4";
  
  return (
    <div className={styles.box}>
      <Tag 
        className={styles.heading} 
        style={{ 
          textAlign: widget.textAlign || "left",
          color: widget.textColor || "inherit",
          fontSize: widget.fontSize ? `${widget.fontSize}px` : "inherit"
        }}
      >
        {parseFn(widget.text, context)}
      </Tag>
    </div>
  );
}