import { HeaderElement } from "./header/header";
import { HeaderControls } from "./header/header_controls";
import { FooterElement } from "./footer/footer";
import { FooterControls } from "./footer/footer_controls";
import { TitleElement } from "./title/title";
import { TitleControls } from "./title/title_controls";

export const ELEMENT_REGISTRY = {
  [HeaderControls.type]: {
    component: HeaderElement,
    config: HeaderControls
  },
  [FooterControls.type]: {
    component: FooterElement,
    config: FooterControls
  },
  [TitleControls.type]: {
    component: TitleElement,
    config: TitleControls
  }
};

export const AVAILABLE_ASSETS = Object.values(ELEMENT_REGISTRY).map(entry => entry.config);