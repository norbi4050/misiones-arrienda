import { NextRequest, NextResponse } from 'next/server'

interface UnfurlData {
  title?: string
  description?: string
  images: string[]
  price?: {
    amount: number
    currency: string
    period?: string
  }
  operation?: 'sale' | 'rent'
  propertyType?: string
  address?: string
  coords?: {
    lat: number
    lng: number
  }
  bedrooms?: number
  bathrooms?: number
  areaM2?: number
  features: string[]
  sourceUrl: string
  canEmbed: boolean
  importQuality: 'high' | 'medium' | 'low'
}

async function extractOpenGraph(html: string, url: string): Promise<Partial<UnfurlData>> {
  const data: Partial<UnfurlData> = {
    images: [],
    features: [],
    sourceUrl: url,
    canEmbed: false
  }

  // Extract Open Graph tags
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
  const ogDescription = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)

  if (ogTitle) data.title = ogTitle[1]
  if (ogDescription) data.description = ogDescription[1]
  if (ogImage) data.images = [ogImage[1]]

  // Extract price information
  const priceMatch = html.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/i)
  if (priceMatch) {
    data.price = {
      amount: parseFloat(priceMatch[1].replace(/,/g, '')),
      currency: 'ARS'
    }
  }

  // Extract property type
  const typeMatches = html.match(/(casa|departamento|local|oficina|terreno|ph)/gi)
  if (typeMatches) {
    data.propertyType = typeMatches[0].toLowerCase()
  }

  // Extract bedrooms/bathrooms
  const bedroomsMatch = html.match(/(\d+)\s*(dormitorio|habitacion|bedroom)/i)
  const bathroomsMatch = html.match(/(\d+)\s*(baño|bathroom)/i)
  
  if (bedroomsMatch) data.bedrooms = parseInt(bedroomsMatch[1])
  if (bathroomsMatch) data.bathrooms = parseInt(bathroomsMatch[1])

  // Extract area
  const areaMatch = html.match(/(\d+)\s*m[²2]/i)
  if (areaMatch) data.areaM2 = parseInt(areaMatch[1])

  // Check if can embed (basic check for X-Frame-Options)
  data.canEmbed = !html.includes('X-Frame-Options') && !html.includes('frame-ancestors')

  return data
}

async function extractSchemaOrg(html: string): Promise<Partial<UnfurlData>> {
  const data: Partial<UnfurlData> = {
    images: [],
    features: []
  }

  try {
    // Look for JSON-LD scripts
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>|<\/script>/gi, '')
        try {
          const jsonData = JSON.parse(jsonContent)
          
          // Handle RealEstateListing schema
          if (jsonData['@type'] === 'RealEstateListing' || jsonData.type === 'RealEstateListing') {
            if (jsonData.name) data.title = jsonData.name
            if (jsonData.description) data.description = jsonData.description
            if (jsonData.image) {
              data.images = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image]
            }
            
            // Extract price from offers
            if (jsonData.offers) {
              const offer = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers
              if (offer.price) {
                data.price = {
                  amount: parseFloat(offer.price),
                  currency: offer.priceCurrency || 'ARS'
                }
              }
            }

            // Extract property details
            if (jsonData.numberOfRooms) data.bedrooms = jsonData.numberOfRooms
            if (jsonData.numberOfBathroomsTotal) data.bathrooms = jsonData.numberOfBathroomsTotal
            if (jsonData.floorSize) data.areaM2 = jsonData.floorSize.value || jsonData.floorSize

            // Extract address
            if (jsonData.address) {
              if (typeof jsonData.address === 'string') {
                data.address = jsonData.address
              } else if (jsonData.address.streetAddress) {
                data.address = `${jsonData.address.streetAddress}, ${jsonData.address.addressLocality || ''}`
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON
          continue
        }
      }
    }
  } catch (error) {
    console.error('Error extracting Schema.org data:', error)
  }

  return data
}

async function checkOEmbed(url: string): Promise<Partial<UnfurlData> | null> {
  try {
    // Try common oEmbed endpoints
    const oembedEndpoints = [
      `https://oembed.com/providers.json`,
      // Add more oEmbed providers as needed
    ]

    // For now, return null as oEmbed is less common for real estate
    return null
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement authentication check
    // For now, mock authentication
    const isAuthenticated = true
    const userType = 'inmobiliaria'
    const hasPremiumPlan = true

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check if user is inmobiliaria
    if (userType !== 'inmobiliaria') {
      return NextResponse.json({ error: 'Solo disponible para inmobiliarias' }, { status: 403 })
    }

    // Check if user has premium plan
    if (!hasPremiumPlan) {
      return NextResponse.json({ 
        error: 'Función premium. Activá tu combo para usar esta funcionalidad.',
        requiresPremium: true 
      }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Check if URL was already used
    // TODO: Implement duplicate check in database

    let unfurlData: UnfurlData = {
      images: [],
      features: [],
      sourceUrl: url,
      canEmbed: false,
      importQuality: 'low'
    }

    try {
      // Fetch the webpage
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MisionesArrienda-Bot/1.0 (+https://misionesarrienda.com)'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()

      // Try different extraction methods in order of preference
      
      // 1. Try oEmbed first (highest quality)
      const oembedData = await checkOEmbed(url)
      if (oembedData) {
        unfurlData = { ...unfurlData, ...oembedData }
        unfurlData.importQuality = 'high'
      }

      // 2. Try Schema.org JSON-LD (high quality)
      const schemaData = await extractSchemaOrg(html)
      if (schemaData.title || schemaData.price) {
        unfurlData = { ...unfurlData, ...schemaData }
        unfurlData.importQuality = unfurlData.importQuality === 'high' ? 'high' : 'medium'
      }

      // 3. Fall back to Open Graph (medium quality)
      const ogData = await extractOpenGraph(html, url)
      unfurlData = { ...unfurlData, ...ogData }

      // Determine final quality score
      if (!unfurlData.title && !unfurlData.price) {
        unfurlData.importQuality = 'low'
      }

    } catch (error) {
      console.error('Error fetching URL:', error)
      return NextResponse.json({ 
        error: 'No pudimos obtener datos de esa URL. Completá manualmente o probá con otro enlace.',
        unfurlData: unfurlData // Return empty structure so form can be filled manually
      }, { status: 200 })
    }

    return NextResponse.json({ 
      success: true, 
      unfurlData,
      message: unfurlData.importQuality === 'high' ? 'Datos extraídos exitosamente' :
               unfurlData.importQuality === 'medium' ? 'Algunos datos extraídos. Revisá y completá lo que falte.' :
               'Pocos datos encontrados. Completá manualmente.'
    })

  } catch (error) {
    console.error('Unfurl API error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
