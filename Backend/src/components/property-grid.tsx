"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { FilterSection } from "@/components/filter-section-fixed"
import { getProperties } from "@/lib/api"
import { Property, PropertyFilters } from "@/types/property"

interface PropertyGridProps {
  initialProperties?: Property[]
}

export function PropertyGrid({ properties }: { properties: any[] }) {
  ? properties.length : 'no-array')
  if (!Array.isArray(properties)) return null
  if (properties.length === 0) {
    return <div className="text-center text-gray-500 py-10">No hay propiedades publicadas.</div>
  }
  return (
    <div
      data-debug="property-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {properties.map((p: any) => {
        const price = Number(p?.price ?? 0)
        const area = Number(p?.area ?? 0)
        return (
          <PropertyCard
            key={p.id}
            id={p.id}
            title={p.title}
            price={price}
            images={p.images}
            city={p.city}
            province={p.province}
            bedrooms={p.bedrooms}
            bathrooms={p.bathrooms}
            area={area}
            userId={p.userId}
          />
        )
      })}
    </div>
  )
}
