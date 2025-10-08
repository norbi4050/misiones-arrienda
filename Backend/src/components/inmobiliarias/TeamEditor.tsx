'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, Save } from 'lucide-react';
import { TeamMember, AGENCY_LIMITS } from '@/types/inmobiliaria';
import TeamPhotoUploader from './TeamPhotoUploader';

interface TeamEditorProps {
  initialTeam: TeamMember[];
  onSave: (team: TeamMember[]) => Promise<void>;
  className?: string;
}

/**
 * Componente: Editor de Equipo
 * 
 * Editor completo para gestionar el equipo de la inmobiliaria:
 * - Máximo 2 miembros activos
 * - Agregar/editar/eliminar miembros
 * - Upload de foto (opcional)
 * - Reordenar con drag & drop (simplificado)
 * - Validaciones
 * 
 * Uso: Mi Empresa (solo para inmobiliarias)
 */
export default function TeamEditor({ 
  initialTeam, 
  onSave,
  className = '' 
}: TeamEditorProps) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeMembers = team.filter(m => m.is_active);
  const canAddMore = activeMembers.length < AGENCY_LIMITS.MAX_TEAM_MEMBERS;

  const handleAddMember = () => {
    if (!canAddMore) {
      alert(`Solo puedes tener máximo ${AGENCY_LIMITS.MAX_TEAM_MEMBERS} miembros activos`);
      return;
    }

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      agency_id: '',
      name: '',
      photo_url: null,
      display_order: team.length,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTeam([...team, newMember]);
  };

  const handleUpdateMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeam(prev => prev.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));

    // Limpiar error
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este miembro del equipo?')) {
      setTeam(prev => prev.filter(member => member.id !== id));
    }
  };

  const validateTeam = (): boolean => {
    const newErrors: Record<string, string> = {};

    team.forEach(member => {
      if (member.is_active) {
        if (!member.name || member.name.trim().length === 0) {
          newErrors[member.id] = 'El nombre es requerido';
        } else if (member.name.length > 100) {
          newErrors[member.id] = 'El nombre no puede exceder 100 caracteres';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTeam()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(team);
    } catch (error) {
      console.error('Error guardando equipo:', error);
      alert('Error al guardar equipo. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Equipo ({activeMembers.length}/{AGENCY_LIMITS.MAX_TEAM_MEMBERS})
          </h3>
        </div>
        <button
          onClick={handleAddMember}
          disabled={!canAddMore}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Lista de miembros */}
      <div className="space-y-2">
        {team.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay miembros en el equipo</p>
            <p className="text-xs">Haz clic en "Agregar" para comenzar</p>
          </div>
        ) : (
          team.map((member, index) => (
            <div
              key={member.id}
              className="border border-gray-200 dark:border-gray-700 rounded-md p-2"
            >
              <div className="flex items-start gap-3">
                {/* Foto con uploader funcional - más pequeña */}
                <div className="flex-shrink-0">
                  <TeamPhotoUploader
                    currentPhotoUrl={member.photo_url}
                    memberId={member.id}
                    onUploadSuccess={(photoUrl) => handleUpdateMember(member.id, 'photo_url', photoUrl)}
                    onDeleteSuccess={() => handleUpdateMember(member.id, 'photo_url', null)}
                    disabled={false}
                  />
                </div>

                {/* Datos */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors[member.id] && (
                      <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                        {errors[member.id]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.is_active}
                        onChange={(e) => handleUpdateMember(member.id, 'is_active', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Activo
                      </span>
                    </label>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 Máximo {AGENCY_LIMITS.MAX_TEAM_MEMBERS} miembros activos. Los inactivos no se mostrarán en el perfil público.
        </p>
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
              <span>Guardar Equipo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
