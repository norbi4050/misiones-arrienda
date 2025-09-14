/**
 * 🧪 TESTS UNITARIOS - UTILIDADES DE FORMATO
 */

import { formatCurrency, formatDate, formatRelativeTime } from '@/utils';

describe('Utilidades de Formato', () => {
  describe('formatCurrency', () => {
    it('debe formatear correctamente pesos argentinos', () => {
      expect(formatCurrency(150000)).toBe('$ 150.000,00');
    });

    it('debe formatear correctamente dólares', () => {
      expect(formatCurrency(1500, 'USD')).toBe('US$ 1.500,00');
    });

    it('debe manejar valores decimales', () => {
      expect(formatCurrency(150000.50)).toBe('$ 150.000,50');
    });
  });

  describe('formatDate', () => {
    it('debe formatear fecha correctamente', () => {
      const date = '2025-01-15T10:30:00Z';
      expect(formatDate(date)).toBe('15 de enero de 2025');
    });

    it('debe manejar objetos Date', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('15 de enero de 2025');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('debe mostrar "hace unos segundos" para fechas muy recientes', () => {
      const date = new Date('2025-01-15T10:29:30Z');
      expect(formatRelativeTime(date)).toBe('hace unos segundos');
    });

    it('debe mostrar minutos para fechas recientes', () => {
      const date = new Date('2025-01-15T10:25:00Z');
      expect(formatRelativeTime(date)).toBe('hace 5 minutos');
    });

    it('debe mostrar horas para fechas del mismo día', () => {
      const date = new Date('2025-01-15T08:30:00Z');
      expect(formatRelativeTime(date)).toBe('hace 2 horas');
    });

    it('debe mostrar días para fechas anteriores', () => {
      const date = new Date('2025-01-13T10:30:00Z');
      expect(formatRelativeTime(date)).toBe('hace 2 días');
    });
  });
});
