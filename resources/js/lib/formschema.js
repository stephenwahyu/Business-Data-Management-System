// Updated file: resources/js/lib/formschema.js
import { z } from "zod";
import { validatePekanbaruLocation } from "./pekanbaruBoundaries";

// Define validation schema using Zod with Pekanbaru boundary validation
export const placeSchema = z.object({
  placeName: z
    .string()
    .min(1, { message: "Place name is required" })
    .max(255, { message: "Place name must be less than 255 characters" }),
  placeBusinessStatus: z.string().nullable().optional(),
  placeStatus: z.string().min(1, { message: "Status is required" }).max(100, {
    message: "Status must be less than 100 characters",
  }),
  placeAddress: z.string().nullable().optional(),
  placeDistrict: z.string().nullable().optional(),
  placeTypes: z.string().nullable().optional(),
  placeLatitude: z
    .string()
    .min(1, { message: "Latitude is required" })
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Latitude must be a valid number",
    })
    .refine(val => parseFloat(val) >= -90 && parseFloat(val) <= 90, {
      message: "Latitude must be between -90 and 90",
    }),
  placeLongitude: z
    .string()
    .min(1, { message: "Longitude is required" })
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Longitude must be a valid number",
    })
    .refine(val => parseFloat(val) >= -180 && parseFloat(val) <= 180, {
      message: "Longitude must be between -180 and 180",
    }),
  placeCategory: z
    .string()
    .min(1, { message: "Category is required" })
    .max(100, { message: "Category must be less than 100 characters" }),
  description: z.string().nullable().optional(),
  source: z.string().min(1, { message: "Source is required" }).max(50, {
    message: "Source must be less than 50 characters",
  }),
})
.refine(data => {
  // Validate that coordinates are within Pekanbaru boundaries
  const lat = parseFloat(data.placeLatitude);
  const lng = parseFloat(data.placeLongitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return true; // Let individual field validation handle this
  }
  
  const validation = validatePekanbaruLocation(lat, lng);
  return validation.valid;
}, {
  message: "Location must be within Pekanbaru city boundaries",
  path: ["placeLatitude"] // This will show the error on the latitude field
});

// A utility function to validate form data with Zod
export function validateForm(data, schema = placeSchema) {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, errors: {} };
  } catch (error) {
    const formattedErrors = {};
    if (error.errors) {
      error.errors.forEach(err => {
        const field = err.path[0];
        // Handle location validation errors specially
        if (err.message.includes("Pekanbaru city boundaries")) {
          const lat = parseFloat(data.placeLatitude);
          const lng = parseFloat(data.placeLongitude);
          const locationValidation = validatePekanbaruLocation(lat, lng);
          formattedErrors[field] = locationValidation.details || err.message;
        } else {
          formattedErrors[field] = err.message;
        }
      });
    }
    return { success: false, data: null, errors: formattedErrors };
  }
}

// Helper to merge Laravel validation errors with Zod errors
export function mergeValidationErrors(zodErrors, laravelErrors) {
  const mergedErrors = { ...zodErrors };
  
  // Add Laravel errors that weren't caught by Zod
  if (laravelErrors) {
    Object.keys(laravelErrors).forEach(key => {
      if (!mergedErrors[key]) {
        mergedErrors[key] = Array.isArray(laravelErrors[key]) 
          ? laravelErrors[key][0] 
          : laravelErrors[key];
      }
    });
  }
  
  return mergedErrors;
}

// Additional utility function to validate coordinates specifically for Pekanbaru
export function validateCoordinatesForPekanbaru(lat, lng) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  
  if (isNaN(numLat) || isNaN(numLng)) {
    return {
      valid: false,
      error: "Invalid coordinates"
    };
  }
  
  return validatePekanbaruLocation(numLat, numLng);
}