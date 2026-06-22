// src/components/elements/header/index.js
import { Header } from "./Header";
import { HeaderSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const HeaderElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <Header widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: HeaderSchema
};