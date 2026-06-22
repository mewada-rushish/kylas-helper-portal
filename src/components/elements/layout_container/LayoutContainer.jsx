// src/components/elements/layout_container/LayoutContainer.jsx
import React from "react";

const computeContainerStyles = (node) => {
  const isImg = node.bgType === "image" || node.bgImage;
  return {
    backgroundColor: node.backgroundColor || "transparent",
    backgroundImage: isImg ? `url(${node.bgImage})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    border: node.borderStyle && node.borderStyle !== "none" ? `${node.borderWidth ?? 1}px ${node.borderStyle} ${node.borderColor || "#cbd5e1"}` : "none",
    borderRadius: `${node.borderRadius ?? 0}px`,
    color: node.textColor || "inherit",
    minHeight: node.heightType === "fixed" ? `${node.minHeight || 100}px` : "auto"
  };
};

export const LayoutContainer = ({ widget, context, renderWidgetFn }) => {
  const columnsList = widget.columns || [];

  const mainSectionStyle = {
    position: "relative",
    display: "flex",
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    boxSizing: "border-box",
    maxWidth: widget.contentWidth === "boxed" ? "1200px" : "100%",
    margin: `${widget.marginTop ?? 0}px ${widget.marginRight ?? 0}px ${widget.marginBottom ?? 0}px ${widget.marginLeft ?? 0}px`,
    padding: `${widget.paddingTop ?? 16}px ${widget.paddingRight ?? 16}px ${widget.paddingBottom ?? 16}px ${widget.paddingLeft ?? 16}px`,
    alignItems: widget.verticalAlign || "stretch",
    ...computeContainerStyles(widget)
  };

  const sectionOverlayStyle = {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: widget.overlayColor || "transparent",
    opacity: (widget.overlayOpacity ?? 0) / 100,
    pointerEvents: "none",
    zIndex: 1,
    borderRadius: `${widget.borderRadius ?? 0}px`
  };

  return (
    <div style={mainSectionStyle} className={`device-view-${widget.deviceVisibility || "all"}`}>
      {widget.overlayColor && <div style={sectionOverlayStyle} />}
      
      {columnsList.map((col) => {
        const structuralColumnTrackStyle = {
          position: "relative",
          flex: `0 0 ${col.width || 100}%`,
          width: `${col.width || 100}%`,
          display: "flex",
          flexDirection: "column",
          justifyContent: col.verticalAlign || "flex-start",
          boxSizing: "border-box",
          margin: `${col.marginTop ?? 0}px ${col.marginRight ?? 0}px ${col.marginBottom ?? 0}px ${col.marginLeft ?? 0}px`,
          padding: `${col.paddingTop ?? 12}px ${col.paddingRight ?? 12}px ${col.paddingBottom ?? 12}px ${col.paddingLeft ?? 12}px`,
          zIndex: 2,
          ...computeContainerStyles(col)
        };

        const columnOverlayStyle = {
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: col.overlayColor || "transparent",
          pointerEvents: "none",
          zIndex: 1,
          borderRadius: `${col.borderRadius ?? 0}px`
        };

        return (
          <div key={col.columnId} style={structuralColumnTrackStyle} className="studio-col-added-animate">
            {col.overlayColor && <div style={columnOverlayStyle} />}
            <div style={{ position: "relative", zIndex: 2, width: "100%", height: "100%" }}>
              {renderWidgetFn ? renderWidgetFn(col, context) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};