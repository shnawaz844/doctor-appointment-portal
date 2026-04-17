/**
 * Formats a phone number with a +91 prefix for Indian mobile numbers.
 * 
 * Logic:
 * 1. Remove all non-digit characters.
 * 2. If the result is 10 digits, prepend +91.
 * 3. If the result is 12 digits and starts with 91, prepend +.
 * 4. Otherwise, return the original string (or formatted result if 12+ digits).
 * 
 * @param phone The phone number string to format
 * @returns The formatted phone number with +91 prefix
 */
export function formatPhoneWithPrefix(phone: string | null | undefined): string {
    if (!phone) return "";
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");
    
    // 10 digits -> +91XXXXXXXXXX
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    
    // 12 digits and starts with 91 -> +91XXXXXXXXXX
    if (digits.length === 12 && digits.startsWith("91")) {
        return `+${digits}`;
    }
    
    // If it already starts with +, and has digits, just keep it but maybe clean it?
    // For now, if it doesn't match the 10/12 digit pattern, return the cleaned version if it looks like a phone number
    if (digits.length > 10) {
        return `+${digits}`;
    }

    return phone;
}
