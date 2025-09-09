# Property Images Migration - Implementation Plan

## Current Status
✅ **COMPLETED**: Analyzed current property detail page implementation
✅ **COMPLETED**: Created image fetching utility
✅ **COMPLETED**: Updated property detail page to use bucket images

## Analysis Summary

### Current Implementation
- **Images**: JSON string parsed from database
- **Display**: Simple 2x2 grid layout
- **Fallback**: Placeholder image on error
- **UI**: Basic grid with hover effects

### Required Changes
- **Replace JSON images with Supabase storage bucket images**
- **Convention**: `property-images/${propertyId}/${uuid}.jpg`
- **Display**: Simple carousel or grid
- **Fallback**: Use JSON images if bucket images don't exist
- **Keep**: Current UI (title, price, location, description, amenities, features, agent)
- **Maintain**: Loading states and error handling

## Implementation Plan

### 1. Create Image Fetching Utility ✅
- **Function**: `fetchPropertyImages(propertyId: string)`
- **Logic**: List files from `property-images/${propertyId}/` bucket
- **Return**: Array of public URLs
- **Fallback**: Return empty array if no images found

### 2. Update Property Detail Page ✅
- **Import**: Supabase client for storage access
- **State**: Add `bucketImages` state
- **Effect**: Fetch bucket images on component mount
- **Display**: Show bucket images first, fallback to JSON images
- **Layout**: Simple carousel/grid component

### 3. Image Display Component ✅
- **Component**: Simple image carousel/grid
- **Features**: Navigation arrows, thumbnail indicators
- **Responsive**: Mobile-friendly layout
- **Error Handling**: Fallback to placeholder

### 4. Fallback Strategy ✅
- **Primary**: Bucket images with convention
- **Secondary**: JSON images from database
- **Tertiary**: Placeholder image

## Next Steps
- Test with existing properties
- Verify fallback behavior
- Monitor performance and error handling
