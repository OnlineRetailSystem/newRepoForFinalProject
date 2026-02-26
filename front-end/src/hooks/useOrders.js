import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing orders data with auto-refresh capability
 * @param {string} username - Username to filter orders by (optional)
 * @param {number} refreshInterval - Interval in ms for auto-refresh (default: 5000)
 * @returns {Object} Orders state object with fetch methods
 */
export function useOrders(username = null, refreshInterval = 5000) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Main fetch function
  const fetchOrdersAndProducts = useCallback(async () => {
    try {
      const isRefreshing = loading === false; // Check if this is a refresh
      if (isRefreshing) setRefreshing(true);

      // 1. Fetch orders
      const orderRes = await fetch("http://localhost:8083/orders");
      if (!orderRes.ok) throw new Error("Failed to fetch orders");
      const orderData = await orderRes.json();

      // 2. Filter by username if provided
      let userOrders = Array.isArray(orderData) ? orderData : [orderData];
      if (username) {
        userOrders = userOrders.filter(o => o.username === username);
      }

      setOrders(userOrders);

      // 3. Fetch all product details
      const productIds = [...new Set(userOrders.map(o => o.productId))];
      if (productIds.length > 0) {
        const prodRes = await fetch("http://localhost:8082/products");
        if (!prodRes.ok) throw new Error("Failed to fetch products");
        const prodData = await prodRes.json();
        
        const map = {};
        (Array.isArray(prodData) ? prodData : []).forEach(prod => {
          map[prod.id] = prod;
        });
        setProducts(map);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  // Initial fetch
  useEffect(() => {
    fetchOrdersAndProducts();
  }, [username, fetchOrdersAndProducts]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(fetchOrdersAndProducts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchOrdersAndProducts]);

  return {
    orders,
    products,
    loading,
    refreshing,
    error,
    refetch: fetchOrdersAndProducts,
  };
}

/**
 * Utility function to update order status
 * @param {number} orderId - Order ID
 * @param {string} newStatus - New status value
 * @returns {Promise<boolean>} Success status
 */
export async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`http://localhost:8083/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: newStatus }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update order status: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
}

/**
 * Utility function to delete an order
 * @param {number} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteOrder(orderId) {
  try {
    const res = await fetch(`http://localhost:8083/orders/${orderId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Failed to delete order: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    return false;
  }
}
