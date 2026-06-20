"use client";

import styles from "./footer.module.css";

export function FooterElement({ widget, parseFn, context }) {
  const Tag = widget.htmlTag || "p";
  return (
    <div className={styles.container}>
      <Tag 
        className={styles.text} 
        style={{ 
          textAlign: widget.textAlign || "center",
          color: widget.textColor || "inherit",
          fontSize: widget.fontSize ? `${widget.fontSize}px` : "inherit"
        }}
      >
        {parseFn(widget.text, context)}
      </Tag>
    </div>
  );
}