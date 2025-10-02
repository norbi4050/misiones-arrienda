'use client';

import { useEffect, useState } from 'react';

interface PlanInfo {
  plan_tier: 'free' | 'pro' | 'business';
  max_active_properties: number | null;
  current_active_properties: number;
  allow_attachments: boolean;
  allow_featured: boolean;
  allow_analytics: boolean;
  plan_expires_at: string | null;
  is_expired: boolean;
  description: string;
  price_monthly: number;
}

export function PlanCard() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/plan')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlanInfo(data.plan);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!planInfo) return null;

  const tierConfig = {
    free: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'GRATIS' },
    pro: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'PRO' },
    business: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'BUSINESS' }
  };

  const config = tierConfig[planInfo.plan_tier];
  const usagePercent = planInfo.max_active_properties 
    ? (planInfo.current_active_properties / planInfo.max_active_properties) * 100 
    : 0;

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Mi Plan</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-gray-600">{planInfo.description}</p>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Propiedades Activas */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Propiedades activas</span>
            <span className="font-semibold">
              {planInfo.current_active_properties} / {planInfo.max_active_properties || '∞'}
            </span>
          </div>
          
          {planInfo.max_active_properties && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Características */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Adjuntos en mensajes</span>
            <span className={planInfo.allow_attachments ? 'text-green-600' : 'text-gray-400'}>
              {planInfo.allow_attachments ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Propiedades destacadas</span>
            <span className={planInfo.allow_featured ? 'text-green-600' : 'text-gray-400'}>
              {planInfo.allow_featured ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Analytics avanzado</span>
            <span className={planInfo.allow_analytics ? 'text-green-600' : 'text-gray-400'}>
              {planInfo.allow_analytics ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Expiración */}
        {planInfo.plan_expires_at && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            {planInfo.is_expired ? (
              <span className="text-red-600 font-medium">Plan expirado</span>
            ) : (
              <>Expira: {new Date(planInfo.plan_expires_at).toLocaleDateString('es-AR')}</>
            )}
          </div>
        )}

        {/* CTA Mejorar Plan */}
        {(planInfo.plan_tier === 'free' || planInfo.is_expired) && (
          <button 
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '/pricing'}
          >
            {planInfo.is_expired ? 'Renovar Plan' : 'Mejorar Plan'}
          </button>
        )}
      </div>
    </div>
  );
}
