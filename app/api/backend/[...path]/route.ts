import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { getBackendUrl } from "../../../../lib/config";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

async function forward(
  request: Request,
  path: string[],
  search: string,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const method = request.method;
  const targetUrl = `${getBackendUrl()}/api/${path.join("/")}${search}`;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  if (METHODS_WITH_BODY.has(method)) {
    const text = await request.text();
    if (text) {
      init.body = text;
    }
  }

  const backendResponse = await fetch(targetUrl, init);
  const responseText = await backendResponse.text();

  return new NextResponse(responseText || null, {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const url = new URL(request.url);
  return forward(request, path, url.search);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const url = new URL(request.url);
  return forward(request, path, url.search);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const url = new URL(request.url);
  return forward(request, path, url.search);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const url = new URL(request.url);
  return forward(request, path, url.search);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const url = new URL(request.url);
  return forward(request, path, url.search);
}
