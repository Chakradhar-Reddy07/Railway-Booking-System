import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const navigate = useNavigate();

  const handlePay = (e) => {
    e.preventDefault();
    // placeholder - integrate payment gateway here
    alert('Payment simulated. Thank you!');
    navigate('/'); // redirect after simulated payment
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 24,
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <h2>Payment</h2>
        <p>
          Amount: <strong>₹ 0.00</strong>
        </p>
        <form onSubmit={handlePay}>
          <div style={{ marginBottom: 12 }}>
            <label>Card number</label>
            <input
              required
              style={{ width: '100%', padding: 8 }}
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input required style={{ flex: 1, padding: 8 }} placeholder="MM/YY" />
            <input required style={{ flex: 1, padding: 8 }} placeholder="CVC" />
          </div>
          <button type="submit" style={{ marginTop: 12, padding: '10px 16px' }}>
            Pay
          </button>
        </form>
      </div>
    </div>
  );
}
