import { FiSliders } from "react-icons/fi";

export const TitleControls = {
  type: "subtitle",
  label: "Section Label",
  icon: FiSliders,
  baselineConfig: {
    text: "Document Subheading Context Row",
    htmlTag: "h4",
    textAlign: "left",
    fontSize: 14,
    textColor: "#454f5b"
  },
  fields: {
    content: [
      { 
        id: "htmlTag", 
        label: "HTML Element Tag", 
        type: "select", 
        options: [
          { value: "h3", label: "Heading H3" },
          { value: "h4", label: "Subheading H4" },
          { value: "h5", label: "Heading H5" },
          { value: "p", label: "Paragraph Standard" }
        ] 
      },
      { id: "text", label: "Section Subheading Text", type: "textarea", rows: 2 }
    ],
    style: [
      { id: "textColor", label: "Font Hex Color", type: "color" },
      { id: "textAlign", label: "Alignment Grid Axis", type: "alignment_picker" },
      { id: "fontSize", label: "Size (px)", type: "number" }
    ]
  }
};