// First, add Zod to your project dependencies
// npm install zod

// Create a new file: resources/js/lib/formSchema.js
import { z } from "zod";

// Define validation schema using Zod
export const placeSchema = z.object({
  placeName: z
    .string()
    .min(1, { message: "Place name is required" })
    .max(255, { message: "Place name must be less than 255 characters" }),
  placeBusinessStatus: z.string().nullable().optional(),
  placeStatus: z.string().min(1, { message: "Status is required" }).max(100, {
    message: "Source must be less than 50 characters",
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
        formattedErrors[field] = err.message;
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