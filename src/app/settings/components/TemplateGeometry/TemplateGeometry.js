"use client";

import React, { useState } from "react";
import { 
  FiMaximize, FiLayers, FiCode, FiLink, 
  FiAlertCircle, FiInfo, FiHash 
} from "react-icons/fi";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import styles from "./TemplateGeometry.module.css";

export default function TemplateGeometry() {
  // Component layout state configuration
  const [defaultPageSize, setDefaultPageSize] = useState("A4");
  const [defaultOrientation, setDefaultOrientation] = useState("portrait");
  const [globalMargin, setGlobalMargin] = useState(24);
  const [nullStrategy, setNullStrategy] = useState("fallback");
  const [activeWebhookSource, setActiveWebhookSource] = useState("wh_kylas_lead_capture");

  // Webhook-specific dynamic token mapping values
  const [allWebhookMappings, setAllWebhookMappings] = useState({
    wh_kylas_lead_capture: {
      "customer.name": "payload.lead.primary_contact.full_name",
      "customer.email": "payload.lead.primary_contact.email_address",
      "customer.billing_address": "payload.lead.company_profile.registered_address",
      "summary.subtotal": "payload.financials.order_breakdown.gross_amount",
      "summary.final_payable": "payload.financials.settlement.net_payable_token"
    },
    wh_invoice_manual_trigger: {
      "customer.name": "body.customer_data.billing_name",
      "customer.email": "body.customer_data.delivery_email",
      "customer.billing_address": "body.customer_data.billing_destination",
      "summary.subtotal": "body.invoice_summary.gross_subtotal",
      "summary.final_payable": "body.invoice_summary.absolute_payable"
    }
  });

  const webhookProfileOptions = [
    { value: "wh_kylas_lead_capture", label: "Kylas CRM Lead Webhook Pipeline (META_LEAD)" },
    { value: "wh_invoice_manual_trigger", label: "Manual Invoice Generator API Dispatch Hook" }
  ];

  const nullStrategyOptions = [
    { value: "fallback", label: "Print Fallback String (e.g. N/A)" },
    { value: "drop_row", label: "Omit Undefined Elements Dynamically" },
    { value: "abort", label: "Halt Document Generation Pipeline" }
  ];

  const canvasOptions = [
    { value: "A4", label: "A4 Standard Printable Sheet (794px x 1123px)" },
    { value: "Letter", label: "US Letter Format Canvas Profile" }
  ];

  const handleUpdateMappingPath = (tokenKey, updatedPath) => {
    setAllWebhookMappings(prev => ({
      ...prev,
      [activeWebhookSource]: {
        ...prev[activeWebhookSource],
        [tokenKey]: updatedPath
      }
    }));
  };

  const activeMappings = allWebhookMappings[activeWebhookSource] || {};

  return (
    <div className={styles.settingsFormViewNode}>
      
      <div className={styles.sectionBrandingHeaderLine}>
        <h2>Template Blueprint & Variable Core</h2>
        <p className={styles.sectionSubtitleText}>
          Establish base canvas dimension layouts and structurally map inbound webhook JSON payloads directly to dynamic rendering tokens.
        </p>
      </div>
      <hr className={styles.sectionDivider} />

      <div className={styles.premiumDashboardFormGridCanvas}>
        
        {/* Layout Geometry Configuration */}
        <div className={styles.formSectionGridBlockCard}>
          <h3>Print Layout Geometry</h3>
          
          <div className={styles.canvasConfigRow}>
            <div className={`${styles.formInputGroupField} ${styles.canvasDropdownColumn}`}>
              <label className={styles.fieldLabel}>Inherent Canvas Profile Standard</label>
              <CustomDropdown 
                options={canvasOptions}
                selectedValue={defaultPageSize}
                onSelect={(val) => setDefaultPageSize(val)}
                icon={FiMaximize}
              />
            </div>

            <div className={`${styles.formInputGroupField} ${styles.paddingInputColumn}`}>
              <label className={styles.fieldLabel}>Bleed (px)</label>
              <div className={styles.inputIconWrapperFrame}>
                <FiHash className={styles.fieldInputIconAddon} />
                <input 
                  type="number" 
                  min="0"
                  max="200"
                  value={globalMargin} 
                  onChange={(e) => setGlobalMargin(Number(e.target.value))} 
                  className={styles.primaryTextInputWithIcon} 
                  placeholder="24"
                />
              </div>
            </div>
          </div>

          <div className={styles.formInputGroupField}>
            <label className={styles.fieldLabel}>Base Blueprint Sheet Orientation</label>
            <div className={styles.flexRadioSelectionContainerRow}>
              <label className={styles.radioElementOptionLabel}>
                <input 
                  type="radio" 
                  name="orientation" 
                  value="portrait" 
                  checked={defaultOrientation === "portrait"} 
                  onChange={() => setDefaultOrientation("portrait")} 
                />
                <span className={styles.radioCustomCircle} />
                <span className={styles.radioTextLabel}>Vertical Portrait Layout</span>
              </label>
              <label className={styles.radioElementOptionLabel}>
                <input 
                  type="radio" 
                  name="orientation" 
                  value="landscape" 
                  checked={defaultOrientation === "landscape"} 
                  onChange={() => setDefaultOrientation("landscape")} 
                />
                <span className={styles.radioCustomCircle} />
                <span className={styles.radioTextLabel}>Horizontal Landscape Layout</span>
              </label>
            </div>
          </div>
        </div>

        {/* Runtime Controls Configuration */}
        <div className={styles.formSectionGridBlockCard}>
          <h3>Data Fallback & Compilation Governance</h3>
          
          <div className={styles.formInputGroupField}>
            <label className={styles.fieldLabel}>Active Data Hydration Source Hook</label>
            <CustomDropdown 
              options={webhookProfileOptions}
              selectedValue={activeWebhookSource}
              onSelect={(val) => setActiveWebhookSource(val)}
              icon={FiLayers}
            />
          </div>

          <div className={styles.formInputGroupField}>
            <label className={styles.fieldLabel}>Null / Missing Path Extraction Strategy</label>
            <CustomDropdown 
              options={nullStrategyOptions}
              selectedValue={nullStrategy}
              onSelect={(val) => setNullStrategy(val)}
              icon={FiAlertCircle}
            />
          </div>

          <div className={styles.informationalNoticeAlertRow}>
            <FiInfo size={16} className={styles.noticeIcon} />
            <p>
              Modifying the source hook switch context above allows you to map isolated parameter fields for separate webhook streams independently.
            </p>
          </div>
        </div>

        {/* Variable Mapping Dynamic Matrix Grid */}
        <div className={`${styles.formSectionGridBlockCard} ${styles.fullWidthGridSpanCard}`}>
          <div className={styles.matrixHeadingRow}>
            <h3>Dynamic Webhook Payload Variable Matrix Mappings</h3>
            <span className={styles.activeHookBadge}>
              Configuring: {webhookProfileOptions.find(opt => opt.value === activeWebhookSource)?.label}
            </span>
          </div>
          <p className={styles.tableInstructionalBody}>
            Bind standard system interpolation parameters to specific inbound JSON dot-notation expressions parsed from execution webhooks.
          </p>

          <div className={styles.matrixContainerFrameWrapper}>
            <div className={styles.variableMappingStructuredGridHeader}>
              <span className={styles.headerColTokenKey}>Target Template Variable Token</span>
              <span className={styles.headerColDirectionIcon}></span>
              <span className={styles.headerColJsonExpressionPath}>Inbound Webhook Payload Source Expression Path</span>
            </div>

            <div className={styles.variableMappingRowsStackList}>
              {Object.entries(activeMappings).map(([tokenKey, expressionPath]) => (
                <div key={tokenKey} className={styles.variableMappingRecordInteractionRow}>
                  
                  <div className={styles.templateTokenIdentifierMetadataBlock}>
                    <FiCode size={14} className={styles.tokenTagDecorativeIcon} />
                    <span className={styles.tokenTextLiteralLabel}>{"{{"}{tokenKey}{"}}"}</span>
                  </div>

                  <div className={styles.connectorDirectionalIndicatorColumn}>
                    <FiLink size={13} className={styles.connectorLinkChainIcon} />
                  </div>

                  <div className={styles.jsonExpressionInputTrackingFlexWrapper}>
                    <input 
                      type="text" 
                      value={expressionPath} 
                      onChange={(e) => handleUpdateMappingPath(tokenKey, e.target.value)}
                      placeholder="e.g. root.property_name"
                      className={styles.monospaceJsonPathFieldInput}
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}