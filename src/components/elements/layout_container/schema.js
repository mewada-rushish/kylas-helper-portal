// src/components/elements/layout_container/schema.js
import { FiGrid } from "react-icons/fi";

export const LayoutContainerSchema = {
  type: "layout_container",
  label: "Layout Section",
  icon: FiGrid,
  baselineConfig: {
    // Section Content Baselines
    numColumns: 1,
    contentWidth: "boxed",
    heightType: "auto",
    minHeight: 0,
    verticalAlign: "stretch",
    
    // Section Style Baselines
    bgType: "color",
    backgroundColor: "#ffffff",
    bgImage: "",
    overlayColor: "transparent",
    overlayOpacity: 0,
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 0,
    textColor: "#334155",
    headingColor: "#27347B",

    // Section Advanced Layout Baselines
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16,
    animationType: "none",
    deviceVisibility: "all",

    // Managed Columns Matrix
    columns: [
      {
        columnId: "col_default_1",
        width: 100,
        verticalAlign: "stretch",
        backgroundColor: "transparent",
        bgImage: "",
        overlayColor: "transparent",
        borderStyle: "none",
        borderWidth: 0,
        borderRadius: 0,
        marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
        paddingTop: 12, paddingRight: 12, paddingBottom: 12, paddingLeft: 12,
        animationType: "none",
        deviceVisibility: "all",
        widgets: []
      }
    ]
  },
  fields: {
    section: {
      content: [
        { id: "numColumns", type: "select", label: "Number of Columns", options: [{ value: 1, label: "1 Column Grid" }, { value: 2, label: "2 Columns Equal Split" }, { value: 3, label: "3 Columns Tri-split" }, { value: 4, label: "4 Columns Quad-split" }] },
        { id: "contentWidth", type: "select", label: "Content Width Bounds", options: [{ value: "boxed", label: "Boxed Frame (Standard standard view)" }, { value: "full", label: "Full Width Layout (Edge-to-edge)" }] },
        { id: "heightType", type: "select", label: "Height Scaling Model", options: [{ value: "auto", label: "Auto Fit Context Content" }, { value: "fixed", label: "Fixed Track Dimension" }] },
        { id: "minHeight", type: "number", label: "Minimum Row Height Bounds (px)" },
        { id: "verticalAlign", type: "select", label: "Vertical Column Alignment", options: [{ value: "flex-start", label: "Top Anchor" }, { value: "center", label: "Middle Balanced" }, { value: "flex-end", label: "Bottom Anchor" }, { value: "stretch", label: "Stretch Column Tracks" }] }
      ],
      style: [
        { id: "bgType", type: "select", label: "Background Processing Engine Type", options: [{ value: "color", label: "Solid Color Fill Hex" }, { value: "image", label: "Media CDN Image URL" }] },
        { id: "backgroundColor", type: "color", label: "Solid Background Color" },
        { id: "bgImage", type: "text", label: "Media Image Asset link Source URL" },
        { id: "overlayColor", type: "color", label: "Tint Overlay Mask Screen Color" },
        { id: "overlayOpacity", type: "number", label: "Overlay Screen Opacity Percentage (0-100)" },
        { id: "borderStyle", type: "select", label: "Border Frame Stroke Type", options: [{ value: "none", label: "None Grid lines" }, { value: "solid", label: "Solid Outer Boundary" }, { value: "dashed", label: "Dashed Track Outline" }] },
        { id: "borderWidth", type: "number", label: "Border Line Stroke Thickness (px)" },
        { id: "borderRadius", type: "number", label: "Corner Radius Clipping (px)" },
        { id: "textColor", type: "color", label: "Paragraph General Font Color" },
        { id: "headingColor", type: "color", label: "Main Typography Header Color Node" }
      ]
    },
    column: {
      content: [
        { id: "width", type: "number", label: "Proportional Grid Width Share (%)" },
        { id: "verticalAlign", type: "select", label: "Internal Elements Flow Alignment", options: [{ value: "flex-start", label: "Top Alignment" }, { value: "center", label: "Center Content" }, { value: "flex-end", label: "Bottom Alignment" }] }
      ],
      style: [
        { id: "backgroundColor", type: "color", label: "Solid Background Color Fill Hex" },
        { id: "bgImage", type: "text", label: "Background Media Link URL" },
        { id: "overlayColor", type: "color", label: "Tint Overlay Screen Mask Color" },
        { id: "borderStyle", type: "select", label: "Border Frame Stroke Type", options: [{ value: "none", label: "None Default" }, { value: "solid", label: "Solid Line" }, { value: "dashed", label: "Dashed Line" }] },
        { id: "borderWidth", type: "number", label: "Stroke Frame Width (px)" },
        { id: "borderRadius", type: "number", label: "Corner Edge Frame Radius (px)" }
      ]
    }
  }
};