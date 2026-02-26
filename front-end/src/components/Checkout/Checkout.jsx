import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from '../Navbar/Navbar';

function getUsername() {
  return localStorage.getItem("username");
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // 'amount' is in paise/cents; show in rupees
  const amount = location.state?.amount ?? 0;
  const total = typeof amount === "number" ? (amount / 100) : 0;

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const username = getUsername();
        if (!username) {
          setLoading(false);
          return;
        }
        const response = await fetch(`http://localhost:8081/wallets/${username}/balance`);
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const canPayWithWallet = walletBalance >= total;

  const handlePayWithWallet = async () => {
    try {
      const username = getUsername();
      if (!username) {
        alert("Please sign in first");
        return;
      }

      // Deduct from wallet
      const deductResponse = await fetch(`http://localhost:8081/wallets/${username}/deduct-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });

      if (!deductResponse.ok) {
        alert("Insufficient wallet balance");
        return;
      }

      // Proceed with order placement (same as card payment)
      const cartRes = await fetch(`http://localhost:8084/cart/${username}`);
      if (!cartRes.ok) {
        alert("Error fetching cart");
        return;
      }
      const cartArr = await cartRes.json();

      // Fetch product prices
      const productRes = await fetch("http://localhost:8082/products");
      const products = await productRes.json();
      const productMap = {};
      (Array.isArray(products) ? products : []).forEach(p => { productMap[p.id] = p; });

      // Place orders
      const orderPromises = cartArr.map(async (cartItem) => {
        const price = productMap[cartItem.productId]?.price || cartItem.price || 0;
        return await fetch("http://localhost:8083/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            totalPrice: cartItem.quantity * price
          })
        });
      });

      const results = await Promise.all(orderPromises);
      if (results.every(r => r.ok)) {
        // Clear cart
        await fetch(`http://localhost:8084/cart/clear/${username}`, { method: "DELETE" });
        alert("✅ Payment successful! Order placed using wallet.");
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        alert("Error placing orders");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <>
      <Navbar isSignedIn={true} />
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2>Checkout Summary</h2>
          
          {/* Wallet Balance Section */}
          <div style={{
            backgroundColor: "#f0f8ff",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
            border: "2px solid #007bff"
          }}>
            <p style={{ margin: "0.5rem 0", fontSize: "0.95rem", color: "#555" }}>
              💳 <strong>Wallet Balance:</strong> ₹{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </p>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h3>Total Amount: ₹{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            {canPayWithWallet && (
              <p style={{ fontSize: "0.9rem", color: "#27ae60", fontWeight: "bold" }}>
                ✓ You have enough wallet balance to pay!
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Pay with Wallet Button */}
            {canPayWithWallet && (
              <button
                style={{
                  padding: "1rem",
                  backgroundColor: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem"
                }}
                onClick={handlePayWithWallet}
              >
                💰 Pay with Wallet
              </button>
            )}

            {/* Pay with Card Button */}
            <button
              style={{
                padding: "1rem",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
              onClick={() => navigate("/payments", { state: { amount } })}
            >
              💳 Pay with Card
            </button>

            <button
              style={{
                padding: "1rem",
                backgroundColor: "#0b2a44ff",
                color: "#dfd6d6ff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => navigate("/profile")}
            >
              Edit Shipping Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default CheckoutPage;