import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TicketDetails } from '@/components/tickets/ticket-details';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      train:trains(*),
      station_from:stations!tickets_station_from_id_fkey(*),
      station_to:stations!tickets_station_to_id_fkey(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!ticket) {
    notFound();
  }

  return <TicketDetails ticket={ticket} />;
}