import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminDashboardClient } from './dashboard-client';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== 'marchenkoa1986@gmail.com') {
    redirect('/admin');
  }

  const { data: trains } = await supabase
    .from('trains')
    .select('*')
    .order('departure_time', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminDashboardClient
        trains={trains ?? []}
        userEmail={user.email!}
        userName={user.user_metadata?.full_name}
      />
    </div>
  );
}