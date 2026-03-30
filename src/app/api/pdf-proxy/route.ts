import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for backend access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bucket = req.nextUrl.searchParams.get("bucket");
  const path = req.nextUrl.searchParams.get("path");
  if (!bucket || !path) {
    return new NextResponse("Missing bucket or path", { status: 400 });
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return new NextResponse("Failed to fetch PDF", { status: 404 });
  }

  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(Buffer.from(arrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${encodeURIComponent(path.split("/").pop() || "archivo.pdf")}`,
    },
  });
}
