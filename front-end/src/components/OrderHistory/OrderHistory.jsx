import React, { useEffect, useState } from "react";
import phoneImg from "../../assets/phone.webp";
import "../OrderHistory/OrderHistory.css";

// Utility to get username
function getUsername() {
  return localStorage.getItem("username");
}

// Get status badge color based on status
function getStatusColor(status) {
  switch(status?.toLowerCase()) {
    case 'delivered':
      return '#f7faf9'; // Green
    case 'pending':
      return '#f59e0b'; // Amber
    case 'cancelled':
      return '#ece5e2'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Function to fetch orders and products
  async function fetchOrdersAndProducts() {
    try {
      const username = getUsername();
      if (!username) {
        setLoading(false);
        return;
      }

      // 1. Fetch all orders from the correct API (8083)
      const orderRes = await fetch("http://localhost:8083/orders");
      const orderData = await orderRes.json();

      // 2. Filter orders by username
      const userOrders = Array.isArray(orderData)
        ? orderData.filter(o => o.username === username)
        : [];
      setOrders(userOrders);

      // 3. Fetch all product details for those orders (for names, etc)
      const productIds = [...new Set(userOrders.map(o => o.productId))];
      if (productIds.length > 0) {
        const prodRes = await fetch("http://localhost:8082/products");
        const prodData = await prodRes.json();
        const map = {};
        (Array.isArray(prodData) ? prodData : []).forEach(prod => { map[prod.id] = prod; });
        setProducts(map);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  // Auto-refresh orders every 5 seconds to sync with admin changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrdersAndProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrdersAndProducts();
    setRefreshing(false);
  };

  // Handle order cancellation with refund
  const handleCancelOrder = async (orderId, orderUsername, shippingStatus) => {
    // Check if order can be cancelled
    if (shippingStatus?.toLowerCase() === 'delivered') {
      alert("Cannot cancel delivered orders");
      return;
    }

    const reason = prompt("Enter reason for cancellation (optional):");
    if (reason === null) {
      return; // User cancelled the prompt
    }

    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`http://localhost:8083/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          username: orderUsername,
          reason: reason || ''
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        alert(data.message);
        // Refresh orders to reflect cancellation
        await fetchOrdersAndProducts();
      } else {
        alert('Cancellation failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert('Error cancelling order: ' + error.message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) return <div className="order-history-bg"><div className="order-history-loading">Loading...</div></div>;

  return (
    <div className="order-history-bg">
      <div className="order-history-container">
        <div className="order-history-header-container">
          <h2 className="order-history-title">Order History</h2>
          <button 
            className="order-refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh order status"
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
        <div className="order-history-header-row">
          <span className="oh-col-product">Product</span>
          <span className="oh-col-price">Price</span>
          <span className="oh-col-qty">Qty</span>
          <span className="oh-col-status">Status</span>
          <span className="oh-col-action">Action</span>
        </div>
        <div className="order-history-list">
          {orders.length === 0 ? (
            <div className="order-history-empty">No orders found.</div>
          ) : (
            orders.map(order => {
              const prod = products[order.productId] || {};
              const status = order.orderStatus || "Pending";
              return (
                <div className="oh-list-row" key={order.id || order.orderId}>
                  <div className="oh-prod-col">
                    <img className="oh-prod-img" src={prod.imageUrl || prod.image || phoneImg} alt={prod.name}/>
                    <div>
                      <div className="oh-prod-title">{prod.name || "Product"}</div>
                      <div className="oh-prod-variant">{prod.variant || prod.color || prod.description || ""}</div>
                    </div>
                  </div>
                  <div className="oh-price-col">
                    ₹{Number(order.totalPrice || order.price || prod.price || 0).toLocaleString()}
                  </div>
                  <div className="oh-qty-col">
                    <span>{order.quantity}</span>
                  </div>
                  <div className="oh-status-col">
                    <span 
                      className={`status-badge status-${status.toLowerCase()}`}
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="oh-action-col">
                    {status.toLowerCase() !== 'cancelled' && order.shippingStatus?.toLowerCase() !== 'delivered' ? (
                      <button
                        className="cancel-order-btn"
                        onClick={() => handleCancelOrder(order.id, order.username, order.shippingStatus)}
                        disabled={cancellingOrderId === order.id}
                        title="Cancel order and get refund to wallet"
                      >
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    ) : (
                      <span className="no-action">-</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}