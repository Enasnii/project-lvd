import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <AdminPageClient />;
}
