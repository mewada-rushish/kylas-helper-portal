import Handlebars from 'handlebars';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from './prisma';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
  const htmlOutput = compiledTemplate(resolvedData);

  // Generate PDF via Puppeteer
  let browser = null;
  let pdfBuffer = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlOutput, { waitUntil: 'networkidle0' });
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px' }
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
