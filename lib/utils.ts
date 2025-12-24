import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMalaysianPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with '0', replace with '60'
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  }
  // If it doesn't start with '60' but is a valid length (e.g. 175101003), assume formatting needed or leave as is if unsure.
  // Ideally, valid MY numbers are 9-10 digits without prefix, so 11-12 with 60.
  // But safest is just handling the leading 0 case which is most common user input.

  return cleaned;
}
