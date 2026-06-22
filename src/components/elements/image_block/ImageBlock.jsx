// src/components/elements/image_block/ImageBlock.jsx
export const ImageBlock = ({ widget }) => {
  if (!widget.url) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "6px", color: "#94a3b8", fontSize: "12px" }}>
        No Image Linked (Link View Active)
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: widget.align || "center", width: "100%" }}>
      <img 
        src={widget.url} 
        alt="Invoice Asset Document Image" 
        style={{ maxWidth: "100%", height: "auto", maxHeight: `${widget.maxHeight || 200}px`, objectFit: "contain" }} 
      />
    </div>
  );
};