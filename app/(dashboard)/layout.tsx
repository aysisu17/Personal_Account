import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userName = user.user_metadata?.full_name as string | null;
  const userEmail = user.email!;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={userName} userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}