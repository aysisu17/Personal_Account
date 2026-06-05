import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">РЖД</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Личный кабинет
          </h1>
          <p className="mt-2 text-gray-600">
            Войдите в свой аккаунт пассажира
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}