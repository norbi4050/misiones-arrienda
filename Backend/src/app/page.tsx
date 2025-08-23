import { HeroSection } from '@/components/hero-section'
import { PropertyGrid } from '@/components/property-grid'
import { StatsSection } from '@/components/stats-section'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <section id="propiedades">
        <PropertyGrid />
      </section>
    </main>
  )
}
