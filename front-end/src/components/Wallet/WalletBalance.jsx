import React, { useEffect, useState } from "react";

function getUsername() {
  return localStorage.getItem("username");
}

export default function WalletBalance() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const username = getUsername();
        if (!username) {
          setError("Please sign in first");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8081/wallets/${username}/balance`);
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.balance || 0);
          setError(null);
        } else {
          setError("Failed to load wallet balance");
        }
      } catch (err) {
        console.error("Error fetching wallet:", err);
        setError("Error loading wallet");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBalance();
    // Refresh every 10 seconds
    const interval = setInterval(fetchWalletBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={styles.container}><p>Loading wallet...</p></div>;
  if (error) return <div style={styles.container}><p style={{color: "red"}}>{error}</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.walletCard}>
        <div style={styles.walletHeader}>
          <h3 style={styles.title}>💳 My Wallet</h3>
          <button 
            style={styles.refreshBtn}
            onClick={() => window.location.reload()}
            title="Refresh wallet balance"
          >
            🔄
          </button>
        </div>
        <div style={styles.balanceSection}>
          <p style={styles.balanceLabel}>Available Balance</p>
          <h2 style={styles.balanceAmount}>
            ₹{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </h2>
        </div>
        <p style={styles.helpText}>
          Use your wallet balance to pay for orders. When you cancel an order, the amount is refunded here.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    marginBottom: "2rem",
  },
  walletCard: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    padding: "2rem",
    color: "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  walletHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    fontSize: "1.2rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  balanceSection: {
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
  },
  balanceLabel: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.95rem",
    opacity: 0.9,
  },
  balanceAmount: {
    margin: 0,
    fontSize: "2.5rem",
    fontWeight: "bold",
  },
  helpText: {
    margin: 0,
    fontSize: "0.9rem",
    opacity: 0.85,
    lineHeight: "1.4",
  },
};
