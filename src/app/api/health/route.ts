import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Diagnostic santé base de données échoué:", error);
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        message: "Service temporairement indisponible",
      },
      { status: 503 }
    );
  }
}
