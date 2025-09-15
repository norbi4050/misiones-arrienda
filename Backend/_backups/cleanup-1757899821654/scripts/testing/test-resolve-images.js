// Test completo para la nueva función resolveImages resiliente
const { resolveImages } = require('./src/lib/propertyImages/resolveImages.ts');

console.log('=== Test 1: Arrays normales ===');
const test1 = resolveImages({
  apiImages: ['api1.jpg', 'api2.jpg'],
  bucketImages: ['bucket1.jpg', 'bucket2.jpg']
});
console.log('Resultado:', test1);
// Expected: ['bucket1.jpg', 'bucket2.jpg', 'api1.jpg', 'api2.jpg']

console.log('\n=== Test 2: Solo bucketImages ===');
const test2 = resolveImages({
  apiImages: [],
  bucketImages: ['bucket1.jpg', 'bucket2.jpg']
});
console.log('Resultado:', test2);
// Expected: ['bucket1.jpg', 'bucket2.jpg']

console.log('\n=== Test 3: Solo apiImages ===');
const test3 = resolveImages({
  apiImages: ['api1.jpg', 'api2.jpg'],
  bucketImages: []
});
console.log('Resultado:', test3);
// Expected: ['api1.jpg', 'api2.jpg']

console.log('\n=== Test 4: Con duplicados ===');
const test4 = resolveImages({
  apiImages: ['api1.jpg', 'bucket1.jpg'],
  bucketImages: ['bucket1.jpg', 'bucket2.jpg']
});
console.log('Resultado:', test4);
// Expected: ['bucket1.jpg', 'bucket2.jpg', 'api1.jpg']

console.log('\n=== Test 5: Arrays vacíos ===');
const test5 = resolveImages({
  apiImages: [],
  bucketImages: []
});
console.log('Resultado:', test5);
// Expected: []

console.log('\n=== Test 6: apiImages undefined ===');
const test6 = resolveImages({
  apiImages: undefined,
  bucketImages: ['bucket1.jpg']
});
console.log('Resultado:', test6);
// Expected: ['bucket1.jpg']

console.log('\n=== Test 7: bucketImages null ===');
const test7 = resolveImages({
  apiImages: ['api1.jpg'],
  bucketImages: null
});
console.log('Resultado:', test7);
// Expected: ['api1.jpg']

console.log('\n=== Test 8: Ambos undefined ===');
const test8 = resolveImages({
  apiImages: undefined,
  bucketImages: undefined
});
console.log('Resultado:', test8);
// Expected: []

console.log('\n=== Test 9: apiImages como objeto ===');
const test9 = resolveImages({
  apiImages: { url: 'api1.jpg' },
  bucketImages: ['bucket1.jpg']
});
console.log('Resultado:', test9);
// Expected: ['bucket1.jpg']

console.log('\n=== Test 10: bucketImages como string ===');
const test10 = resolveImages({
  apiImages: ['api1.jpg'],
  bucketImages: 'bucket1.jpg'
});
console.log('Resultado:', test10);
// Expected: ['bucket1.jpg', 'api1.jpg']

console.log('\n=== Test 11: Arrays con valores no string ===');
const test11 = resolveImages({
  apiImages: ['api1.jpg', 123, null, undefined],
  bucketImages: ['bucket1.jpg', true, '']
});
console.log('Resultado:', test11);
// Expected: ['bucket1.jpg', 'api1.jpg']

console.log('\n=== Test 12: Strings con espacios ===');
const test12 = resolveImages({
  apiImages: ['  api1.jpg  ', 'api2.jpg'],
  bucketImages: ['bucket1.jpg  ', '  ']
});
console.log('Resultado:', test12);
// Expected: ['bucket1.jpg', 'api1.jpg', 'api2.jpg']
