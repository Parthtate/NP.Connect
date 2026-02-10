// Date formatting utility
export const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

// For CSV export - returns DD-MM-YYYY format to avoid ## in Excel
export const formatDateForCSV = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
};

// For longer display format (e.g., "Monday, 09 February 2026")
export const formatDateLong = (dateStr: string | Date): string =>  {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: '2-digit' 
  });
};
