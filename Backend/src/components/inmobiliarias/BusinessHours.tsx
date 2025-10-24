'use client';

import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { BusinessHours as BusinessHoursType, DAY_NAMES_ES } from '@/types/inmobiliaria';

interface BusinessHoursProps {
  hours: BusinessHoursType;
  timezone: string;
  className?: string;
}

/**
 * Componente: Horarios de Atención (Solo Lectura)
 * 
 * Muestra los horarios de atención de la inmobiliaria con:
 * - Horarios de cada día de la semana
 * - Indicador "Abierto ahora" en tiempo real
 * - Próximo horario de apertura si está cerrado
 * 
 * Uso: Perfil público de inmobiliarias
 */
export default function BusinessHours({ hours, timezone, className = '' }: BusinessHoursProps) {
  // Calcular si está abierto ahora
  const isOpenNow = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()] as keyof BusinessHoursType;
    const todayHours = hours[currentDay];

    if (todayHours.closed) {
      return false;
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  };

  const open = isOpenNow();

  const daysOrder: (keyof BusinessHoursType)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-0 ${className}`}>
      {/* Header con estado actual */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Horarios de Atención
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${open ? 'bg-green-50' : 'bg-gray-100'}`}>
          {open ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-600">
                Abierto ahora
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-600">
                Cerrado
              </span>
            </>
          )}
        </div>
      </div>

      {/* Lista de horarios */}
      <div className="space-y-2">
        {daysOrder.map((day) => {
          const dayHours = hours[day];
          const dayName = DAY_NAMES_ES[day];

          return (
            <div
              key={day}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-semibold text-gray-700">
                {dayName}
              </span>
              {dayHours.closed ? (
                <span className="text-sm text-gray-500 font-medium">
                  Cerrado
                </span>
              ) : (
                <span className="text-sm text-gray-900 font-semibold">
                  {dayHours.open} - {dayHours.close}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Zona horaria */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-medium">
          Zona horaria: {timezone}
        </p>
      </div>
    </div>
  );
}
