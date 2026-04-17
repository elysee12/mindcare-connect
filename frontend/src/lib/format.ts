/**
 * Format patient ID to display format
 * Converts database ID to format like P001, P002, etc.
 * @param id - The patient ID from the database
 * @returns Formatted patient ID (e.g., "P001")
 */
export const formatPatientId = (id: number | string | undefined | null): string => {
  if (!id) return 'Unknown ID';
  return `P${String(id).padStart(3, '0')}`;
};
