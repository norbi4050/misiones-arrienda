"use client";
import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { requestPasswordReset } = useSupabaseAuth();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setEmailSent(true);
        setMsg(result.message || "Email enviado exitosamente");
      } else {
        setMsg(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Revisa tu email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Te enviamos un enlace a <strong>{email}</strong> para que puedas restablecer tu contraseña.
            </p>
            <p className="mt-4 text-center text-sm text-gray-500">
              El enlace expirará en 1 hora.
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                💡 <strong>Consejo:</strong> Si no ves el email, revisa tu carpeta de spam o correo no deseado.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => router.push("/login")}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al login
            </button>

            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
                setMsg(null);
              }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ¿No recibiste el email? Reenviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </div>

          {msg && (
            <div className={`mt-4 p-4 rounded-md ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm">{msg}</p>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
