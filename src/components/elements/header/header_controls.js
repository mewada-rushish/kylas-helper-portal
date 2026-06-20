import { FiType } from "react-icons/fi";

export const HeaderControls = {
  type: "header",
  label: "Title Banner",
  icon: FiType,
  baselineConfig: {
    text: "TAX INVOICE STATEMENT",
    htmlTag: "h2",
    textAlign: "center",
    fontSize: 22,
    textColor: "#ffffff"
  },
  fields: {
    content: [
      { 
        id: "htmlTag", 
        label: "HTML Element Tag", 
        type: "select", 
        options: [
          { value: "h1", label: "Heading H1 Layer" },
          { value: "h2", label: "Heading H2 Layer" },
          { value: "h3", label: "Heading H3 Layer" },
          { value: "p", label: "Paragraph Standard" }
        ] 
      },
      { id: "text", label: "Display Copy Text", type: "textarea", rows: 3 }
    ],
    style: [
      { id: "textColor", label: "Font Hex Color", type: "color" },
      { id: "textAlign", label: "Alignment Grid Axis", type: "alignment_picker" },
      { id: "fontSize", label: "Size (px)", type: "number" }
    ]
  }
};