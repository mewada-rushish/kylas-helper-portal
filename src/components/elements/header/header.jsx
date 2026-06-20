"use client";

import styles from "./header.module.css";

export function HeaderElement({ widget, parseFn, context }) {
  const Tag = widget.htmlTag || "h2";
  return (
    <div className={styles.wrapper}>
      <Tag 
        className={styles.title} 
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