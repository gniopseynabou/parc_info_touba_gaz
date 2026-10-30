import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Non authentifié." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session,
  });
}
