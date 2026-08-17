import { prisma } from "./prisma";
import { generateAndUploadInvoicePDF } from "./pdfGenerator";
/**
 * Resolves a variable path exactly against the context, returning the raw object/array.
 */
function resolveContextVariable(path, context) {
  if (!path) return undefined;
  
  let current = context;
  
  // If it's a payload shortcut, map it to trigger.payload
  if (path.startsWith("payload.")) {
    const keys = path.split('.');
    keys[0] = "payload";
    let triggerCtx = context.trigger || {};
    for (const key of keys) {
      if (triggerCtx === undefined || triggerCtx === null) return undefined;
      triggerCtx = triggerCtx[key];
    }
    return triggerCtx;
  }

  // If it's a step shortcut e.g. step_123.varName (legacy compatibility)
  if (path.startsWith("step_") && !path.includes(".")) {
    return current[path];
  }

  // Proper dotted path resolution for everything else (e.g. trigger.payload.entity.name or step_123.result)
  const keys = path.split('.');
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  
  return current;
}

/**
 * Evaluates a template string. Returns raw object if the template is EXACTLY a known variable path.
 */
function evaluateTemplate(template, context) {
  if (typeof template !== 'string') return template;
  
  // 1. Direct variable reference (e.g., "payload.products")
  const directMatch = resolveContextVariable(template, context);
  if (directMatch !== undefined) {
    return directMatch; 
  }

  // 2. String interpolation (e.g., "Hello {{payload.user.name}}")
  if (template.includes('{{')) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const val = resolveContextVariable(path, context);
      return val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : "";
    });
  }

  return template; // Raw string fallback
}

/**
 * Deeply evaluates all strings in an object/array.
 */
function deepEvaluate(obj, context) {
  if (typeof obj === 'string') return evaluateTemplate(obj, context);
  if (Array.isArray(obj)) return obj.map(item => deepEvaluate(item, context));
  if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = deepEvaluate(obj[key], context);
    }
    return newObj;
  }
  return obj;
}

export class AutomationEngine {
  constructor(workflowId) {
    this.workflowId = workflowId;
    this.workflow = null;
    this.executionLog = null;
    this.nodes = [];
    this.edges = [];
  }

  async init(triggerWebhookId = null, executionId = null) {
    this.workflow = await prisma.workflowRule.findUnique({
      where: { id: this.workflowId }
    });
    
    if (!this.workflow) throw new Error(`Workflow ${this.workflowId} not found`);

    let config;
    try {
      config = JSON.parse(this.workflow.config || "{}");
      this.nodes = config.nodes || [];
      this.edges = config.edges || [];
    } catch (e) {
      throw new Error("Invalid workflow configuration JSON");
    }

    if (executionId) {
      this.executionLog = await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: "RUNNING", triggerWebhookId }
      });
    } else {
      this.executionLog = await prisma.workflowExecution.create({
        data: {
          workflowId: this.workflowId,
          triggerWebhookId: triggerWebhookId,
          status: "RUNNING",
          context: "{}",
          logs: "[]"
        }
      });
    }
  }

  async appendLog(message, details = null) {
    const currentLogs = JSON.parse(this.executionLog.logs || "[]");
    currentLogs.push({
      timestamp: new Date().toISOString(),
      message,
      details
    });
    this.executionLog = await prisma.workflowExecution.update({
      where: { id: this.executionLog.id },
      data: { logs: JSON.stringify(currentLogs) }
    });
  }

  async fail(errorMessage) {
    await prisma.workflowExecution.update({
      where: { id: this.executionLog.id },
      data: {
        status: "FAILED",
        errorMessage
      }
    });
    await this.appendLog(`ERROR: ${errorMessage}`);
  }

  async run(initialPayload = {}) {
    if (!this.executionLog) throw new Error("Engine not initialized");

    const now = new Date();
    let context = { 
      trigger: { payload: initialPayload },
      sys: {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
      }
    };
    
    await prisma.workflowExecution.update({
      where: { id: this.executionLog.id },
      data: { context: JSON.stringify(context) }
    });
    await this.appendLog("Workflow started with payload", initialPayload);

    const triggerNode = this.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      await this.fail("No trigger node found in workflow");
      return;
    }

    let currentNodeId = triggerNode.id;
    const maxSteps = 50; // Prevent infinite loops
    let stepCount = 0;
    let finalStatus = "SUCCESS";

    while (currentNodeId && stepCount < maxSteps) {
      stepCount++;
      const node = this.nodes.find(n => n.id === currentNodeId);
      if (!node) {
        await this.appendLog(`Node ${currentNodeId} not found, ending traversal.`);
        break;
      }

      await this.appendLog(`Executing node: ${node.id} (${node.type})`);
      
      let nextNodeId = null;

      try {
        if (node.type === 'trigger') {
          // just pass through
        } else if (node.type === 'condition_router') {
          nextNodeId = await this.evaluateConditionNode(node, context);
        } else if (node.type === 'action') {
          const stepResult = await this.executeActionNode(node, context);
          
          if (node.outputVariableName) {
            context[`step_${node.id}`] = { [node.outputVariableName]: stepResult.result || stepResult.response };
          } else {
            context[`step_${node.id}`] = stepResult;
          }
        } else if (node.type === 'generate_invoice') {
          const stepResult = await this.executeGenerateInvoiceNode(node, context);
          context[`step_${node.id}`] = stepResult;
        }

        // Save updated context
        await prisma.workflowExecution.update({
          where: { id: this.executionLog.id },
          data: { context: JSON.stringify(context) }
        });
        
        // Find next node via edges if not a condition (which calculates it dynamically)
        if (node.type !== 'condition_router') {
          const outgoingEdges = this.edges.filter(e => e.fromPlug?.includes(node.id));
          if (outgoingEdges.length > 0) {
            nextNodeId = outgoingEdges[0].toPlug?.replace('target-', ''); // Simple linear fallback
          }
        }

        if (!nextNodeId) {
          await this.appendLog("No valid next node found. Ending execution path.");
          if (node.type === 'condition_router') {
            finalStatus = "COMPLETED_WITH_ERRORS";
          }
          break;
        }

        currentNodeId = nextNodeId;

      } catch (error) {
        await this.fail(`Node ${node.id} failed: ${error.message}`);
        return; // Abort on error
      }
    }

    if (stepCount >= maxSteps) {
      await this.fail("Maximum step limit reached (possible infinite loop).");
      return;
    }

    await prisma.workflowExecution.update({
      where: { id: this.executionLog.id },
      data: { status: finalStatus === "SUCCESS" ? "SUCCESS" : "FAILED" }
    });
    await this.appendLog(finalStatus === "SUCCESS" ? "Workflow completed successfully" : "Workflow completed with errors: condition not met.");
  }

  async evaluateConditionNode(node, context) {
    let nextNodeId = null;
    
    // Evaluate branches
    for (const branch of (node.branches || [])) {
      if (branch.isFallback) {
        // Only evaluate fallback if we haven't found a match
        if (!nextNodeId) {
           const outEdge = this.edges.find(e => e.fromPlug?.includes(node.id) && e.fromPlug?.includes(branch.branchId));
           if (outEdge) nextNodeId = outEdge.toPlug?.replace('target-', '');
        }
        continue;
      }

      let isMatch = true;
      const operator = branch.conditions?.operator || 'AND';
      
      for (const rule of (branch.conditions?.rules || [])) {
        const leftValue = evaluateTemplate(rule.field, context);
        const rightValue = rule.value;
        let ruleMatch = false;

        await this.appendLog(`Evaluating rule (v2): ${rule.field} ${rule.operator} ${rule.value}`, {
          leftValue,
          rightValue,
          leftType: typeof leftValue,
          rightType: typeof rightValue
        });

        switch (rule.operator) {
          case '==': 
          case 'equals': 
            ruleMatch = String(leftValue).trim() === String(rightValue).trim(); break;
          case '!=': 
          case 'not_equals':
            ruleMatch = String(leftValue).trim() !== String(rightValue).trim(); break;
          case 'includes': 
          case 'contains':
            ruleMatch = String(leftValue).trim().includes(String(rightValue).trim()); break;
          case '>': 
          case 'greater_than':
            ruleMatch = Number(leftValue) > Number(rightValue); break;
          case '<': 
          case 'less_than':
            ruleMatch = Number(leftValue) < Number(rightValue); break;
          default: ruleMatch = false;
        }

        if (operator === 'AND') {
          isMatch = isMatch && ruleMatch;
          if (!isMatch) break;
        } else if (operator === 'OR') {
          isMatch = isMatch || ruleMatch;
        }
      }

      if (isMatch) {
        const outEdge = this.edges.find(e => e.fromPlug?.includes(node.id) && e.fromPlug?.includes(branch.branchId));
        if (outEdge) {
          nextNodeId = outEdge.toPlug?.replace('target-', '');
          await this.appendLog(`Condition branch ${branch.branchId} matched.`);
          break;
        }
      }
    }

    return nextNodeId;
  }

  async executeActionNode(node, context) {
    const actionType = node.actionType;
    
    // Build parameters from overrides (for legacy/other actions)
    const params = {};
    for (const override of (node.payloadOverrides || [])) {
      params[override.key] = evaluateTemplate(override.value, context);
    }

    if (actionType === 'api_call') {
      let finalUrl = "";
      let method = "GET";
      let headersObj = {};
      let bodyStr = null;

      if (node.externalApiId) {
        // New Mode: Outgoing API from Database
        const apiConfig = await prisma.webhook.findUnique({
          where: { id: node.externalApiId }
        });
        if (!apiConfig) throw new Error("Outgoing API configuration not found");

        method = apiConfig.method || "GET";
        let rawUrl = apiConfig.url || "";
        let rawHeaders = apiConfig.headers || "";
        let rawBody = apiConfig.bodyPayload || "";

        for (const [token, mappedPath] of Object.entries(node.mappings || {})) {
          const resolvedValue = evaluateTemplate(mappedPath, context);
          const valueStr = resolvedValue !== undefined ? (typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : String(resolvedValue)) : "";
          
          const regex = new RegExp(`\\{\\{\\s*(?:#each\\s+|#with\\s+)?${token.replace(/\./g, '\\.')}\\s*\\}\\}`, 'g');
          rawUrl = rawUrl.replace(regex, valueStr);
          rawHeaders = rawHeaders.replace(regex, valueStr);
          rawBody = rawBody.replace(regex, valueStr);
        }

        finalUrl = rawUrl;
        try { headersObj = rawHeaders ? JSON.parse(rawHeaders) : {}; } catch(e){}
        bodyStr = rawBody ? rawBody : null;

      } else {
        // Custom Mode (UI-defined API Call)
        finalUrl = evaluateTemplate(node.apiUrl || params.url, context);
        method = node.apiMethod || params.method || "GET";
        
        let rawHeaders = node.apiHeaders || params.headers;
        if (rawHeaders) {
          if (Array.isArray(rawHeaders)) {
            // UI passes [{key: '...', value: '...'}]
            headersObj = {};
            for (const h of rawHeaders) {
              if (h.key) {
                headersObj[h.key] = evaluateTemplate(h.value, context);
              }
            }
          } else {
            rawHeaders = evaluateTemplate(rawHeaders, context);
            try { headersObj = typeof rawHeaders === 'string' ? JSON.parse(rawHeaders) : rawHeaders; } catch(e){}
          }
        }

        let rawBody = node.apiBody || params.body;
        if (rawBody) {
          rawBody = evaluateTemplate(rawBody, context);
          try { bodyStr = typeof rawBody === 'object' ? JSON.stringify(rawBody) : rawBody; } catch(e){}
        }
      }

      const fetchOptions = { method, headers: headersObj };
      if (bodyStr && method !== "GET" && method !== "HEAD") {
        fetchOptions.body = bodyStr;
      }

      await this.appendLog(`Calling API: ${method} ${finalUrl}`);
      const response = await fetch(finalUrl, fetchOptions);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
      }
      return { status: response.status, response: data };

    } else if (actionType === 'transform_concat') {
      const separator = params.separator || "";
      return { result: `${params.varA || ""}${separator}${params.varB || ""}` };
    } else if (actionType === 'transform_trim') {
      return { result: String(params.input || "").trim() };
    } else if (actionType === 'transform_filter') {
      const arr = params.inputArray;
      if (!Array.isArray(arr)) throw new Error("Input is not an array");
      const filtered = arr.filter(item => {
        if (!item || typeof item !== 'object') return false;
        return String(item[params.filterKey]) === String(params.filterValue);
      });
      return { result: filtered };
    } else {
      throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  async executeGenerateInvoiceNode(node, context) {
    if (!node.templateId) throw new Error("No template selected for generate_invoice");
    
    const resolvedData = {};
    for (const [key, path] of Object.entries(node.mappings || {})) {
      const value = evaluateTemplate(path, context);
      const parts = key.split('.');
      let current = resolvedData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    }
    
    const invoiceId = resolvedData.invoiceId || `inv_${Date.now()}`;
    resolvedData.invoiceId = invoiceId;

    // Helper to safely parse stringified JSON objects/arrays (from evaluateTemplate interpolation)
    const safelyParseValue = (val) => {
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { return JSON.parse(val); } catch (e) { return val; }
      }
      return val;
    };

    let totalAmountVal = safelyParseValue(resolvedData.rate || resolvedData.total_amount || resolvedData.invoice?.subtotal);
    if (typeof totalAmountVal === 'object' && totalAmountVal !== null) {
      totalAmountVal = totalAmountVal.value || totalAmountVal.amount || 0;
    }
    const rawRate = parseFloat(totalAmountVal || 45000);

    const qty = parseFloat(resolvedData.qty || 1);
    const total = rawRate * qty;

    let productVal = safelyParseValue(resolvedData.payment_for || resolvedData.product?.name);
    let productName = "Standard Service";
    if (Array.isArray(productVal) && productVal.length > 0) {
      productName = productVal[0].name || productVal[0].title || "Standard Service";
    } else if (typeof productVal === 'object' && productVal !== null) {
      productName = productVal.name || productVal.title || "Standard Service";
    } else if (typeof productVal === 'string' && productVal.trim() !== "") {
      productName = productVal;
    }

    const numberToWords = (num) => {
      const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
      const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
      if ((num = num.toString()).length > 9) return 'overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return ''; let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str.trim() ? str.trim() + ' Only' : '';
    };

    let periodStart = resolvedData.payment?.periodStart || resolvedData.periodStart || "";
    let periodEnd = resolvedData.payment?.periodEnd || resolvedData.periodEnd || "";
    
    // Clean up literal "null" strings resulting from template interpolation
    if (periodStart === "null") periodStart = "";
    if (periodEnd === "null") periodEnd = "";
    
    // Format periodStart to remove time if it's an ISO string
    if (periodStart && periodStart.includes('T')) {
      periodStart = periodStart.split('T')[0];
    }

    if (periodStart && !periodEnd) {
      const pName = productName.toLowerCase();
      let monthsToAdd = 1;
      
      if (pName.includes("half yearly") || pName.includes("half year") || pName.includes("half - yearly") || pName.includes("half-yearly")) {
        monthsToAdd = 6;
      } else if (pName.includes("quarterly") || pName.includes("quaterly")) {
        monthsToAdd = 3;
      } else if (pName.includes("yearly") || pName.includes("annual")) {
        monthsToAdd = 12;
      }
      
      const startDateObj = new Date(periodStart);
      if (!isNaN(startDateObj.getTime())) {
        // Handle last day of month edge cases correctly
        startDateObj.setMonth(startDateObj.getMonth() + monthsToAdd);
        // We might want to subtract 1 day since period is usually inclusive? 
        // e.g. 1st Jan to 31st Dec. Let's subtract 1 day.
        startDateObj.setDate(startDateObj.getDate() - 1);
        periodEnd = startDateObj.toISOString().split('T')[0];
      }
    }
    
    // Clean up payment date literal "null"
    let pDate = resolvedData.payment?.date || resolvedData.date;
    if (pDate === "null" || !pDate) {
      pDate = new Date().toISOString().split('T')[0];
    } else if (pDate.includes('T')) {
      pDate = pDate.split('T')[0];
    }



    const normalizedData = {
      ...resolvedData,
      invoice: {
        ...resolvedData.invoice,
        id: invoiceId,
        total: `₹${total.toLocaleString("en-IN")}`
      },
      customer: {
        ...resolvedData.customer,
        name: resolvedData.customer?.name || resolvedData.name || resolvedData.customerName || "Unknown",
        email: resolvedData.customer?.email || resolvedData.email || "",
        phone: resolvedData.customer?.phone || resolvedData.phone || ""
      },
      current: {
        ...resolvedData.current,
        date: resolvedData.current?.date || resolvedData.date || new Date().toISOString().split('T')[0]
      },
      product: {
        ...resolvedData.product,
        name: productName,
        rate: `₹${rawRate.toLocaleString("en-IN")}`,
        qty
      },
      amount: {
        ...resolvedData.amount,
        words: resolvedData.amount?.words || resolvedData.amount_words || numberToWords(Math.round(total))
      },
      payment: {
        ...resolvedData.payment,
        method: resolvedData.payment?.method || "Cash",
        date: pDate,
        periodStart: periodStart,
        periodEnd: periodEnd
      },
      memberId: resolvedData.memberId || ""
    };

    await this.appendLog("Generating PDF using Puppeteer...", { invoiceId });

    const { publicUrl, htmlOutput } = await generateAndUploadInvoicePDF(invoiceId, normalizedData, node.templateId);

    // Robust date parser for potentially formatted dates (DD/MM/YYYY)
    const parseDateString = (dStr) => {
      if (!dStr) return new Date();
      let d = new Date(dStr);
      if (!isNaN(d.getTime())) return d;
      
      const parts = String(dStr).split(/[\/\-]/);
      if (parts.length === 3 && parts[2].length === 4) {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    };

    // Save to the database
    try {
      await prisma.invoice.create({
        data: {
          id: invoiceId,
          customer: normalizedData.customer.name,
          email: normalizedData.customer.email,
          date: parseDateString(normalizedData.current.date),
          productId: normalizedData.product.name,
          qty: qty,
          rate: rawRate,
          total: total,
          memberId: normalizedData.memberId,
          amountWords: normalizedData.amount.words,
          paymentMethod: normalizedData.payment.method,
          paymentReferenceNo: normalizedData.payment.referenceNo || "",
          paymentBankName: normalizedData.payment.bankName || "",
          paymentDate: normalizedData.payment.date || "",
          periodStart: normalizedData.payment.periodStart || "",
          periodEnd: normalizedData.payment.periodEnd || "",
          pdfUrl: publicUrl
        }
      });
      await this.appendLog("Invoice saved to database", { invoiceId });
    } catch (dbErr) {
      console.error("Failed to save invoice to DB:", dbErr);
      await this.appendLog("Warning: Failed to save invoice to DB", { error: dbErr.message });
    }

    await this.appendLog("Invoice generated and uploaded successfully", { url: publicUrl });

    return { url: publicUrl, generatedHtml: htmlOutput };
  }
}
