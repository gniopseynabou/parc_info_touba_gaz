import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth";
import { ticketSyncBus, TicketUpdateEvent } from "@/lib/ticket-sync";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    // Récupérer l'identifiant employé réel
    let targetIdentifier = session.employe_id || session.id;

    // Vérifier l'employé en base
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM employes WHERE id = ? OR user_id = ? OR (LOWER(email) = LOWER(?) AND email IS NOT NULL AND email != '') LIMIT 1`,
      [targetIdentifier, targetIdentifier, session.email || ""]
    );

    if (empRows.length === 0) {
      return NextResponse.json({ success: false, message: "Employé introuvable." }, { status: 404 });
    }

    const realEmployeId = empRows[0].id;
    const { searchParams } = new URL(req.url);
    const wantsStream = searchParams.get("stream") === "true";

    // Mode 1 : Server-Sent Events (SSE) pour mise à jour instantanée sans polling
    if (wantsStream) {
      const encoder = new TextEncoder();
      let isClosed = false;
      let cleanup: (() => void) | null = null;

      const stream = new ReadableStream({
        start(controller) {
          // Message d'initialisation de connexion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "SYNC_CONNECTED",
                employeId: realEmployeId,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          // Écouteur d'événements filtré strictement pour cet employé
          const onTicketUpdated = (event: TicketUpdateEvent) => {
            if (isClosed) return;
            // Sécurité stricte : ne diffuser QUE les tickets appartenant à ce collaborateur
            if (event.demandeurId === realEmployeId || event.demandeurId === targetIdentifier) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "TICKET_UPDATED",
                      ticketId: event.ticketId,
                      demandeurId: event.demandeurId,
                      statut: event.statut,
                      numero: event.numero,
                      dateResolution: event.dateResolution,
                      dateCloture: event.dateCloture,
                      interventionActions: event.interventionActions,
                      interventionResultat: event.interventionResultat,
                      updatedAt: event.updatedAt,
                    })}\n\n`
                  )
                );
              } catch {
                isClosed = true;
              }
            }
          };

          ticketSyncBus.on("ticket_updated", onTicketUpdated);

          // Heartbeat toutes les 15 secondes pour maintenir la connexion active
          const heartbeatTimer = setInterval(() => {
            if (isClosed) {
              clearInterval(heartbeatTimer);
              return;
            }
            try {
              controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
            } catch {
              isClosed = true;
              clearInterval(heartbeatTimer);
            }
          }, 15000);

          cleanup = () => {
            isClosed = true;
            clearInterval(heartbeatTimer);
            ticketSyncBus.off("ticket_updated", onTicketUpdated);
          };
        },
        cancel() {
          if (cleanup) cleanup();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform, no-store",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Mode 2 : Vérification ultra-légère par horodatage (fallback de reconnexion / visibilité)
    const [tckStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COALESCE(UNIX_TIMESTAMP(MAX(updated_at)), 0) as last_version,
         COUNT(*) as total_tickets
       FROM tickets 
       WHERE demandeur_id = ?`,
      [realEmployeId]
    );

    const lastVersion = Number(tckStats[0]?.last_version || 0);
    const totalTickets = Number(tckStats[0]?.total_tickets || 0);

    return NextResponse.json({
      success: true,
      data: {
        employeId: realEmployeId,
        lastVersion,
        totalTickets,
      },
    });
  } catch (error) {
    console.error("Erreur API /api/employe/tickets/sync:", error);
    return NextResponse.json(
      { success: false, message: "Erreur synchronisation tickets." },
      { status: 500 }
    );
  }
}
