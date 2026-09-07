/**
 * Pre-configured authentic Indian restaurant sample bills (₹ INR)
 * For 1-click evaluation and demo reliability.
 */

export const SAMPLE_BILLS_DATA = {
  punjab_grill: {
    id: 'punjab_grill',
    restaurant_name: 'Punjab Grill & Bar',
    currency: '₹',
    items: [
      { id: 'item_1', name: 'Butter Chicken', quantity: 1, unit_price: 580, total: 580, confidence: 0.98 },
      { id: 'item_2', name: 'Paneer Butter Masala', quantity: 1, unit_price: 480, total: 480, confidence: 0.97 },
      { id: 'item_3', name: 'Dal Makhani', quantity: 1, unit_price: 420, total: 420, confidence: 0.99 },
      { id: 'item_4', name: 'Butter Garlic Naan', quantity: 4, unit_price: 90, total: 360, confidence: 0.95 },
      { id: 'item_5', name: 'Jeera Rice', quantity: 2, unit_price: 210, total: 420, confidence: 0.96 },
      { id: 'item_6', name: 'Fresh Lime Soda', quantity: 3, unit_price: 140, total: 420, confidence: 0.94 },
      { id: 'item_7', name: 'Gulab Jamun with Ice Cream', quantity: 2, unit_price: 180, total: 360, confidence: 0.96 },
    ],
    subtotal: 3040.0,
    tax: 152.0, // 5% GST (2.5% CGST + 2.5% SGST)
    service_charge: 152.0, // 5% Service Charge
    discount: 200.0, // Zomato Gold Discount
    total: 3144.0,
    confidence: {
      restaurant_name: 0.98,
      currency: 1.0,
      subtotal: 0.97,
      tax: 0.96,
      service_charge: 0.94,
      discount: 0.98,
      total: 0.99,
      overall: 0.97,
    },
    notes: 'Punjab Grill, BKC Mumbai. GST @ 5% (CGST 2.5% + SGST 2.5%).',
    tag: 'Feast & North Indian',
    location: 'Bandra Kurla Complex, Mumbai',
  },
  social_cafe: {
    id: 'social_cafe',
    restaurant_name: 'Social Cafe & Lounge',
    currency: '₹',
    items: [
      { id: 'item_1', name: 'Loaded Nachos Grande', quantity: 1, unit_price: 395, total: 395, confidence: 0.98 },
      { id: 'item_2', name: 'Peri Peri Chicken Tikka', quantity: 2, unit_price: 440, total: 880, confidence: 0.96 },
      { id: 'item_3', name: 'Truffle Mushroom Pasta', quantity: 1, unit_price: 495, total: 495, confidence: 0.95 },
      { id: 'item_4', name: 'Classic Margherita Pizza', quantity: 1, unit_price: 480, total: 480, confidence: 0.97 },
      { id: 'item_5', name: 'LIIT Pitcher', quantity: 1, unit_price: 1250, total: 1250, confidence: 0.99 },
      { id: 'item_6', name: 'Virgin Mojito', quantity: 2, unit_price: 220, total: 440, confidence: 0.94 },
    ],
    subtotal: 3940.0,
    tax: 197.0, // 5% GST
    service_charge: 394.0, // 10% Service charge
    discount: 0.0,
    total: 4531.0,
    confidence: {
      restaurant_name: 0.99,
      currency: 1.0,
      subtotal: 0.98,
      tax: 0.96,
      service_charge: 0.95,
      discount: 1.0,
      total: 0.99,
      overall: 0.98,
    },
    notes: 'Social Indiranagar, Bengaluru. Weekend night out.',
    tag: 'Drinks & Casual Dining',
    location: 'Indiranagar, Bengaluru',
  },
  saravana_bhavan: {
    id: 'saravana_bhavan',
    restaurant_name: 'Saravana Bhavan',
    currency: '₹',
    items: [
      { id: 'item_1', name: 'Special Ghee Masala Dosa', quantity: 2, unit_price: 160, total: 320, confidence: 0.99 },
      { id: 'item_2', name: 'Idli Vada Combo', quantity: 2, unit_price: 120, total: 240, confidence: 0.98 },
      { id: 'item_3', name: 'Rava Kesari', quantity: 1, unit_price: 90, total: 90, confidence: 0.97 },
      { id: 'item_4', name: 'Degree Filter Coffee', quantity: 3, unit_price: 60, total: 180, confidence: 0.99 },
    ],
    subtotal: 830.0,
    tax: 41.50, // 5% GST
    service_charge: 0.0,
    discount: 0.0,
    total: 871.50,
    confidence: {
      restaurant_name: 0.99,
      currency: 1.0,
      subtotal: 0.99,
      tax: 0.98,
      service_charge: 1.0,
      discount: 1.0,
      total: 0.99,
      overall: 0.99,
    },
    notes: 'Connaught Place, New Delhi. Morning Breakfast.',
    tag: 'Breakfast & South Indian',
    location: 'Connaught Place, New Delhi',
  },
};
