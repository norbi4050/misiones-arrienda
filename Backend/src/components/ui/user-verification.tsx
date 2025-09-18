"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Card } from './card';
import { AvatarOptimized } from './avatar-optimized';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Upload,
  FileText,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { cn } from "@/utils";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  icon: React.ReactNode;
}

interface UserVerificationProps {
  userId: string;
  currentVerificationLevel: 'none' | 'basic' | 'verified' | 'premium';
  onVerificationUpdate?: (level: string) => void;
}

export function UserVerification({
  userId,
  currentVerificationLevel,
  onVerificationUpdate
}: UserVerificationProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const verificationSteps: VerificationStep[] = [
    {
      id: 'email',
      title: 'Verificación de Email',
      description: 'Confirma tu dirección de correo electrónico',
      status: currentVerificationLevel !== 'none' ? 'completed' : 'pending',
      required: true,
      icon: <Mail className="w-5 h-5" />
    },
    {
      id: 'phone',
      title: 'Verificación de Teléfono',
      description: 'Agrega y verifica tu número de teléfono',
      status: currentVerificationLevel === 'verified' || currentVerificationLevel === 'premium' ? 'completed' : 'pending',
      required: false,
      icon: <Phone className="w-5 h-5" />
    },
    {
      id: 'identity',
      title: 'Verificación de Identidad',
      description: 'Sube una foto de tu documento de identidad',
      status: currentVerificationLevel === 'premium' ? 'completed' : 'pending',
      required: false,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'profile',
      title: 'Perfil Completo',
      description: 'Completa toda la información de tu perfil',
      status: currentVerificationLevel !== 'none' ? 'completed' : 'pending',
      required: true,
      icon: <User className="w-5 h-5" />
    }
  ];

  const getStatusIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-yellow-200 bg-yellow-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getVerificationBadge = () => {
    switch (currentVerificationLevel) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium Verificado</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800">Básico</Badge>;
      default:
        return <Badge variant="outline">Sin Verificar</Badge>;
    }
  };

  const handleStepAction = async (stepId: string) => {
    setActiveStep(stepId);
    
    try {
      setUploading(true);
      
      // Simular proceso de verificación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real de verificación
      console.log(`Iniciando verificación para paso: ${stepId}`);
      
      onVerificationUpdate?.(stepId);
    } catch (error) {
      console.error('Error en verificación:', error);
    } finally {
      setUploading(false);
      setActiveStep(null);
    }
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verificación de Usuario</h3>
              <p className="text-sm text-gray-600">Aumenta tu credibilidad y accede a más funciones</p>
            </div>
          </div>
          {getVerificationBadge()}
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso de verificación</span>
            <span>{completedSteps}/{totalSteps} completados</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Pasos de verificación */}
        <div className="space-y-4">
          {verificationSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "border rounded-lg p-4 transition-all duration-200",
                getStatusColor(step.status),
                activeStep === step.id && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h4>
                      {step.required && (
                        <Badge variant="outline" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusIcon(step.status)}
                  
                  {step.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleStepAction(step.id)}
                      disabled={uploading || activeStep === step.id}
                    >
                      {activeStep === step.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Verificar'
                      )}
                    </Button>
                  )}
                  
                  {step.status === 'completed' && (
                    <Badge className="bg-green-100 text-green-800">
                      Completado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Beneficios de verificación */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Beneficios de la Verificación
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mayor confianza de otros usuarios</li>
            <li>• Acceso a funciones premium</li>
            <li>• Prioridad en búsquedas</li>
            <li>• Soporte prioritario</li>
          </ul>
        </div>

        {/* Estado actual */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Nivel actual: <strong>{currentVerificationLevel}</strong>
            </span>
            <span className="text-gray-600">
              {progressPercentage.toFixed(0)}% completado
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default UserVerification;
