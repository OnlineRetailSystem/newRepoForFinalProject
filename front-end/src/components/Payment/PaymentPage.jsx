import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';

const stripePromise = loadStripe('pk_test_51SmJq0CkE5IuKGU43e7NeoqSl1REcULTpelkw83vbHF0kKvV0kf8bn4wyA3AXBVnXk5LuOwnzKiurXq5XqTknc8I007lDgvw1r');

function getUsername() {
  return localStorage.getItem("username");
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const amountInCents = location.state?.amount || 60000;
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setMessage('');
    try {
      // Step 1. Create PaymentIntent
      const response = await fetch('http://localhost:8088/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents }),
      });
      const data = await response.json();
      if (!data.clientSecret) {
        setMessage('Unable to process payment');
        setLoading(false);
        return;
      }

      // Step 2: Stripe confirm
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessage(`Failed: ${result.error.message}`);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        setMessage('🎉 Payment successful! Creating order...');

        // Step 3: Place orders, clear cart, redirect
        const username = getUsername();
        if (username) {
          try {
            // 3a. Fetch the cart for this user
            const cartRes = await fetch(`http://localhost:8084/cart/${username}`);
            if (!cartRes.ok) {
              setMessage('⚠️ Error fetching cart');
              setLoading(false);
              return;
            }
            const cartArr = await cartRes.json();
            
            // 3b. Fetch product prices
            const productRes = await fetch("http://localhost:8082/products");
            const products = await productRes.json();
            const productMap = {};
            (Array.isArray(products) ? products : []).forEach(p => { productMap[p.id] = p; });

            // For each cart item, place an order
            const orderPromises = cartArr.map(async (cartItem) => {
              const price = productMap[cartItem.productId]?.price || cartItem.price || 0;
              const orderRes = await fetch("http://localhost:8083/orders", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify({
                  username: username,
                  productId: cartItem.productId,
                  quantity: cartItem.quantity,
                  totalPrice: cartItem.quantity * price
                })
              });
              if (!orderRes.ok) {
                console.error(`Failed to create order for product ${cartItem.productId}:`, await orderRes.text());
                throw new Error(`Failed to create order for product ${cartItem.productId}`);
              }
              console.log(`✓ Order created for product ${cartItem.productId}`);
              return orderRes.json();
            });

            const createdOrders = await Promise.all(orderPromises);
            console.log('All orders created:', createdOrders);

            // 4. Clear Cart
            await fetch(`http://localhost:8084/cart/clear/${username}`, { method: "DELETE" });
            setMessage('✅ Order placed successfully! Redirecting...');
            // 5. Redirect to dashboard after a pause
            setTimeout(() => navigate('/dashboard'), 2000);
          } catch (orderErr) {
            console.error('Error placing orders:', orderErr);
            setMessage(`⚠️ Order placement failed: ${orderErr.message}`);
            setLoading(false);
            return;
          }
        } else {
          setMessage('⚠️ Username not found. Please sign in again.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Secure Payment</h2>
        <p style={styles.amount}>
          Pay <strong>₹{(amountInCents / 100).toFixed(2)}</strong>
        </p>
        <div style={styles.cardInputWrapper}>
          <CardElement options={styles.cardStyle} />
        </div>
        <button
          style={styles.payButton}
          onClick={handlePay}
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : 'Pay'}
        </button>
        {message && (
          <p
            style={{
              ...styles.message,
              color: message.startsWith('Failed') ? '#e74c3c' : '#27ae60',
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f2f2f2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '10px',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  amount: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  cardInputWrapper: {
    marginBottom: '20px',
  },
  cardStyle: {
    style: {
      base: {
        fontSize: '16px',
        color: '#2c3e50',
        fontFamily: 'Arial, sans-serif',
        '::placeholder': {
          color: '#bdc3c7',
        },
      },
      invalid: {
        color: '#e74c3c',
      },
    },
  },
  payButton: {
    backgroundColor: '#2980b9',
    color: '#fff',
    padding: '12px 24px',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s',
  },
  message: {
    marginTop: '15px',
    fontSize: '1rem',
  },
};

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}