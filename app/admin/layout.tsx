import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin-auth';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: { absolute: 'Admin | Al Toque Raciones' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {authed ? <AdminNav /> : null}
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
