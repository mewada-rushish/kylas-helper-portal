// src/components/elements/text_block/TextBlock.jsx
import { resolveToken } from "@/lib/variable-resolver";

export const TextBlock = ({ widget, context }) => {
  const cleanHtml = resolveToken(widget.text || "Enter layout text body here...", context);
  return (
    <div 
      style={{ fontSize: "14px", lineHeight: "1.6", color: "#334155", width: "100%" }} 
      dangerouslySetInnerHTML={{ __html: cleanHtml }} 
    />
  );
};