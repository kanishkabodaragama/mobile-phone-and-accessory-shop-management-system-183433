 // Convenience aggregator for API helpers across domains.
 // Ensures consistent imports like: import { products, sales } from '.../lib/api';
 
 export { default as auth } from './auth';
 export { default as customers } from './customers';
 export { default as products } from './products';
 export { default as reports } from './reports';
 export { default as sales } from './sales';
 export { default as services } from './services';
 export { default as settings } from './settings';
 export { default as warranties } from './warranties';
 
 // Also re-export named helpers for convenience
 export * from './auth';
 export * from './customers';
 export * from './products';
 export * from './reports';
 export * from './sales';
 export * from './services';
 export * from './settings';
 export * from './warranties';
