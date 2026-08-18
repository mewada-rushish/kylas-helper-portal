import Handlebars from 'handlebars';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from './prisma';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

export async function generateAndUploadInvoicePDF(invoiceId, resolvedData, templateId) {
  // Find template
  let template;
  if (templateId) {
    template = await prisma.invoiceTemplate.findUnique({ where: { id: templateId } });
  } else {
    template = await prisma.invoiceTemplate.findFirst({ where: { isDefault: true } });
  }
  
  if (!template) {
    throw new Error("No invoice template found");
  }

  // Inject system settings
  const systemSettings = await prisma.systemSetting.findUnique({
    where: { id: "default" }
  });

  const getBase64Image = async (urlStr) => {
    if (!urlStr) return urlStr;
    try {
      if (urlStr.startsWith('/')) {
        const filePath = path.join(process.cwd(), 'public', urlStr);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).replace('.', '');
          let mime = `image/${ext}`;
          if (ext === 'svg') mime = 'image/svg+xml';
          if (ext === 'jpg') mime = 'image/jpeg';
          const base64 = fs.readFileSync(filePath).toString('base64');
          return `data:${mime};base64,${base64}`;
        }
        
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}${urlStr}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mime = res.headers.get('content-type') || 'image/png';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      } else if (urlStr.startsWith('http')) {
        const res = await fetch(urlStr);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mime = res.headers.get('content-type') || 'image/png';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.error("Failed to convert image to base64:", e);
    }
    return urlStr;
  };

  if (systemSettings) {
    if (systemSettings.logoUrl) {
      systemSettings.logoUrl = await getBase64Image(systemSettings.logoUrl);
    }
    if (systemSettings.signatureUrl) {
      systemSettings.signatureUrl = await getBase64Image(systemSettings.signatureUrl);
    }
  }

  resolvedData.settings = systemSettings || {};

  const dateFormat = systemSettings?.dateFormat || "YYYY-MM-DD";
  const formatWithSetting = (dateStr) => {
    if (!dateStr) return "";
    let dStr = dateStr;
    if (dStr.includes('T')) dStr = dStr.split('T')[0];
    const parts = dStr.split('-');
    if (parts.length === 3) {
      if (dateFormat === "DD/MM/YYYY") return `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (dateFormat === "DD-MM-YYYY") return `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (dateFormat === "MM/DD/YYYY") return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateStr;
  };

  if (resolvedData.current?.date) resolvedData.current.date = formatWithSetting(resolvedData.current.date);
  if (resolvedData.payment?.date) resolvedData.payment.date = formatWithSetting(resolvedData.payment.date);
  if (resolvedData.payment?.periodStart) resolvedData.payment.periodStart = formatWithSetting(resolvedData.payment.periodStart);
  if (resolvedData.payment?.periodEnd) resolvedData.payment.periodEnd = formatWithSetting(resolvedData.payment.periodEnd);

  const compiledTemplate = Handlebars.compile(template.config || "");
  let htmlOutput = compiledTemplate(resolvedData);

  // Inject base URL so relative URLs (like /uploads/logo.svg) load correctly in Puppeteer
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const fontsTag = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box !important; font-family: 'Inter', sans-serif !important; }
      body { margin: 0 !important; padding: 0 !important; font-family: 'Inter', sans-serif !important; }
      body > div { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
    </style>
  `;
  if (htmlOutput.includes('<head>')) {
    htmlOutput = htmlOutput.replace('<head>', `<head><base href="${baseUrl}/">${fontsTag}`);
  } else {
    htmlOutput = `<head><base href="${baseUrl}/">${fontsTag}</head>` + htmlOutput;
  }

  // Generate PDF via Puppeteer
  let browser = null;
  let pdfBuffer = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';
    let executablePath = null;
    let sparticuz = null;
    let puppeteer = null;
    
    // Opaque strings to completely hide from Turbopack and prevent chunk generation
    const pCorePkg = "puppeteer-core";
    const sCorePkg = "@sparticuz/chromium";
    const requireNode = createRequire(import.meta.url);

    // Load puppeteer-core natively without Turbopack chunking
    const pModule = requireNode(pCorePkg);
    puppeteer = pModule.default || pModule;
    
    if (isLocal) {
      const winPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
      ];
      for (const p of winPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    } else {
      // Create a local .tmp directory in the project root to bypass /tmp noexec constraints
      const customTmpDir = process.cwd() + '/.tmp';
      if (!fs.existsSync(customTmpDir)) {
        fs.mkdirSync(customTmpDir, { recursive: true });
      }
      // Force os.tmpdir() to use our local .tmp directory instead of /tmp
      process.env.TMPDIR = customTmpDir;
      process.env.TMP = customTmpDir;
      process.env.TEMP = customTmpDir;

      const chromiumModule = requireNode(sCorePkg);
      sparticuz = chromiumModule.default || chromiumModule;
      executablePath = await sparticuz.executablePath();
    }

    browser = await puppeteer.launch({
      args: isLocal ? [] : sparticuz.args,
      defaultViewport: isLocal ? null : sparticuz.defaultViewport,
      executablePath: executablePath || (sparticuz ? await sparticuz.executablePath() : null),
      headless: isLocal ? true : sparticuz.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlOutput, { waitUntil: 'networkidle0' });
    
    // Ensure all remote web fonts are fully loaded before rendering
    await page.evaluateHandle('document.fonts.ready');
    
    const pageFormat = systemSettings?.templatePageSize || 'A4';
    const isLandscape = systemSettings?.templateOrientation === 'landscape';
    const marginSize = systemSettings?.templateMargin !== undefined ? systemSettings.templateMargin : 30;

    pdfBuffer = await page.pdf({
      format: pageFormat,
      scale: 0.95,
      printBackground: true,
      landscape: isLandscape,
      margin: { 
        top: `${marginSize}px`, 
        bottom: `${marginSize}px`, 
        left: `${marginSize}px`, 
        right: `${marginSize}px` 
      }
    });
  } catch (error) {
    console.error("Puppeteer PDF generation failed:", error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION;
  const bucket = process.env.DO_SPACES_BUCKET;
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Digital Ocean Spaces credentials are not fully configured in the environment.");
  }

  let cleanEndpoint = endpoint;
  if (cleanEndpoint.includes(`${bucket}.`)) {
    cleanEndpoint = cleanEndpoint.replace(`${bucket}.`, "");
  }

  const s3Client = new S3Client({
    endpoint: cleanEndpoint,
    region: region || "us-east-1",
    forcePathStyle: false,
    credentials: { accessKeyId, secretAccessKey }
  });

  const fileName = `kylas-portal/invoices/${invoiceId}/${invoiceId}.pdf`;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: pdfBuffer,
    ContentType: "application/pdf",
    ACL: "public-read"
  }));

  const endpointObj = new URL(cleanEndpoint);
  const publicUrl = `${endpointObj.protocol}//${bucket}.${endpointObj.host}/${fileName}`;

  return { publicUrl, htmlOutput };
}
