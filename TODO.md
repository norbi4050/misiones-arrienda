  WhatsApp & SEO Improvements - TODO

## Phase 1: Fix WhatsApp Phone Normalization ✅ COMPLETED
- [x] Create phone normalization utility function for Argentina format
- [x] Modify WhatsAppPropertyButton to accept and use agent phone
- [x] Update property detail client to pass agent phone
- [x] Phone normalization logic implemented with Argentina format

## Phase 2: SEO Technical Enhancements ✅ COMPLETED
- [x] Update robots.ts (already good)
- [x] Update sitemap.ts (already includes properties)
- [x] Add meta tags to key pages (properties, profiles, publicar)

## Phase 3: Anti-spam for "Publicar" Form
- [ ] Add reCAPTCHA v3 or hCaptcha integration
- [ ] Server-side validation in API route

## Phase 4: Accessibility & UX Improvements
- [ ] Add alt attributes to images
- [ ] Improve focus visibility
- [ ] Mobile-first CTA positioning

## Phase 5: Performance Optimizations
- [ ] Implement next/image with proper sizes and priority
- [ ] Add ISR/cache where applicable

## Current Status: Phases 1 & 2 Complete! Critical-path testing completed.

### Phase 1 Results:
✅ WhatsApp phone normalization implemented
✅ Argentina phone format: +54 + 9 if mobile + area code without 0 + number without 15
✅ Fallback to Misiones Arrienda number if agent phone invalid
✅ Personalized messages with agent name and property title
✅ Proper target="_blank" rel="noopener noreferrer" attributes

### Phase 2 Results:
✅ Properties page enhanced with comprehensive SEO metadata
✅ Profiles page restructured with server/client components and SEO metadata
✅ Open Graph and Twitter card support added
✅ Canonical URLs implemented
✅ Argentina locale and proper site naming
