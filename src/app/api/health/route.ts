import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS base, 1 AS connexion"
    );
    return NextResponse.json({
      success: true,
      message: "Connexion MySQL réussie",
      data: rows,
    });
  } catch (error) {
    console.error("Erreur MySQL :", error);
    return NextResponse.json(
      {
        success: false,
        message: "Connexion MySQL impossible",
      },
      { status: 500 }
    );
  }
}
