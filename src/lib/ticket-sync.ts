import { EventEmitter } from "events";

export interface TicketUpdateEvent {
  ticketId: string;
  demandeurId: string;
  statut: string;
  numero?: number;
  dateResolution?: string | null;
  dateCloture?: string | null;
  interventionActions?: string | null;
  interventionResultat?: string | null;
  updatedAt: string;
}

class TicketSyncBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  notifyTicketUpdated(event: TicketUpdateEvent) {
    this.emit("ticket_updated", event);
  }
}

// Singleton global pour conserver l'état du bus d'événements à travers les requêtes Next.js
const globalBus = global as unknown as { __toubaGazTicketSyncBus?: TicketSyncBus };
export const ticketSyncBus = globalBus.__toubaGazTicketSyncBus || new TicketSyncBus();
if (process.env.NODE_ENV !== "production") {
  globalBus.__toubaGazTicketSyncBus = ticketSyncBus;
}
