'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchTrains(formData: FormData) {
  const supabase = await createClient();

  const fromCity = formData.get('fromCity') as string;
  const toCity = formData.get('toCity') as string;
  const date = formData.get('date') as string;
  const trainType = formData.get('trainType') as string;

  if (!fromCity || !toCity) {
    return { success: false, error: 'Укажите города отправления и назначения', data: [] };
  }

  // Search trains by route (case-insensitive)
  let query = supabase
    .from('trains')
    .select('*')
    .ilike('route', `%${fromCity}%`)
    .ilike('route', `%${toCity}%`);

  // Filter by train type if specified
  if (trainType && trainType !== 'all') {
    query = query.eq('type', trainType);
  }

  const { data: trains, error } = await query;

  if (error) {
    console.error('Error searching trains:', error);
    return { success: false, error: 'Ошибка при поиске поездов', data: [] };
  }

  return { success: true, data: trains ?? [] };
}

export async function getAllStations() {
  const supabase = await createClient();

  const { data: stations, error } = await supabase
    .from('stations')
    .select('*')
    .order('city', { ascending: true });

  if (error) {
    console.error('Error fetching stations:', error);
    return [];
  }

  return stations ?? [];
}

export async function getTrainById(trainId: string) {
  const supabase = await createClient();

  const { data: train, error } = await supabase
    .from('trains')
    .select('*')
    .eq('id', trainId)
    .single();

  if (error) {
    console.error('Error fetching train:', error);
    return null;
  }

  return train;
}