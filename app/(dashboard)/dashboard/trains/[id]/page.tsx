import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrainDetails } from '@/components/trains/train-details';
import { BuyTicketForm } from '@/components/tickets/buy-ticket-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DashboardTrainDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ date?: string }>;
}

export default async function DashboardTrainDetailPage({ params, searchParams }: DashboardTrainDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const date = resolvedSearchParams.date || '';
  const supabase = await createClient();

  const { data: train } = await supabase
    .from('trains')
    .select('*')
    .eq('id', id)
    .single();

  if (!train) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/trains"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к поиску
      </Link>

      <TrainDetails train={train} />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Купить билет</h3>
        <BuyTicketForm trainId={train.id} departureDate={date} arrivalDate={date} />
      </div>
    </div>
  );
}