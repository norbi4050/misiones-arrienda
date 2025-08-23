"use client"

import { Home, Users, MapPin, TrendingUp } from "lucide-react"

const stats = [
  {
    icon: Home,
    value: "500+",
    label: "Propiedades disponibles",
    color: "text-blue-600"
  },
  {
    icon: Users,
    value: "1000+",
    label: "Clientes satisfechos",
    color: "text-green-600"
  },
  {
    icon: MapPin,
    value: "50+",
    label: "Ubicaciones en Misiones",
    color: "text-purple-600"
  },
  {
    icon: TrendingUp,
    value: "95%",
    label: "Tasa de satisfacción",
    color: "text-orange-600"
  }
]

export function StatsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
