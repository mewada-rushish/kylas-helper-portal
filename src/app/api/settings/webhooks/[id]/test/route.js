import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/settings/webhooks/[id]/test
export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { method, url, headers, queryParams, bodyPayload } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required for testing" }, { status: 400 });
    }

    // Prepare query params
    let finalUrl = url;
    if (queryParams && queryParams.length > 0) {
      try {
        const urlObj = new URL(url);
        queryParams.forEach(param => {
          if (param.key && param.value) {
            urlObj.searchParams.append(param.key, param.value);
          }
        });
        finalUrl = urlObj.toString();
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
      }
    }

    // Prepare headers and their masked equivalents for logging
    const fetchHeaders = new Headers();
    const logHeaders = {};
    if (headers && headers.length > 0) {
      headers.forEach(h => {
        if (h.key && h.value) {
          fetchHeaders.append(h.key, h.value);
          logHeaders[h.key] = h.isSecret ? "********" : h.value;
        }
      });
    }

    // Execute the request
    const startTime = Date.now();
    
    // Default timeout or load from DB if needed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchOptions = {
      method: method || "POST",
      headers: fetchHeaders,
      signal: controller.signal
    };
    
    if (method !== "GET" && method !== "HEAD" && bodyPayload) {
      fetchOptions.body = bodyPayload;
    }

    let logBody = null;
    if (fetchOptions.body) {
      try { logBody = JSON.parse(fetchOptions.body); } catch(e) { logBody = fetchOptions.body; }
      if (typeof logBody === 'object' && logBody !== null) {
        logBody = { ...logBody };
        ['password', 'token', 'secret', 'key', 'authorization'].forEach(k => {
          if (logBody[k]) logBody[k] = "********";
        });
      }
      if (typeof logBody === 'string' && logBody.length > 1000) {
        logBody = logBody.substring(0, 1000) + "... [TRUNCATED]";
      }
    }

    console.log("=== WEBHOOK TEST REQUEST ===");
    console.log("URL:", finalUrl);
    console.log("Method:", fetchOptions.method);
    console.log("Headers:", logHeaders);
    console.log("Body Payload:", logBody);
    console.log("============================");

    let response;
    try {
      response = await fetch(finalUrl, fetchOptions);
    } finally {
      clearTimeout(timeoutId);
    }
    const executionTimeMs = Date.now() - startTime;
    
    const status = response.status;
    let data = null;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
    }

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status,
      executionTimeMs,
      data,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("POST /api/settings/webhooks/[id]/test error:", error);
    return NextResponse.json({ 
      error: "Failed to execute webhook test", 
      details: error.message,
      status: 500
    }, { status: 500 });
  }
}
