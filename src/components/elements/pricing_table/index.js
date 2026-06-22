// src/components/elements/pricing_table/index.js
import { PricingTable } from "./PricingTable";
import { PricingTableSchema } from "./schema";
import { BaseStyleWrapper } from "../BaseStyleWrapper";

export const PricingTableElement = {
  component: ({ widget, context }) => (
    <BaseStyleWrapper widget={widget}>
      <PricingTable widget={widget} context={context} />
    </BaseStyleWrapper>
  ),
  config: PricingTableSchema
};