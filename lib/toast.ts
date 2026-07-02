import { toast as sonnerToast } from "sonner";

/**
 * Standardized toast wrapper across the application.
 * All new code should import this rather than direct UI library imports.
 */
export const toast = {
  success: (message: string, options?: any) => sonnerToast.success(message, options),
  error: (message: string, options?: any) => sonnerToast.error(message, options),
  info: (message: string, options?: any) => sonnerToast.info(message, options),
  warning: (message: string, options?: any) => sonnerToast.warning(message, options),
  // For compatibility with Radix toast calls that pass an object
  custom: (options: { title?: string; description?: string; variant?: string }) => {
    if (options.variant === "destructive") {
      sonnerToast.error(options.title || "", { description: options.description });
    } else {
      sonnerToast(options.title || "", { description: options.description });
    }
  },
};
