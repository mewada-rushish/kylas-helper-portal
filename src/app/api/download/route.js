import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download.pdf';

  if (!url) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote file: ${response.statusText}`);
    }
    
    const headers = new Headers(response.headers);
    // Force attachment so it triggers a clean download
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new Response(response.body, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Proxy download error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
