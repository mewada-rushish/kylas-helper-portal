// src/components/elements/video_block/VideoBlock.jsx
export const VideoBlock = ({ widget }) => {
  return (
    <div style={{ width: "100%", background: "#0f172a", borderRadius: "6px", padding: "16px", color: "#ffffff", boxSizing: "border-box" }}>
      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#38bdf8", fontWeight: "600", marginBottom: "4px" }}>Media Asset Link Reference</div>
      <div style={{ fontSize: "12px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8" }}>
        {widget.url || "No destination URL bound"}
      </div>
    </div>
  );
};