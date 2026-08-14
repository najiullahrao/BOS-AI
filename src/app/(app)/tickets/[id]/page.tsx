import { notFound } from "next/navigation";
import { TicketDetailClient } from "@/app/(app)/tickets/[id]/ticket-detail-client";
import { getCommentsForTicket, mockTickets } from "@/lib/mock-tickets";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = mockTickets.find((t) => t.id === id);
  if (!ticket) notFound();

  return <TicketDetailClient ticket={ticket} initialComments={getCommentsForTicket(ticket.id)} />;
}
