"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PropertyFilters } from "@/types/property"

interface FilterSectionProps {
  onFilterChange?: (filters: PropertyFilters) => void
}

export function FilterSection({ onFilterChange }: FilterSectionProps) {
  const [filters, setFilters] = useState({
    type: "all",
    listingType: "all",
    price: "all",
    location: "all"
  })

  const handleFilterChange = () => {
    if (!onFilterChange) return

    const apiFilters: PropertyFilters = {}

    // Convert type filter
    if (filters.type !== "all") {
      switch (filters.type) {
        case "house":
          apiFilters.propertyType = "HOUSE"
          break
        case "apartment":
          apiFilters.propertyType = "APARTMENT"
          break
        case "commercial":
          apiFilters.propertyType = "COMMERCIAL"
          break
        case "land":
          apiFilters.propertyType = "LAND"
          break
      }
    }

    // Convert price filter
    if (filters.price !== "all") {
      switch (filters.price) {
        case "0-50000":
          apiFilters.minPrice = 0
          apiFilters.maxPrice = 50000
          break
        case "50000-100000":
          apiFilters.minPrice = 50000
          apiFilters.maxPrice = 100000
          break
        case "100000-200000":
          apiFilters.minPrice = 100000
          apiFilters.maxPrice = 200000
          break
        case "200000+":
          apiFilters.minPrice = 200000
          break
      }
    }

    // Convert listing type filter
    if (filters.listingType !== "all") {
      switch (filters.listingType) {
        case "rent":
          apiFilters.listingType = "RENT"
          break
        case "sale":
          apiFilters.listingType = "SALE"
          break
        case "both":
          apiFilters.listingType = "BOTH"
          break
      }
    }

    // Convert location filter
    if (filters.location !== "all") {
      apiFilters.city = filters.location
    }

    onFilterChange(apiFilters)
  }

  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Filtrar propiedades</h2>
            <p className="text-gray-600">Encuentra exactamente lo que buscas</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Select value={filters.listingType} onValueChange={(value) => setFilters({...filters, listingType: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alquiler o Venta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alquiler y Venta</SelectItem>
                <SelectItem value="rent">🏠 Solo Alquiler</SelectItem>
                <SelectItem value="sale">💰 Solo Venta</SelectItem>
                <SelectItem value="both">🔄 Ambos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="apartment">Departamento</SelectItem>
                <SelectItem value="commercial">Local comercial</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.price} onValueChange={(value) => setFilters({...filters, price: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rango de precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los precios</SelectItem>
                <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                <SelectItem value="100000-200000">$100,000 - $200,000</SelectItem>
                <SelectItem value="200000+">$200,000+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                <SelectItem value="Posadas">Posadas</SelectItem>
                <SelectItem value="Eldorado">Eldorado</SelectItem>
                <SelectItem value="Oberá">Oberá</SelectItem>
                <SelectItem value="Apóstoles">Apóstoles</SelectItem>
                <SelectItem value="Puerto Iguazú">Puerto Iguazú</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleFilterChange}>Filtrar</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
