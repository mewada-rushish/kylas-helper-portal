// src/components/elements/header/Header.jsx
import { resolveToken } from "@/lib/variable-resolver";

const LoadGoogleFont = (font) => {
  if (!font || typeof window === "undefined") return;
  const linkId = `gfont-${font.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const Header = ({ widget, context }) => {
  const textVal = resolveToken(widget.text || "Heading Text", context);
  
  if (widget.fontFamily) {
    LoadGoogleFont(widget.fontFamily);
  }

  const inlineStyles = {
    fontFamily: widget.fontFamily ? `'${widget.fontFamily}', sans-serif` : "inherit",
    fontSize: `${widget.fontSize || 24}px`,
    fontWeight: widget.fontWeight || "700",
    color: widget.textColor || "#27347B",
    textAlign: widget.textAlign || "left",
    lineHeight: widget.lineHeight || "1.2",
    letterSpacing: `${widget.letterSpacing || 0}px`,
    wordSpacing: `${widget.wordSpacing || 0}px`,
    textDecoration: widget.textDecoration || "none",
    textTransform: widget.textTransform || "none",
    margin: 0,
    width: "100%"
  };

  if (widget.linkUrl) {
    return (
      <a href={widget.linkUrl} target="_blank" rel="noopener noreferrer" style={{ ...inlineStyles, display: "inline-block" }}>
        {textVal}
      </a>
    );
  }

  return <h1 style={inlineStyles}>{textVal}</h1>;
};