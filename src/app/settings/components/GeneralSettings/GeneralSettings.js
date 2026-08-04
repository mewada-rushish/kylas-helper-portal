"use client";

import React, { useState, useEffect } from "react";
import {
  FiDollarSign, FiCalendar, FiUpload, FiBriefcase, FiMapPin,
  FiUser, FiImage, FiHash, FiSliders, FiPercent, FiCreditCard,
  FiRefreshCw, FiClock, FiMail, FiCheck
} from "react-icons/fi";
import toast from "react-hot-toast";
import CustomDropdown from "@/components/ui/dropdown/dropdown";
import SkeletonLoader from "@/components/ui/skeleton/skeleton";
import AdminButton from "@/components/ui/button/button";
import styles from "./GeneralSettings.module.css";

export default function GeneralSettings() {
  // Loading and Action States
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Component state definitions
  const [logoPreview, setLogoPreview] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [authorizedSignatory, setAuthorizedSignatory] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [invoicePrefixBase, setInvoicePrefixBase] = useState("");
  const [paddingDigits, setPaddingDigits] = useState("4");
  const [nextSequence, setNextSequence] = useState(1001);

  const [gstin, setGstin] = useState("");
  const [panCode, setPanCode] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  const [globalCurrency, setGlobalCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");

  const [retryLimit, setRetryLimit] = useState("3");
  const [timeoutBound, setTimeoutBound] = useState("");
  const [alertEmail, setAlertEmail] = useState("");

  const currentSystemYear = new Date().getFullYear();

  // Dropdown options contracts
  const currencyOptions = [
    { value: "INR", label: "INR - Indian Rupee (₹)" },
    { value: "USD", label: "USD - United States Dollar ($)" }
  ];

  const dateFormatOptions = [
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" }
  ];

  const paddingOptions = [
    { value: "2", label: "2 Digits (e.g. 01)" },
    { value: "4", label: "4 Digits (e.g. 0001)" },
    { value: "6", label: "6 Digits (e.g. 000001)" }
  ];

  const retryOptions = [
    { value: "1", label: "1 Absolute Attempt" },
    { value: "3", label: "3 Pipeline Retries" },
    { value: "5", label: "5 Max Retries Fault Tolerant" }
  ];

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      setIsFetching(true);
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();

        setCompanyName(data.companyName || "");
        setAuthorizedSignatory(data.authorizedSignatory || "");
        setCompanyAddress(data.companyAddress || "");
        setInvoicePrefixBase(data.invoicePrefixBase || "INV");
        setPaddingDigits(data.paddingDigits || "4");
        setNextSequence(data.nextSequence !== undefined ? data.nextSequence : 1001);
        setGstin(data.gstin || "");
        setPanCode(data.panCode || "");
        setBankDetails(data.bankDetails || "");
        setGlobalCurrency(data.globalCurrency || "INR");
        setDateFormat(data.dateFormat || "YYYY-MM-DD");
        setRetryLimit(data.retryLimit || "3");
        setTimeoutBound(data.timeoutBound || "5000");
        setAlertEmail(data.alertEmail || "");
        setLogoPreview(data.logoUrl || null);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsFetching(false);
      }
    }
    fetchSettings();
  }, []);

  // File upload handling
  const handleLogoFileIntercept = (e) => {
    const assetFile = e.target.files[0];
    if (assetFile) {
      if (assetFile.size > 2 * 1024 * 1024) {
        toast.error("File size must not exceed 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result); // Base64 encoded string
      };
      reader.readAsDataURL(assetFile);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          authorizedSignatory,
          companyAddress,
          invoicePrefixBase,
          paddingDigits,
          nextSequence,
          globalCurrency,
          dateFormat,
          gstin,
          panCode,
          bankDetails,
          retryLimit,
          timeoutBound,
          alertEmail,
          logoUrl: logoPreview
        })
      });

      if (!res.ok) throw new Error("Failed to update general settings");
      toast.success("General settings saved successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.settingsFormViewNode}>
      <div className={styles.sectionBrandingHeaderLine}>
        <h2>General Configurations</h2>
        <p className={styles.sectionSubtitleText}>
          Configure global invoice branding profiles, numbering localizations, corporate compliance metrics, and workflow pipeline thresholds.
        </p>
      </div>
      <hr className={styles.sectionDivider} />

      {isFetching ? (
        <div className={styles.premiumDashboardFormGridCanvas}>
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      ) : (
        <>
          <div className={styles.premiumDashboardFormGridCanvas}>

            {/* Corporate Profile Card */}
            <div className={styles.formSectionGridBlockCard}>
              <h3>Corporate Identity & Branding</h3>

              <div className={styles.formInputGroupField}>
                <label className={styles.fieldLabel}>Company Workspace Logo</label>
                <div className={styles.logoFlexUploadContainer}>
                  <div className={styles.logoFramePreviewBox}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className={styles.renderedLogoImage} />
                    ) : (
                      <FiImage size={22} className={styles.fallbackLogoPlaceholderIcon} />
                    )}
                  </div>
                  <div className={styles.uploadActionWrapperInteractiveArea}>
                    <label className={styles.fileUploadCustomTriggerBtn}>
                      <FiUpload size={13} />
                      <span>Upload Asset Logo</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoFileIntercept}
                        className={styles.hiddenNativeFileInput}
                      />
                    </label>
                    <p className={styles.uploadGuidelinesSubtext}>Supports PNG, JPEG, SVG up to 2MB.</p>
                  </div>
                </div>
              </div>

              <div className={styles.formFieldsInlineDoubleGridRow}>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Company Legal Name</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiBriefcase className={styles.fieldInputIconAddon} />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Authorized Signatory Full Name</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiUser className={styles.fieldInputIconAddon} />
                    <input
                      type="text"
                      value={authorizedSignatory}
                      onChange={(e) => setAuthorizedSignatory(e.target.value)}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formInputGroupField}>
                <label className={styles.fieldLabel}>Registered Corporate Address</label>
                <div className={styles.inputIconWrapperFrame}>
                  <FiMapPin className={styles.fieldInputIconAddon} style={{ top: "13px" }} />
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className={styles.primaryTextareaInputWithIcon}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Numbering Card */}
            <div className={styles.formSectionGridBlockCard}>
              <h3>Invoice Serialization & Primitives</h3>

              <div className={styles.formFieldsInlineDoubleGridRow}>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Invoice Sequence Base Prefix</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiSliders className={styles.fieldInputIconAddon} />
                    <input
                      type="text"
                      value={invoicePrefixBase}
                      onChange={(e) => setInvoicePrefixBase(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                      className={styles.primaryTextInputWithIcon}
                      placeholder="e.g. INV"
                    />
                  </div>
                  <p className={styles.prefixPreviewLegend}>
                    Resolved Pattern: <code className={styles.previewCodeBadge}>{invoicePrefixBase}/{currentSystemYear}/[SEQUENCE]</code>
                  </p>
                </div>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Next Sequence Start Counter</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiHash className={styles.fieldInputIconAddon} />
                    <input
                      type="number"
                      value={nextSequence}
                      onChange={(e) => setNextSequence(Number(e.target.value))}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formInputGroupField}>
                <label className={styles.fieldLabel}>Sequence Digit Auto-Padding</label>
                <CustomDropdown
                  options={paddingOptions}
                  selectedValue={paddingDigits}
                  onSelect={(val) => setPaddingDigits(val)}
                  icon={FiHash}
                />
              </div>

              <div className={styles.formFieldsInlineDoubleGridRow}>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Default Accounting Currency</label>
                  <CustomDropdown
                    options={currencyOptions}
                    selectedValue={globalCurrency}
                    onSelect={(val) => setGlobalCurrency(val)}
                    icon={FiDollarSign}
                  />
                </div>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>System Presentation Date Format</label>
                  <CustomDropdown
                    options={dateFormatOptions}
                    selectedValue={dateFormat}
                    onSelect={(val) => setDateFormat(val)}
                    icon={FiCalendar}
                  />
                </div>
              </div>
            </div>

            {/* Tax Compliance Card */}
            <div className={styles.formSectionGridBlockCard}>
              <h3>Tax Compliance & Settlement Hooks</h3>

              <div className={styles.formFieldsInlineDoubleGridRow}>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Official GSTIN Identifier</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiPercent className={styles.fieldInputIconAddon} />
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Corporate Identity PAN</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiBriefcase className={styles.fieldInputIconAddon} />
                    <input
                      type="text"
                      value={panCode}
                      onChange={(e) => setPanCode(e.target.value)}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formInputGroupField}>
                <label className={styles.fieldLabel}>Default Bank Wire Transfer Terms Boilerplate</label>
                <div className={styles.inputIconWrapperFrame}>
                  <FiCreditCard className={styles.fieldInputIconAddon} style={{ top: "13px" }} />
                  <textarea
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className={styles.primaryTextareaInputWithIcon}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Runtime Engine Configuration Card */}
            <div className={styles.formSectionGridBlockCard}>
              <h3>Workflow Engine Runtime Boundaries</h3>

              <div className={styles.formFieldsInlineDoubleGridRow}>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Automation Retry Limits Strategy</label>
                  <CustomDropdown
                    options={retryOptions}
                    selectedValue={retryLimit}
                    onSelect={(val) => setRetryLimit(val)}
                    icon={FiRefreshCw}
                  />
                </div>
                <div className={styles.formInputGroupField}>
                  <label className={styles.fieldLabel}>Thread Execution Timeout Limit (ms)</label>
                  <div className={styles.inputIconWrapperFrame}>
                    <FiClock className={styles.fieldInputIconAddon} />
                    <input
                      type="number"
                      value={timeoutBound}
                      onChange={(e) => setTimeoutBound(e.target.value)}
                      className={styles.primaryTextInputWithIcon}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formInputGroupField}>
                <label className={styles.fieldLabel}>Pipeline Failure Log Notification Target</label>
                <div className={styles.inputIconWrapperFrame}>
                  <FiMail className={styles.fieldInputIconAddon} />
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className={styles.primaryTextInputWithIcon}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Core Updates Submission Rail */}
          <div className={styles.saveSectionPanel}>
            <AdminButton
              variant="primary"
              icon={FiCheck}
              loading={isSaving}
              loadingLabel="Saving..."
              onClick={handleSaveSettings}
            >
              Save Configurations
            </AdminButton>
          </div>
        </>
      )}
    </div>
  );
}