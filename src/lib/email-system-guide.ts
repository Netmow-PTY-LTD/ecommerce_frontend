// Email System Variable Reference
// This file documents all available variables sent by the backend for each trigger event

export interface TriggerEventVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export const TRIGGER_EVENT_VARIABLES: Record<string, TriggerEventVariable[]> = {
  order_placed: [
    { name: 'order_number', description: 'Order number (e.g., ORD-1234567890-123)', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'customer_email', description: 'Customer email address', example: 'john@example.com', required: true },
    { name: 'total', description: 'Order total amount', example: '99.99', required: true },
    { name: 'currency', description: 'Currency code', example: 'USD', required: false },
    { name: 'order_date', description: 'Order date (ISO format)', example: '2026-05-15T10:30:00.000Z', required: true },
    { name: 'items', description: 'Array of order items', example: '[{name: "Product A", quantity: 2, price: 49.99}]', required: false },
    { name: 'shipping_address', description: 'Shipping address object', example: '{ address: "123 Main St", city: "New York" }', required: false },
    { name: 'billing_address', description: 'Billing address object', example: '{ address: "123 Main St", city: "New York" }', required: false },
  ],
  order_confirmed: [
    { name: 'order_number', description: 'Order number', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'total', description: 'Order total amount', example: '99.99', required: true },
  ],
  order_shipped: [
    { name: 'order_number', description: 'Order number', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'tracking_number', description: 'Shipping tracking number', example: '1Z999AA10123456784', required: true },
    { name: 'estimated_delivery', description: 'Estimated delivery date', example: '2026-05-20', required: false },
    { name: 'carrier', description: 'Shipping carrier', example: 'FedEx', required: false },
  ],
  order_delivered: [
    { name: 'order_number', description: 'Order number', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'delivery_date', description: 'Delivery date', example: '2026-05-18', required: true },
  ],
  order_cancelled: [
    { name: 'order_number', description: 'Order number', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'reason', description: 'Cancellation reason', example: 'Out of stock', required: true },
  ],
  payment_received: [
    { name: 'order_number', description: 'Order number', example: 'ORD-1234567890-123', required: true },
    { name: 'customer_name', description: 'Customer full name', example: 'John Doe', required: true },
    { name: 'payment_amount', description: 'Payment amount', example: '99.99', required: true },
    { name: 'payment_method', description: 'Payment method', example: 'Credit Card', required: true },
    { name: 'payment_date', description: 'Payment date', example: '2026-05-15T10:30:00.000Z', required: true },
  ],
  customer_registered: [
    { name: 'name', description: 'Customer name', example: 'John Doe', required: true },
    { name: 'email', description: 'Customer email', example: 'john@example.com', required: true },
    { name: 'shop_url', description: 'URL to your shop', example: 'https://example.com/shop', required: false },
  ],
  abandoned_cart: [
    { name: 'customer_name', description: 'Customer name', example: 'John Doe', required: true },
    { name: 'item_count', description: 'Number of items in cart', example: '3', required: true },
    { name: 'cart_url', description: 'URL to recover cart', example: 'https://example.com/cart/abc123', required: true },
  ],
  low_stock: [
    { name: 'product_name', description: 'Product name', example: 'Awesome Product', required: true },
    { name: 'current_stock', description: 'Current stock level', example: '5', required: true },
    { name: 'sku', description: 'Product SKU', example: 'PROD-123', required: true },
  ],
};

export const TRIGGER_EVENT_LABELS: Record<string, string> = {
  order_placed: 'Order Placed',
  order_confirmed: 'Order Confirmed',
  order_shipped: 'Order Shipped',
  order_delivered: 'Order Delivered',
  order_cancelled: 'Order Cancelled',
  payment_received: 'Payment Received',
  customer_registered: 'Customer Registered',
  abandoned_cart: 'Abandoned Cart',
  low_stock: 'Low Stock',
};

export const getVariablesForTrigger = (triggerEvent: string): TriggerEventVariable[] => {
  return TRIGGER_EVENT_VARIABLES[triggerEvent] || [];
};

export const getRequiredVariables = (triggerEvent: string): string[] => {
  return TRIGGER_EVENT_VARIABLES[triggerEvent]?.filter(v => v.required).map(v => v.name) || [];
};

// Default templates that should exist for each trigger
export const DEFAULT_TEMPLATE_SLUGS: Record<string, string> = {
  order_placed: 'order-confirmation',
  order_confirmed: 'order-confirmation',
  order_shipped: 'order-shipped',
  order_delivered: 'order-delivered',
  order_cancelled: 'order-cancelled',
  payment_received: 'payment-received',
  customer_registered: 'welcome-email',
  abandoned_cart: 'abandoned-cart',
  low_stock: 'low-stock',
};

// Helper to check if template has all required variables
export const validateTemplateVariables = (templateVariables: string[], triggerEvent: string): { valid: boolean; missing: string[] } => {
  const required = getRequiredVariables(triggerEvent);
  const missing = required.filter(v => !templateVariables.includes(v));
  return {
    valid: missing.length === 0,
    missing,
  };
};

// Sample data for testing
export const getSampleDataForTrigger = (triggerEvent: string): Record<string, any> => {
  const samples: Record<string, Record<string, any>> = {
    order_placed: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      total: '99.99',
      currency: 'USD',
      order_date: new Date().toISOString(),
      items: [{ name: 'Sample Product', quantity: 2, price: 49.99 }],
      shipping_address: { address: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
      billing_address: { address: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
    },
    order_confirmed: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      total: '99.99',
    },
    order_shipped: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      tracking_number: '1Z999AA10123456784',
      estimated_delivery: '2026-05-20',
      carrier: 'FedEx',
    },
    order_delivered: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      delivery_date: new Date().toISOString().split('T')[0],
    },
    order_cancelled: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      reason: 'Item out of stock',
    },
    payment_received: {
      order_number: 'ORD-1234567890-123',
      customer_name: 'John Doe',
      payment_amount: '99.99',
      payment_method: 'Credit Card',
      payment_date: new Date().toISOString(),
    },
    customer_registered: {
      name: 'John Doe',
      email: 'john@example.com',
      shop_url: 'https://example.com/shop',
    },
    abandoned_cart: {
      customer_name: 'John Doe',
      item_count: '3',
      cart_url: 'https://example.com/cart/abc123',
    },
    low_stock: {
      product_name: 'Awesome Product',
      current_stock: '5',
      sku: 'PROD-123',
    },
  };

  return samples[triggerEvent] || {};
};
