import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import { pay } from '../services/api';
import { useParams } from 'react-router-dom';
export default function PaymentPage() {
  const { ticketId } = useParams();
   const location = useLocation();
  const amount = location.state?.amount || 0;
  const navigate = useNavigate();

const  handlePay = async (e) => {
    e.preventDefault();
      try {
        console.log("Processing payment for ticket:", ticketId, "amount:", amount);
            const res = await pay({
              ticket_id: ticketId,
              amount: amount,
              mode: 'CARD',
            });
            alert("Payment successful! Payment ID: " + res.payment_id);
            navigate(`/home/ticket/${ticketId}`);

 
          }
           catch (err) {
            console.error("Error loading train:", err);
          }
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
          Amount: <strong>{amount}</strong>
        </p>
        <form onSubmit={handlePay}>
          <div style={{ marginBottom: 12 }}>
            <label>Card number</label>
            <input
              required
              style={{ width: '100%', padding: 8 }}
              placeholder="4242 4242 4242 4242"
              pattern="[0-9]{16}"
              maxLength={16}
              inputMode="numeric"
              title="Card number must be exactly 16 digits"
/>

          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
            required 
            style={{ flex: 1, padding: 8 }} 
            placeholder="MM/YY"
            pattern="[0-9]{2}/[0-9]{2}" 
            maxLength={5}
            />
            <input 
            required
            style={{ flex: 1, padding: 8 }} 
            placeholder="CVC"
            pattern="[0-9]{3}" 
            maxLength={3} 
            />
          </div>
          <button type="submit" style={{ marginTop: 12, padding: '10px 16px' }}>
            Pay
          </button>
        </form>
      </div>
    </div>
  );
}
