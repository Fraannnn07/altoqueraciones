import { LoginForm } from './LoginForm';
import { cardClass } from '@/components/admin/ui';

export default function AdminLoginPage() {
  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className={cardClass}>
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin</h1>
        <p className="mt-1 text-sm text-gray-600">Al Toque Raciones — panel de productos</p>
        <LoginForm />
      </div>
    </div>
  );
}
