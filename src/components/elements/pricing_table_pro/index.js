// src/components/elements/pricing_table_pro/index.js
import { PricingTablePro } from "./PricingTablePro";
import { PricingTableProSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const PricingTableProElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <PricingTablePro widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: PricingTableProSchema
};