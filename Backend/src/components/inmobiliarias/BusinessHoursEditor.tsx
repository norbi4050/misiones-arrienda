'use client';

import { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { BusinessHours, DaySchedule, DAY_NAMES_ES } from '@/types/inmobiliaria';

interface BusinessHoursEditorProps {
  initialHours: BusinessHours;
  onSave: (hours: BusinessHours) => Promise<void>;
  className?: string;
}

/**
 * Componente: Editor de Horarios de Atención
 * 
 * Editor completo para configurar horarios de atención:
 * - 7 días de la semana
 * - Checkbox "Cerrado" por día
 * - Inputs de hora apertura/cierre
 * - Validaciones (apertura < cierre)
 * - Botón guardar
 * 
 * Uso: Mi Empresa (solo para inmobiliarias)
 */
export default function BusinessHoursEditor({ 
  initialHours, 
  onSave,
  className = '' 
}: BusinessHoursEditorProps) {
  const [hours, setHours] = useState<BusinessHours>(initialHours);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const daysOrder: (keyof BusinessHours)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const handleDayChange = (day: keyof BusinessHours, field: keyof DaySchedule, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    // Limpiar error del día
    if (errors[day]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[day];
        return newErrors;
      });
    }
  };

  const validateHours = (): boolean => {
    const newErrors: Record<string, string> = {};

    daysOrder.forEach(day => {
      const dayHours = hours[day];
      
      if (!dayHours.closed) {
        // Validar que tenga horarios
        if (!dayHours.open || !dayHours.close) {
          newErrors[day] = 'Debe especificar horario de apertura y cierre';
          return;
        }

        // Validar formato HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(dayHours.open) || !timeRegex.test(dayHours.close)) {
          newErrors[day] = 'Formato de hora inválido (use HH:MM)';
          return;
        }

        // Validar que apertura < cierre
        const [openHour, openMin] = dayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;

        if (openTime >= closeTime) {
          newErrors[day] = 'La hora de apertura debe ser anterior a la de cierre';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateHours()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(hours);
    } catch (error) {
      console.error('Error guardando horarios:', error);
      alert('Error al guardar horarios. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Horarios de Atención
          </h3>
        </div>
      </div>

      {/* Editor de horarios */}
      <div className="space-y-2">
        {daysOrder.map((day) => {
          const dayHours = hours[day];
          const dayName = DAY_NAMES_ES[day];
          const hasError = !!errors[day];

          return (
            <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-md p-2">
              {/* Día y checkbox cerrado */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dayName}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayHours.closed}
                    onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Cerrado
                  </span>
                </label>
              </div>

              {/* Inputs de horarios (solo si no está cerrado) */}
              {!dayHours.closed && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Apertura
                    </label>
                    <input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <span className="text-gray-400 text-sm mt-4">-</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Cierre
                    </label>
                    <input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {hasError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors[day]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón guardar */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Horarios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
