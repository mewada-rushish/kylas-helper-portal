// src/components/elements/header/schema.js
import { FiType } from "react-icons/fi";

export const HeaderSchema = {
  type: "header",
  label: "Title Heading",
  icon: FiType,
  baselineConfig: { 
    text: "New Document Heading", 
    fontSize: 24, 
    fontFamily: "Montserrat", 
    fontWeight: "700", 
    textColor: "#27347B", 
    textAlign: "left",
    lineHeight: "1.2",
    letterSpacing: 0,
    wordSpacing: 0,
    textDecoration: "none",
    textTransform: "none"
  },
  fields: {
    content: [
      { id: "text", type: "text", label: "Heading Text Content" },
      { id: "linkUrl", type: "text", label: "Link URL (Optional Anchor)" }
    ],
    style: [
      { id: "fontFamily", type: "select", label: "Google Font Family", options: [{ value: "Montserrat", label: "Montserrat" }, { value: "Poppins", label: "Poppins" }, { value: "Inter", label: "Inter" }, { value: "Roboto", label: "Roboto" }, { value: "Lato", label: "Lato" }] },
      { id: "fontSize", type: "number", label: "Font Size (px)" },
      { id: "fontWeight", type: "select", label: "Font Weight", options: [{ value: "300", label: "Light" }, { value: "400", label: "Regular" }, { value: "500", label: "Medium" }, { value: "600", label: "Semi-Bold" }, { value: "700", label: "Bold" }] },
      { id: "textColor", type: "color", label: "Text Color Hex" },
      { id: "textAlign", type: "alignment_picker", label: "Text Alignment" },
      { id: "lineHeight", type: "text", label: "Line Height Ratio (e.g. 1.5)" },
      { id: "letterSpacing", type: "number", label: "Letter Spacing (px)" },
      { id: "wordSpacing", type: "number", label: "Word Spacing (px)" },
      { id: "textDecoration", type: "select", label: "Text Decoration Line", options: [{ value: "none", label: "None" }, { value: "underline", label: "Underline" }, { value: "line-through", label: "Line-Through" }] },
      { id: "textTransform", type: "select", label: "Text Case Transform", options: [{ value: "none", label: "None Default" }, { value: "uppercase", label: "UPPERCASE" }, { value: "lowercase", label: "lowercase" }, { value: "capitalize", label: "Capitalize" }] }
    ]
  }
};