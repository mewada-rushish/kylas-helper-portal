import Handlebars from 'handlebars';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from './prisma';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';

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
  resolvedData.settings = systemSettings || {};

  const compiledTemplate = Handlebars.compile(template.config || "");
  let htmlOutput = compiledTemplate(resolvedData);

  // Inject base URL so relative URLs (like /uploads/logo.svg) load correctly in Puppeteer
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  if (htmlOutput.includes('<head>')) {
    htmlOutput = htmlOutput.replace('<head>', `<head><base href="${baseUrl}/">`);
  } else {
    htmlOutput = `<head><base href="${baseUrl}/"></head>` + htmlOutput;
  }

  // Generate PDF via Puppeteer
  let browser = null;
  let pdfBuffer = null;
  try {
    const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';
    let executablePath = null;
    const sparticuz = chromium.default || chromium;
    
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
      executablePath = await sparticuz.executablePath();
    }

    browser = await puppeteer.launch({
      args: isLocal ? [] : sparticuz.args,
      defaultViewport: sparticuz.defaultViewport,
      executablePath: executablePath || await sparticuz.executablePath(),
      headless: isLocal ? true : sparticuz.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlOutput, { waitUntil: 'networkidle0' });
    
    // Force the template root div to 100% width so it perfectly fits the Puppeteer margins
    await page.addStyleTag({ content: 'body { margin: 0 !important; padding: 0 !important; } body > div { width: 100% !important; max-width: 100% !important; margin: 0 !important; box-sizing: border-box !important; }' });
    
    pdfBuffer = await page.pdf({
      format: 'A4',
      scale: 0.96,
      printBackground: true,
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
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
