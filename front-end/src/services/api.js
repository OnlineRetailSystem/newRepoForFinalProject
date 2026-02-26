// src/services/api.js
export const ORDER_SERVICE_BASE_URL = 'http://localhost:8083';
export const PRODUCT_SERVICE_BASE_URL = 'http://localhost:8082';

export const endpoints = {
  ordersCountByStatus: `${ORDER_SERVICE_BASE_URL}/orders/countbystatus`, // -> [{ "status": "Pending", "count": 1 }]
  productsCountByCategory: `${PRODUCT_SERVICE_BASE_URL}/products/countbycategory`, // -> [["Laptop", 3], ...]
};
