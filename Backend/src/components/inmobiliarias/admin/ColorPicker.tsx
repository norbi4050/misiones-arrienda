'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paintbrush } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  { name: 'Azul Profesional', color: '#2563EB' },
  { name: 'Azul Oscuro', color: '#1E40AF' },
  { name: 'Verde', color: '#059669' },
  { name: 'Púrpura', color: '#7C3AED' },
  { name: 'Rosa', color: '#DB2777' },
  { name: 'Naranja', color: '#EA580C' },
  { name: 'Ámbar', color: '#F59E0B' },
  { name: 'Rojo', color: '#DC2626' },
  { name: 'Índigo', color: '#4F46E5' },
  { name: 'Cian', color: '#0891B2' },
  { name: 'Gris Oscuro', color: '#374151' },
  { name: 'Negro', color: '#111827' },
];

export default function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>

      <div className="flex gap-3">
        {/* Color preview & hex input */}
        <div className="flex-1 flex gap-2">
          <div
            className="w-12 h-10 rounded-md border-2 border-gray-300 cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => !disabled && setShowPresets(!showPresets)}
          />

          <div className="flex-1 relative">
            <Paintbrush className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="pl-10 uppercase"
              placeholder="#2563EB"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxLength={7}
            />
          </div>
        </div>

        {/* Native color picker */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          className="w-12 h-10 rounded-md border-2 border-gray-300 cursor-pointer"
        />
      </div>

      {/* Preset colors */}
      {showPresets && !disabled && (
        <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg border">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.color}
              type="button"
              onClick={() => {
                onChange(preset.color);
                setShowPresets(false);
              }}
              className="group relative"
              title={preset.name}
            >
              <div
                className="w-10 h-10 rounded-md border-2 border-gray-300 hover:border-gray-900 hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: preset.color }}
              />
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
