// =====================================================
// B5 - SHARE HELPER TESTS
// Tests unitarios para funciones críticas
// =====================================================

import {
  buildShareUrl,
  buildUTMParams,
  getCanonicalUrl,
  sanitizeShareText,
  normalizeShareTitle,
  normalizeShareDescription,
  isShareFeatureEnabled,
  buildWhatsAppLink,
  buildTelegramLink,
  buildFacebookLink,
  buildTwitterLink,
  buildEmailLink,
  getDeepLink,
} from '@/lib/share';

describe('B5 - Share Helper Tests', () => {
  
  // =====================================================
  // TEST 1: buildShareUrl()
  // =====================================================
  
  describe('buildShareUrl()', () => {
    it('debe generar URL correcta para propiedad con UTM params', () => {
      const result = buildShareUrl({
        entityType: 'property',
        entityId: 'test123',
        context: 'detail',
        channel: 'whatsapp',
      });

      expect(result.url).toContain('/properties/test123');
      expect(result.url).toContain('utm_source=whatsapp');
      expect(result.url).toContain('utm_medium=share');
      expect(result.url).toContain('utm_campaign=property_test123');
      expect(result.url).toContain('utm_content=detail');
    });

    it('debe generar URL correcta para inmobiliaria', () => {
      const result = buildShareUrl({
        entityType: 'agency',
        entityId: 'agency456',
        context: 'profile',
        channel: 'facebook',
      });

      expect(result.url).toContain('/inmobiliaria/agency456');
      expect(result.url).toContain('utm_source=facebook');
      expect(result.url).toContain('utm_campaign=agency_agency456');
      expect(result.url).toContain('utm_content=profile');
    });

    it('debe incluir custom params si se proveen', () => {
      const result = buildShareUrl({
        entityType: 'property',
        entityId: 'test123',
        context: 'card',
        channel: 'telegram',
        customParams: {
          ref: 'promo2025',
          discount: '10',
        },
      });

      expect(result.url).toContain('ref=promo2025');
      expect(result.url).toContain('discount=10');
    });

    it('debe validar URL si validateUrl es true', () => {
      expect(() => {
        buildShareUrl(
          {
            entityType: 'property',
            entityId: 'test123',
            context: 'detail',
            channel: 'whatsapp',
          },
          {
            validateUrl: true,
          }
        );
      }).not.toThrow();
    });
  });

  // =====================================================
  // TEST 2: Deeplinks
  // =====================================================
  
  describe('Deeplinks', () => {
    const testUrl = 'http://localhost:3000/properties/123?utm_source=whatsapp&utm_medium=share';
    const testText = 'Casa 3 dorm en Posadas';

    it('buildWhatsAppLink debe generar deeplink correcto', () => {
      const link = buildWhatsAppLink(testText, testUrl);
      
      expect(link).toContain('https://wa.me/');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link)).toContain(testText);
      expect(decodeURIComponent(link)).toContain(testUrl);
    });

    it('buildTelegramLink debe generar deeplink correcto', () => {
      const link = buildTelegramLink(testText, testUrl);
      
      expect(link).toContain('https://t.me/share/url');
      expect(link).toContain('url=');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link)).toContain(testUrl);
    });

    it('buildFacebookLink debe generar deeplink correcto', () => {
      const link = buildFacebookLink(testUrl);
      
      expect(link).toContain('https://www.facebook.com/sharer/sharer.php');
      expect(link).toContain('u=');
      expect(decodeURIComponent(link)).toContain(testUrl);
    });

    it('buildTwitterLink debe generar deeplink correcto', () => {
      const link = buildTwitterLink(testText, testUrl);
      
      expect(link).toContain('https://twitter.com/intent/tweet');
      expect(link).toContain('url=');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link)).toContain(testText);
    });

    it('buildEmailLink debe generar mailto correcto', () => {
      const link = buildEmailLink('Subject Test', 'Body Test', testUrl);
      
      expect(link).toContain('mailto:');
      expect(link).toContain('subject=');
      expect(link).toContain('body=');
      expect(decodeURIComponent(link)).toContain('Subject Test');
      expect(decodeURIComponent(link)).toContain('Body Test');
      expect(decodeURIComponent(link)).toContain(testUrl);
    });

    it('getDeepLink debe retornar el deeplink correcto según canal', () => {
      const whatsapp = getDeepLink('whatsapp', testText, testUrl);
      expect(whatsapp).toContain('wa.me');

      const telegram = getDeepLink('telegram', testText, testUrl);
      expect(telegram).toContain('t.me');

      const facebook = getDeepLink('facebook', testText, testUrl);
      expect(facebook).toContain('facebook.com');

      const x = getDeepLink('x', testText, testUrl);
      expect(x).toContain('twitter.com');

      const email = getDeepLink('email', testText, testUrl, 'Test Subject');
      expect(email).toContain('mailto:');

      const copy = getDeepLink('copy', testText, testUrl);
      expect(copy).toBe(testUrl);
    });
  });

  // =====================================================
  // TEST 3: Sanitización
  // =====================================================
  
  describe('Sanitización de Textos', () => {
    it('sanitizeShareText debe remover HTML tags', () => {
      const dirty = '<p>Casa <strong>linda</strong> con <script>alert("xss")</script></p>';
      const clean = sanitizeShareText(dirty);
      
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).toBe('Casa linda con');
    });

    it('sanitizeShareText debe remover múltiples espacios', () => {
      const dirty = 'Casa    con    muchos    espacios';
      const clean = sanitizeShareText(dirty);
      
      expect(clean).toBe('Casa con muchos espacios');
    });

    it('sanitizeShareText debe remover caracteres especiales problemáticos', () => {
      const dirty = 'Casa {con} [caracteres] <especiales>';
      const clean = sanitizeShareText(dirty);
      
      expect(clean).not.toContain('{');
      expect(clean).not.toContain('}');
      expect(clean).not.toContain('[');
      expect(clean).not.toContain(']');
    });

    it('normalizeShareTitle debe recortar títulos largos', () => {
      const longTitle = 'A'.repeat(150);
      const normalized = normalizeShareTitle(longTitle, 100);
      
      expect(normalized.length).toBeLessThanOrEqual(100);
      expect(normalized).toContain('...');
    });

    it('normalizeShareTitle no debe modificar títulos cortos', () => {
      const shortTitle = 'Casa linda';
      const normalized = normalizeShareTitle(shortTitle, 100);
      
      expect(normalized).toBe(shortTitle);
    });

    it('normalizeShareDescription debe recortar en el último espacio', () => {
      const longDesc = 'Casa muy linda con muchos ambientes y espacios verdes en el centro de la ciudad de Posadas con vista al río Paraná y cerca de todos los servicios necesarios para una vida cómoda y tranquila en familia';
      const normalized = normalizeShareDescription(longDesc, 100);
      
      expect(normalized.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(normalized).toContain('...');
      // Debe recortar en un espacio, no en medio de palabra
      expect(normalized).not.toMatch(/\w\.\.\.$/);
    });
  });

  // =====================================================
  // TEST 4: Feature Flag
  // =====================================================
  
  describe('Feature Flag', () => {
    it('isShareFeatureEnabled debe retornar boolean', () => {
      const enabled = isShareFeatureEnabled();
      
      expect(typeof enabled).toBe('boolean');
    });

    // Nota: El valor real depende de process.env.FEATURE_SHARE
    // En tests, podemos mockearlo si es necesario
  });

  // =====================================================
  // TEST 5: Canonical URLs
  // =====================================================
  
  describe('getCanonicalUrl()', () => {
    it('debe generar URL canónica para propiedad', () => {
      const url = getCanonicalUrl('property', 'abc123');
      
      expect(url).toContain('/properties/abc123');
      expect(url).toMatch(/^https?:\/\//); // Debe ser URL absoluta
    });

    it('debe generar URL canónica para inmobiliaria', () => {
      const url = getCanonicalUrl('agency', 'xyz789');
      
      expect(url).toContain('/inmobiliaria/xyz789');
      expect(url).toMatch(/^https?:\/\//);
    });

    it('debe remover trailing slash del baseUrl', () => {
      const url = getCanonicalUrl(
        'property',
        'test123',
        { siteUrl: 'http://example.com/' }
      );
      
      expect(url).not.toContain('//properties');
      expect(url).toBe('http://example.com/properties/test123');
    });

    it('debe usar siteUrl de options si se provee', () => {
      const url = getCanonicalUrl(
        'property',
        'test123',
        { siteUrl: 'https://custom-domain.com' }
      );
      
      expect(url).toContain('https://custom-domain.com');
    });
  });

  // =====================================================
  // TEST 6: UTM Params
  // =====================================================
  
  describe('buildUTMParams()', () => {
    it('debe construir UTM params correctos para propiedad', () => {
      const params = buildUTMParams({
        entityType: 'property',
        entityId: 'prop123',
        context: 'detail',
        channel: 'whatsapp',
      });

      expect(params).toEqual({
        utm_source: 'whatsapp',
        utm_medium: 'share',
        utm_campaign: 'property_prop123',
        utm_content: 'detail',
      });
    });

    it('debe construir UTM params correctos para inmobiliaria', () => {
      const params = buildUTMParams({
        entityType: 'agency',
        entityId: 'agency456',
        context: 'profile',
        channel: 'facebook',
      });

      expect(params).toEqual({
        utm_source: 'facebook',
        utm_medium: 'share',
        utm_campaign: 'agency_agency456',
        utm_content: 'profile',
      });
    });

    it('debe usar utm_medium=share siempre', () => {
      const params = buildUTMParams({
        entityType: 'property',
        entityId: 'test',
        context: 'card',
        channel: 'telegram',
      });

      expect(params.utm_medium).toBe('share');
    });
  });

  // =====================================================
  // TEST 7: Edge Cases
  // =====================================================
  
  describe('Edge Cases', () => {
    it('debe manejar IDs con caracteres especiales', () => {
      const result = buildShareUrl({
        entityType: 'property',
        entityId: 'test-123_abc',
        context: 'detail',
        channel: 'whatsapp',
      });

      expect(result.url).toContain('test-123_abc');
    });

    it('debe manejar textos vacíos en sanitización', () => {
      const clean = sanitizeShareText('');
      expect(clean).toBe('');
    });

    it('debe manejar null/undefined en sanitización', () => {
      const clean1 = sanitizeShareText(null);
      const clean2 = sanitizeShareText(undefined);
      
      expect(clean1).toBe('');
      expect(clean2).toBe('');
    });

    it('debe manejar todos los canales válidos', () => {
      const channels = ['whatsapp', 'telegram', 'facebook', 'x', 'email', 'copy', 'direct'];
      
      channels.forEach(channel => {
        const result = buildShareUrl({
          entityType: 'property',
          entityId: 'test',
          context: 'detail',
          channel,
        });

        expect(result.url).toBeTruthy();
        expect(result.utmParams.utm_source).toBe(channel);
      });
    });

    it('debe manejar todos los contextos válidos', () => {
      const contexts = ['card', 'detail', 'profile'];
      
      contexts.forEach(context => {
        const result = buildShareUrl({
          entityType: 'property',
          entityId: 'test',
          context,
          channel: 'whatsapp',
        });

        expect(result.url).toBeTruthy();
        expect(result.utmParams.utm_content).toBe(context);
      });
    });
  });

  // =====================================================
  // TEST 8: Integración de Funciones
  // =====================================================
  
  describe('Integración de Funciones', () => {
    it('debe construir flujo completo de compartir por WhatsApp', () => {
      // 1. Construir URL con UTM
      const shareUrl = buildShareUrl({
        entityType: 'property',
        entityId: 'abc123',
        context: 'detail',
        channel: 'whatsapp',
      });

      // 2. Sanitizar título
      const title = normalizeShareTitle('<p>Casa <strong>3 dorm</strong></p>');

      // 3. Construir deeplink
      const deeplink = buildWhatsAppLink(title, shareUrl.url);

      // Validaciones
      expect(shareUrl.url).toContain('utm_source=whatsapp');
      expect(title).not.toContain('<');
      expect(deeplink).toContain('wa.me');
      expect(decodeURIComponent(deeplink)).toContain(shareUrl.url);
    });

    it('debe construir flujo completo de compartir por Email', () => {
      // 1. Construir URL
      const shareUrl = buildShareUrl({
        entityType: 'agency',
        entityId: 'xyz789',
        context: 'profile',
        channel: 'email',
      });

      // 2. Sanitizar textos
      const subject = normalizeShareTitle('Inmobiliaria XYZ en Posadas');
      const body = normalizeShareDescription('Te recomiendo esta inmobiliaria...');

      // 3. Construir mailto
      const mailto = buildEmailLink(subject, body, shareUrl.url);

      // Validaciones
      expect(mailto).toContain('mailto:');
      expect(mailto).toContain('subject=');
      expect(mailto).toContain('body=');
      expect(decodeURIComponent(mailto)).toContain(shareUrl.url);
    });
  });
});
