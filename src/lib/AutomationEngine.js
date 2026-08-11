import { prisma } from "./prisma";
import Handlebars from "handlebars";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
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

    let context = { trigger: { payload: initialPayload } };
    
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
    
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id: node.templateId }
    });
    
    if (!template) throw new Error("Invoice template not found");

    const resolvedData = {};
    for (const [key, path] of Object.entries(node.mappings || {})) {
      resolvedData[key] = evaluateTemplate(path, context);
    }
    
    // Inject system settings into the root of the data so they can be accessed via {{settings.xxx}}
    const systemSettings = await prisma.systemSetting.findUnique({
      where: { id: "default" }
    });
    resolvedData.settings = systemSettings || {};

    await this.appendLog("Compiling template with Handlebars...", { data: resolvedData });
    const compiledTemplate = Handlebars.compile(template.config || "");
    const htmlOutput = compiledTemplate(resolvedData);

    // Generate PDF via Puppeteer
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlOutput);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Upload to Digital Ocean Spaces (S3 compatible)
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const region = process.env.DO_SPACES_REGION;
    const bucket = process.env.DO_SPACES_BUCKET;
    const accessKeyId = process.env.DO_SPACES_KEY;
    const secretAccessKey = process.env.DO_SPACES_SECRET;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error("Digital Ocean Spaces credentials are not fully configured in the environment.");
    }

    const s3Client = new S3Client({
      endpoint,
      region: region || "us-east-1", // DO spaces require a region string, even if dummy
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const invoiceId = resolvedData.invoiceId || `inv_${Date.now()}`;
    const fileName = `kylas-portal/invoices/${invoiceId}/${invoiceId}.pdf`;

    await this.appendLog("Uploading PDF to Digital Ocean Spaces...", { fileName });

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read"
    }));

    // Construct the public URL
    // DO Spaces format: https://[bucket].[region].digitaloceanspaces.com/[fileName]
    // If endpoint is https://nyc3.digitaloceanspaces.com, URL is https://[bucket].nyc3.digitaloceanspaces.com/[fileName]
    const endpointObj = new URL(endpoint);
    const publicUrl = `${endpointObj.protocol}//${bucket}.${endpointObj.host}/${fileName}`;

    await this.appendLog("Invoice generated and uploaded successfully", { url: publicUrl, templateName: template.name });

    return { url: publicUrl, generatedHtml: htmlOutput };
  }
}
