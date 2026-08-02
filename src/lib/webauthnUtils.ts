export const rpName = 'Cricket Delivery';
export const rpID = process.env.NODE_ENV === 'production' 
  ? new URL(process.env.VITE_APP_URL || 'http://localhost:3000').hostname 
  : 'localhost';
export const origin = process.env.NODE_ENV === 'production'
  ? (process.env.VITE_APP_URL || `https://${rpID}`)
  : `http://${rpID}:3000`;
