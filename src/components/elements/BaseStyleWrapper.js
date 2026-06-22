// src/components/elements/BaseStyleWrapper.js
export const BaseStyleWrapper = ({ widget, children }) => {
  const styles = {
    // Spacing
    marginTop: `${widget.advanced?.marginTop ?? 0}px`,
    marginRight: `${widget.advanced?.marginRight ?? 0}px`,
    marginBottom: `${widget.advanced?.marginBottom ?? 0}px`,
    marginLeft: `${widget.advanced?.marginLeft ?? 0}px`,
    paddingTop: `${widget.advanced?.paddingTop ?? 12}px`,
    paddingRight: `${widget.advanced?.paddingRight ?? 12}px`,
    paddingBottom: `${widget.advanced?.paddingBottom ?? 12}px`,
    paddingLeft: `${widget.advanced?.paddingLeft ?? 12}px`,
    
    // Border & Background
    border: widget.advanced?.borderType && widget.advanced?.borderType !== "none" 
      ? `${widget.advanced?.borderWidth ?? 0}px ${widget.advanced?.borderType} ${widget.advanced?.borderColor ?? "#cbd5e1"}` 
      : "none",
    borderRadius: `${widget.advanced?.borderRadius ?? 0}px`,
    backgroundColor: widget.backgroundColor || "transparent"
  };
  
  return <div style={styles}>{children}</div>;
};