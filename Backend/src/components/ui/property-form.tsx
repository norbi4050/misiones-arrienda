import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';

interface PropertyFormProps {
  initialData: any;
  onSubmit: (data: any) => void;
  loading: boolean;
}

const propertyTypes = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'land', label: 'Terreno' },
  // agregar más tipos según sea necesario
];

const operationTypes = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'sale', label: 'Venta' },
];

export default function PropertyForm({ initialData, onSubmit, loading }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'ARS',
    city: '',
    province: '',
    address: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    garages: '',
    area: '',
    lotArea: '',
    operationType: '',
    status: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        price: initialData.price?.toString() || '',
        currency: initialData.currency || 'ARS',
        city: initialData.city || '',
        province: initialData.province || '',
        address: initialData.address || '',
        propertyType: initialData.propertyType || '',
        bedrooms: initialData.bedrooms?.toString() || '',
        bathrooms: initialData.bathrooms?.toString() || '',
        garages: initialData.garages?.toString() || '',
        area: initialData.area?.toString() || '',
        lotArea: initialData.lotArea?.toString() || '',
        operationType: initialData.operationType || '',
        status: initialData.status || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    if (!formData.title || !formData.price || !formData.city || !formData.province) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" name="title" value={formData.title} onChange={handleChange} required />
      <Textarea label="Descripción" name="description" value={formData.description} onChange={handleChange} />
      <Input label="Precio" name="price" type="number" value={formData.price} onChange={handleChange} required />
      <Input label="Moneda" name="currency" value={formData.currency} onChange={handleChange} />
      <Input label="Ciudad" name="city" value={formData.city} onChange={handleChange} required />
      <Input label="Provincia" name="province" value={formData.province} onChange={handleChange} required />
      <Input label="Dirección" name="address" value={formData.address} onChange={handleChange} />
      <Select label="Tipo de propiedad" name="propertyType" value={formData.propertyType} onChange={handleChange} options={propertyTypes} />
      <Input label="Dormitorios" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} />
      <Input label="Baños" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} />
      <Input label="Garajes" name="garages" type="number" value={formData.garages} onChange={handleChange} />
      <Input label="Área" name="area" type="number" value={formData.area} onChange={handleChange} />
      <Input label="Área del lote" name="lotArea" type="number" value={formData.lotArea} onChange={handleChange} />
      <Select label="Tipo de operación" name="operationType" value={formData.operationType} onChange={handleChange} options={operationTypes} />
      <Input label="Estado" name="status" value={formData.status} onChange={handleChange} />
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
