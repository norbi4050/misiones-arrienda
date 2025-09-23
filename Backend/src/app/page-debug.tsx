export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Misiones Arrienda</h1>
        <p className="text-gray-600">Servidor funcionando correctamente</p>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Estado del servidor</h2>
          <p className="text-green-600">✅ Servidor funcionando en puerto 3000</p>
          <p className="text-green-600">✅ Layout simplificado cargando</p>
          <p className="text-green-600">✅ Página principal sin errores</p>
        </div>
      </div>
    </div>
  )
}
