'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AdminState = {
  success: boolean;
  error?: string;
  message?: string;
} | undefined;

export async function adminLoginAction(prevState: AdminState, formData: FormData): Promise<AdminState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email !== 'marchenkoa1986@gmail.com' || password !== 'Aysisu') {
    return { success: false, error: 'Неверные данные для входа в админ-панель' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: 'Ошибка при входе в админ-панель: ' + error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/admin/dashboard');
}

export async function addTrainAction(prevState: AdminState, formData: FormData): Promise<AdminState> {
  const supabase = await createClient();

  const number = formData.get('number') as string;
  const name = formData.get('name') as string;
  const route = formData.get('route') as string;
  const departure_time = formData.get('departure_time') as string;
  const arrival_time = formData.get('arrival_time') as string;
  const type = formData.get('type') as string;

  if (!number || !route || !departure_time || !arrival_time) {
    return { success: false, error: 'Заполните все обязательные поля' };
  }

  const { error } = await supabase.from('trains').insert({
    number,
    name: name || null,
    route,
    departure_time,
    arrival_time,
    type: type || null,
  });

  if (error) {
    return { success: false, error: 'Ошибка при добавлении поезда: ' + error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true, message: 'Поезд успешно добавлен' };
}

export async function updateTrainAction(prevState: AdminState, formData: FormData): Promise<AdminState> {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const number = formData.get('number') as string;
  const name = formData.get('name') as string;
  const route = formData.get('route') as string;
  const departure_time = formData.get('departure_time') as string;
  const arrival_time = formData.get('arrival_time') as string;
  const type = formData.get('type') as string;

  if (!id || !number || !route || !departure_time || !arrival_time) {
    return { success: false, error: 'Заполните все обязательные поля' };
  }

  const { error } = await supabase.from('trains').update({
    number,
    name: name || null,
    route,
    departure_time,
    arrival_time,
    type: type || null,
  }).eq('id', id);

  if (error) {
    return { success: false, error: 'Ошибка при обновлении поезда: ' + error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true, message: 'Поезд успешно обновлён' };
}

export async function deleteTrainAction(prevState: AdminState, formData: FormData): Promise<AdminState> {
  const supabase = await createClient();

  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, error: 'ID поезда не указан' };
  }

  const { error } = await supabase.from('trains').delete().eq('id', id);

  if (error) {
    return { success: false, error: 'Ошибка при удалении поезда: ' + error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true, message: 'Поезд успешно удалён' };
}

export async function bulkAddTrainsAction(prevState: AdminState, formData: FormData): Promise<AdminState> {
  const supabase = await createClient();

  const route = formData.get('route') as string;
  const trainType = formData.get('trainType') as string;
  const trainName = formData.get('trainName') as string;
  const departureTimesRaw = formData.get('departureTimes') as string;
  const travelHours = parseInt((formData.get('travelHours') as string) || '4');
  const travelMinutes = parseInt((formData.get('travelMinutes') as string) || '0');
  const numberPrefix = formData.get('numberPrefix') as string;

  if (!route || !departureTimesRaw || !numberPrefix) {
    return { success: false, error: 'Заполните маршрут, префикс номера и время отправления' };
  }

  // Parse departure times (one per line)
  const departureTimes = departureTimesRaw
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (departureTimes.length === 0) {
    return { success: false, error: 'Укажите хотя бы одно время отправления' };
  }

  // Calculate travel duration in minutes
  const travelDurationMinutes = travelHours * 60 + travelMinutes;

  // Build trains array
  const trains = departureTimes.map((time, index) => {
    // Calculate arrival time
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + travelDurationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMins = totalMinutes % 60;
    const arrivalTime = `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMins).padStart(2, '0')}`;

    // Generate train number: prefix + sequential number
    const seqNumber = index + 1;
    const trainNumber = `${numberPrefix}${String(seqNumber).padStart(2, '0')}`;

    return {
      number: trainNumber,
      name: trainName || null,
      route,
      departure_time: time,
      arrival_time: arrivalTime,
      type: trainType || null,
    };
  });

  const { error } = await supabase.from('trains').insert(trains);

  if (error) {
    return { success: false, error: 'Ошибка при массовом добавлении: ' + error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true, message: `Успешно добавлено ${trains.length} поездов` };
}

export async function seedPopularRoutesAction(): Promise<AdminState> {
  const supabase = await createClient();

  // Check if trains already exist
  const { count } = await supabase.from('trains').select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return { success: false, error: `В базе уже есть ${count} поездов. Сначала удалите их, если хотите загрузить демо-данные.` };
  }

  // Define seed data: multiple trains per popular route
  const seedData = [
    // Moscow → Saint Petersburg (Сапсаны каждые 1-1.5 часа)
    { number: '701А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '06:45', arrival_time: '10:30', type: 'sapsan' },
    { number: '703А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '07:30', arrival_time: '11:15', type: 'sapsan' },
    { number: '705А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '09:00', arrival_time: '12:45', type: 'sapsan' },
    { number: '707А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '10:30', arrival_time: '14:15', type: 'sapsan' },
    { number: '709А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '12:00', arrival_time: '15:45', type: 'sapsan' },
    { number: '711А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '13:30', arrival_time: '17:15', type: 'sapsan' },
    { number: '713А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '15:00', arrival_time: '18:45', type: 'sapsan' },
    { number: '715А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '16:30', arrival_time: '20:15', type: 'sapsan' },
    { number: '717А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '18:00', arrival_time: '21:45', type: 'sapsan' },
    { number: '719А', name: 'Сапсан', route: 'Москва — Санкт-Петербург', departure_time: '19:30', arrival_time: '23:15', type: 'sapsan' },
    { number: '001А', name: 'Красная Стрела', route: 'Москва — Санкт-Петербург', departure_time: '23:55', arrival_time: '08:00', type: 'firmenny' },
    { number: '003А', name: 'Экспресс', route: 'Москва — Санкт-Петербург', departure_time: '22:50', arrival_time: '06:45', type: 'firmenny' },
    { number: '101Л', name: 'Ласточка', route: 'Москва — Санкт-Петербург', departure_time: '05:30', arrival_time: '10:00', type: 'lastochka' },
    { number: '103Л', name: 'Ласточка', route: 'Москва — Санкт-Петербург', departure_time: '14:00', arrival_time: '18:30', type: 'lastochka' },

    // Saint Petersburg → Moscow
    { number: '702А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '06:30', arrival_time: '10:15', type: 'sapsan' },
    { number: '704А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '08:00', arrival_time: '11:45', type: 'sapsan' },
    { number: '706А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '09:30', arrival_time: '13:15', type: 'sapsan' },
    { number: '708А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '11:00', arrival_time: '14:45', type: 'sapsan' },
    { number: '710А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '12:30', arrival_time: '16:15', type: 'sapsan' },
    { number: '712А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '14:00', arrival_time: '17:45', type: 'sapsan' },
    { number: '714А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '15:30', arrival_time: '19:15', type: 'sapsan' },
    { number: '716А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '17:00', arrival_time: '20:45', type: 'sapsan' },
    { number: '718А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '18:30', arrival_time: '22:15', type: 'sapsan' },
    { number: '720А', name: 'Сапсан', route: 'Санкт-Петербург — Москва', departure_time: '20:00', arrival_time: '23:45', type: 'sapsan' },
    { number: '002А', name: 'Красная Стрела', route: 'Санкт-Петербург — Москва', departure_time: '23:55', arrival_time: '08:00', type: 'firmenny' },
    { number: '102Л', name: 'Ласточка', route: 'Санкт-Петербург — Москва', departure_time: '05:00', arrival_time: '09:30', type: 'lastochka' },

    // Moscow → Kazan
    { number: '001Г', name: 'Татарстан', route: 'Москва — Казань', departure_time: '06:00', arrival_time: '18:00', type: 'firmenny' },
    { number: '003Г', name: 'Казань Экспресс', route: 'Москва — Казань', departure_time: '10:00', arrival_time: '22:00', type: 'skory' },
    { number: '005Г', name: 'Волга', route: 'Москва — Казань', departure_time: '14:00', arrival_time: '02:00', type: 'passazhirsky' },
    { number: '007Г', name: 'Ночной', route: 'Москва — Казань', departure_time: '22:00', arrival_time: '10:00', type: 'passazhirsky' },
    { number: '101Г', name: 'Ласточка', route: 'Москва — Казань', departure_time: '07:30', arrival_time: '15:30', type: 'lastochka' },

    // Moscow → Nizhny Novgorod
    { number: '001Н', name: 'Волга-Экспресс', route: 'Москва — Нижний Новгород', departure_time: '06:30', arrival_time: '10:30', type: 'sapsan' },
    { number: '003Н', name: 'Ласточка', route: 'Москва — Нижний Новгород', departure_time: '08:00', arrival_time: '12:00', type: 'lastochka' },
    { number: '005Н', name: 'Ласточка', route: 'Москва — Нижний Новгород', departure_time: '10:00', arrival_time: '14:00', type: 'lastochka' },
    { number: '007Н', name: 'Скорый', route: 'Москва — Нижний Новгород', departure_time: '12:00', arrival_time: '16:30', type: 'skory' },
    { number: '009Н', name: 'Ласточка', route: 'Москва — Нижний Новгород', departure_time: '14:00', arrival_time: '18:00', type: 'lastochka' },
    { number: '011Н', name: 'Ласточка', route: 'Москва — Нижний Новгород', departure_time: '16:00', arrival_time: '20:00', type: 'lastochka' },
    { number: '013Н', name: 'Ночной', route: 'Москва — Нижний Новгород', departure_time: '23:00', arrival_time: '06:00', type: 'passazhirsky' },

    // Moscow → Sochi
    { number: '001С', name: 'Черноморец', route: 'Москва — Сочи', departure_time: '08:00', arrival_time: '08:00', type: 'firmenny' },
    { number: '003С', name: 'Южный Экспресс', route: 'Москва — Сочи', departure_time: '10:00', arrival_time: '10:00', type: 'firmenny' },
    { number: '005С', name: 'Адлер', route: 'Москва — Сочи', departure_time: '12:00', arrival_time: '12:00', type: 'passazhirsky' },
    { number: '007С', name: 'Ночной Юг', route: 'Москва — Сочи', departure_time: '18:00', arrival_time: '18:00', type: 'passazhirsky' },
    { number: '101С', name: 'Ласточка', route: 'Москва — Сочи', departure_time: '06:00', arrival_time: '20:00', type: 'lastochka' },

    // Ekaterinburg → Moscow
    { number: '001Е', name: 'Урал-Экспресс', route: 'Екатеринбург — Москва', departure_time: '06:00', arrival_time: '06:00', type: 'firmenny' },
    { number: '003Е', name: 'Демидовский', route: 'Екатеринбург — Москва', departure_time: '10:00', arrival_time: '10:00', type: 'firmenny' },
    { number: '005Е', name: 'Скорый', route: 'Екатеринбург — Москва', departure_time: '14:00', arrival_time: '14:00', type: 'skory' },
    { number: '007Е', name: 'Ночной Урал', route: 'Екатеринбург — Москва', departure_time: '20:00', arrival_time: '20:00', type: 'passazhirsky' },
  ];

  const { error } = await supabase.from('trains').insert(seedData);

  if (error) {
    return { success: false, error: 'Ошибка при загрузке демо-данных: ' + error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true, message: `Загружено ${seedData.length} демо-поездов по популярным маршрутам` };
}

export async function checkAdminAccess() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return user.email === 'marchenkoa1986@gmail.com';
}