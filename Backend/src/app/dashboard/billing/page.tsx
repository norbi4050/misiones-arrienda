"use client";

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Package, 
  Star, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  isActive: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface Payment {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  property_id?: string;
  meta?: any;
}

interface BillingData {
  subscription: Subscription | null;
  stats: {
    totalProperties: number;
    featuredProperties: number;
    canPublishMore: boolean;
  };
  plans: {
    [key: string]: {
      name: string;
      price: number;
      currency: string;
      features: string[];
    };
  };
}

export default function BillingPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  // Cargar datos de facturación
  useEffect(() => {
    if (user) {
      loadBillingData();
      loadPaymentHistory();
    }
  }, [user]);

  const loadBillingData = async () => {
    try {
      const response = await fetch('/api/payments/subscription');
      const data = await response.json();

      if (data.success) {
        setBillingData(data);
      } else {
        console.error('Error loading billing data:', data.error);
        toast.error('Error cargando datos de facturación');
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Error cargando datos de facturación');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      // Simular historial de pagos (en producción vendría de una API)
      const mockPayments: Payment[] = [
        {
          id: '1',
          type: 'FEATURE',
          status: 'APPROVED',
          amount: 999,
          currency: 'ARS',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          property_id: 'prop-123'
        },
        {
          id: '2',
          type: 'FEATURE',
          status: 'PENDING',
          amount: 999,
          currency: 'ARS',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          property_id: 'prop-456'
        }
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleSubscribe = async (plan: 'AGENCY_BASIC' | 'AGENCY_PRO' = 'AGENCY_BASIC') => {
    if (!user) {
      toast.error('Debes iniciar sesión para suscribirte');
      return;
    }

    setIsProcessingSubscription(true);

    try {
      console.log('🔧 Iniciando suscripción:', plan);

      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando suscripción');
      }

      if (data.success && data.initPoint) {
        console.log('✅ Preferencia de suscripción creada, redirigiendo a MercadoPago');
        toast.success('Redirigiendo a MercadoPago...');
        
        // Redirigir a MercadoPago
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('❌ Error en suscripción:', error);
      toast.error(error instanceof Error ? error.message : 'Error procesando suscripción');
    } finally {
      setIsProcessingSubscription(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Activa</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">Aprobado</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando datos de facturación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Restringido
            </h1>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para acceder a tu información de facturación.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">Crear Cuenta</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Facturación y Suscripciones
          </h1>
          <p className="text-gray-600">
            Gestiona tu suscripción, pagos y destacados de propiedades
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de Suscripción */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Estado de Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingData?.subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {billingData.plans[billingData.subscription.plan]?.name || billingData.subscription.plan}
                        </h3>
                        <p className="text-gray-600">
                          ${billingData.plans[billingData.subscription.plan]?.price.toLocaleString()} ARS/mes
                        </p>
                      </div>
                      {getStatusBadge(billingData.subscription.status)}
                    </div>

                    {billingData.subscription.isActive && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="font-medium text-green-800">Suscripción Activa</p>
                            <p className="text-sm text-green-600">
                              Renovación: {new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Propiedades:</span>
                        <span className="ml-2 font-medium">{billingData.stats.totalProperties}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Destacadas:</span>
                        <span className="ml-2 font-medium">{billingData.stats.featuredProperties}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sin Suscripción Activa
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Actualmente estás en el plan gratuito (1 propiedad)
                    </p>
                    
                    <div className="p-4 bg-blue-50 rounded-lg mb-6">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        🚀 Beneficios del Plan Agencia
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Publicá más de 1 propiedad</li>
                        <li>• Destacados incluidos</li>
                        <li>• Badge "Agencia" en tus anuncios</li>
                        <li>• Soporte prioritario</li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleSubscribe('AGENCY_BASIC')}
                      disabled={isProcessingSubscription}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessingSubscription ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Suscribirme (Agencia) - $2.999 ARS/mes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historial de Pagos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {payment.type === 'FEATURE' ? (
                              <Star className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Package className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {payment.type === 'FEATURE' ? 'Destacar Anuncio' : 'Suscripción Agencia'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.created_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${payment.amount.toLocaleString()} {payment.currency}
                          </div>
                          <div className="mt-1">
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay pagos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Propiedades publicadas</span>
                    <span className="font-semibold">{billingData?.stats.totalProperties || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Destacadas activas</span>
                    <span className="font-semibold">{billingData?.stats.featuredProperties || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Puede publicar más</span>
                    <span className="font-semibold">
                      {billingData?.stats.canPublishMore ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planes Disponibles */}
            {billingData?.plans && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Planes Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(billingData.plans).map(([planKey, plan]) => (
                      <div key={planKey} className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">{plan.name}</h4>
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          ${plan.price.toLocaleString()} {plan.currency}
                          <span className="text-sm text-gray-600 font-normal">/mes</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {!billingData.subscription?.isActive && (
                          <Button
                            onClick={() => handleSubscribe(planKey as 'AGENCY_BASIC' | 'AGENCY_PRO')}
                            disabled={isProcessingSubscription}
                            className="w-full"
                            size="sm"
                          >
                            {isProcessingSubscription ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Package className="h-3 w-3 mr-1" />
                            )}
                            Suscribirme
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enlaces Útiles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enlaces Útiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/mis-propiedades" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="h-4 w-4 mr-2" />
                      Mis Propiedades
                    </Button>
                  </Link>
                  <Link href="/publicar" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="h-4 w-4 mr-2" />
                      Publicar Nueva
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
