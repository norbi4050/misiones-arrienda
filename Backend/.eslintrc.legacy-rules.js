/**
 * Reglas ESLint adicionales para prevenir imports desde /legacy
 * Estas reglas deben agregarse al .eslintrc.js principal del proyecto
 */

module.exports = {
  rules: {
    // Prohibir imports desde carpeta /legacy
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/legacy/**', '../legacy/**', './legacy/**', '/legacy/**'],
            message: 'Imports desde /legacy están prohibidos. Usar las versiones actuales de los componentes.'
          },
          {
            group: ['**/property-images/**'],
            message: 'Imports desde property-images están deprecados. Usar signed-urls.ts en su lugar.'
          }
        ]
      }
    ],
    
    // Prohibir requires desde /legacy
    'no-restricted-modules': [
      'error',
      {
        patterns: [
          {
            group: ['**/legacy/**'],
            message: 'Requires desde /legacy están prohibidos. Usar las versiones actuales.'
          }
        ]
      }
    ]
  }
};
