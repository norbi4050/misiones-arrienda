import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AnalyticsDashboard from './analytics-dashboard';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar tipo de usuario
  const { data: userData } = await supabase
    .from('users')
    .select('user_type, is_company')
    .eq('id', user.id)
    .single();

  const isAgency = userData?.user_type === 'inmobiliaria' || userData?.is_company === true;

  if (!isAgency) {
    redirect('/mi-cuenta');
  }

  // Verificar límites del plan
  const { data: planLimits } = await supabase
    .rpc('get_user_plan_limits', { user_uuid: user.id });

  const allowAnalytics = planLimits?.[0]?.allow_analytics || false;

  if (!allowAnalytics) {
    // Mostrar página de upgrade
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Analytics Avanzado
            </h1>

            <p className="text-lg text-gray-700 mb-6">
              Las estadísticas detalladas están disponibles en el Plan Professional
            </p>

            <div className="bg-white rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Con el Plan Professional obtenés:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Tracking de visitas en tiempo real</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Gráficos de rendimiento por propiedad</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Análisis de contactos y conversión</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Comparativas mensuales y tendencias</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Exportar reportes en PDF/CSV</span>
                </li>
              </ul>
            </div>

            <a
              href="/mi-empresa/planes"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Ver Planes
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Si tiene acceso, mostrar dashboard
  return (
    <main className="container mx-auto px-4 py-10">
      <AnalyticsDashboard userId={user.id} />
    </main>
  );
}
