const fetch = require('node-fetch');

async function testPropertyCreation() {
  const propertyData = {
    title: "Casa Moderna en Posadas Centro",
    description: "Hermosa casa moderna de 3 dormitorios en el corazón de Posadas.",
    price: 250000,
    currency: "ARS",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    address: "Av. Mitre 1234",
    city: "Posadas",
    province: "Misiones",
    country: "Argentina",
    postalCode: "3300",
    propertyType: "HOUSE",
    status: "PUBLISHED",
    images: ["/placeholder-house-1.jpg", "/placeholder-house-2.jpg"],
    amenities: ["garage", "garden"],
    features: ["security", "balcony"],
    contact_name: "Juan Pérez",
    contact_phone: "3764123456",
    contact_email: "juan@example.com",
    userId: "seed-user",
    agentId: "seed-agent"
  };

  try {
    const response = await fetch('http://localhost:3000/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      console.error('Validation errors:', result.details);
      return;
    }

    console.log('Success:', result);
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testPropertyCreation();
