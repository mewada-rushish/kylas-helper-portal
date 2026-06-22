// src/components/elements/registry.js
import { LayoutContainerElement } from "./layout_container";
import { HeaderElement } from "./header";
import { TextBlockElement } from "./text_block";
import { ImageBlockElement } from "./image_block";
import { VideoBlockElement } from "./video_block";
import { PricingTableProElement } from "./pricing_table_pro";

export const ELEMENT_REGISTRY = {
  layout_container: LayoutContainerElement,
  header: HeaderElement,
  text_block: TextBlockElement,
  image_block: ImageBlockElement,
  video_block: VideoBlockElement,
  pricing_table_pro: PricingTableProElement
};

export const AVAILABLE_ASSETS = Object.values(ELEMENT_REGISTRY).map(entry => entry.config);