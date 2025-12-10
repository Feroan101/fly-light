// ==================== PAYMENT SYSTEM ====================

document.addEventListener('DOMContentLoaded', async () => {
  const pendingData = sessionStorage.getItem('pendingRegistration') || sessionStorage.getItem('pendingOrder');
  
  if (!pendingData) {
    showAlert('No payment data found', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }

  const data = JSON.parse(pendingData);
  displayPaymentDetails(data);
  setupPaymentForm(data);
});

function displayPaymentDetails(data) {
  const details = document.getElementById('payment-details') || document.body;
  
  let html = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0;">Payment Details</h3>
  `;

  if (data.reference_type === 'tournament') {
    html += `
      <p><strong>Tournament:</strong> ${data.tournament_name}</p>
      <p><strong>Type:</strong> Tournament Registration</p>
    `;
  } else {
    html += `
      <p><strong>Type:</strong> E-Commerce Order</p>
    `;
  }

  html += `
      <p><strong>Amount:</strong> <span style="font-size: 24px; color: #10B981; font-weight: bold;">${formatCurrency(data.amount)}</span></p>
      <p><strong>Email:</strong> ${data.user_email}</p>
    </div>
  `;

  details.innerHTML = html;
}

function setupPaymentForm(data) {
  const form = document.getElementById('payment-form');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await processPayment(data);
  });
}

async function processPayment(data) {
  try {
    showLoading(true);

    // Step 1: Initiate Payment
    const paymentResponse = await api.initiatePayment({
      amount: data.amount,
      email: data.user_email,
      reference_id: data.reference_type === 'tournament' ? data.tournament_id : data.order_id,
      reference_type: data.reference_type
    });

    // Store payment info
    const paymentInfo = {
      payment_id: paymentResponse.payment_id,
      transaction_id: paymentResponse.transaction_id,
      verification_token: paymentResponse.verification_token,
      ...data
    };

    sessionStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));

    // Simulate payment gateway (in real scenario, redirect to Razorpay/Stripe)
    showPaymentGateway(paymentInfo);
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function showPaymentGateway(paymentInfo) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; text-align: center;">
      <h2>Payment Gateway</h2>
      <p style="color: #666; margin: 20px 0;">Simulated Payment Processing</p>
      
      <div style="background: #f0f9ff; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; text-align: left;">
        <p><strong>Transaction ID:</strong></p>
        <p style="font-family: monospace; word-break: break-all; background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
          ${paymentInfo.transaction_id}
        </p>
        <p style="font-size: 12px; color: #666; margin: 10px 0;">
          Share this Transaction ID after payment
        </p>
      </div>

      <div style="background: #f0f9ff; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; text-align: left;">
        <p><strong>Amount to Pay:</strong></p>
        <p style="font-size: 28px; color: #10B981; font-weight: bold; margin: 0;">
          ${formatCurrency(paymentInfo.amount)}
        </p>
      </div>

      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 10px; text-align: left; font-weight: 600;">
          Enter Payment Reference/Receipt Number:
        </label>
        <input type="text" id="payment-ref" placeholder="E.g., UPI Reference or Receipt #" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button onclick="this.closest('div').parentElement.remove()" style="flex: 1; background: #999; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">Cancel</button>
        <button onclick="completePayment('${paymentInfo.payment_id}', '${paymentInfo.verification_token}')" style="flex: 1; background: #10B981; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">Verify Payment</button>
      </div>

      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        In production, this would redirect to Razorpay or Stripe payment gateway
      </p>
    </div>
  `;

  document.body.appendChild(modal);
}

async function completePayment(paymentId, verificationToken) {
  const paymentRef = document.getElementById('payment-ref').value;

  if (!paymentRef) {
    showAlert('Please enter payment reference', 'error');
    return;
  }

  try {
    showLoading(true);

    // Verify payment
    const paymentInfo = JSON.parse(sessionStorage.getItem('paymentInfo'));
    
    const result = await api.verifyPayment({
      payment_id: paymentId,
      transaction_id: paymentInfo.transaction_id,
      verification_token: verificationToken,
      payment_reference: paymentRef
    });

    showAlert('Payment verified successfully!', 'success');

    // Store success data
    sessionStorage.setItem('paymentSuccess', JSON.stringify({
      payment_id: paymentId,
      transaction_id: paymentInfo.transaction_id,
      amount: paymentInfo.amount,
      reference_type: paymentInfo.reference_type,
      reference_id: paymentInfo.reference_type === 'tournament' ? paymentInfo.tournament_id : paymentInfo.order_id
    }));

    // Redirect to confirmation
    setTimeout(() => {
      window.location.href = 'payment-confirmation.html?payment_id=' + paymentId;
    }, 2000);
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Payment Confirmation Page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('payment-confirmation')) {
    displayConfirmation();
  }
});

function displayConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('payment_id');
  
  const confirmationDiv = document.getElementById('confirmation-details') || document.body;

  const paymentSuccess = sessionStorage.getItem('paymentSuccess');
  if (!paymentSuccess) {
    confirmationDiv.innerHTML = '<p>Payment data not found. <a href="index.html">Go back home</a></p>';
    return;
  }

  const data = JSON.parse(paymentSuccess);

  let html = `
    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; max-width: 600px; margin: 20px auto;">
      <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
      <h1 style="color: #10B981; margin-bottom: 10px;">Payment Successful!</h1>
      <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Your payment has been verified successfully.</p>

      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
        <p><strong>Payment ID:</strong> <span style="font-family: monospace;">${paymentId}</span></p>
        <p><strong>Transaction ID:</strong> <span style="font-family: monospace;">${data.transaction_id}</span></p>
        <p><strong>Amount Paid:</strong> <span style="color: #10B981; font-weight: bold; font-size: 18px;">${formatCurrency(data.amount)}</span></p>
        <p><strong>Type:</strong> ${data.reference_type === 'tournament' ? 'Tournament Registration' : 'E-Commerce Order'}</p>
      </div>

      <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10B981; margin-bottom: 20px; text-align: left;">
        <p style="margin: 0;"><strong>✓ Your registration is confirmed!</strong></p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">You will receive a confirmation email shortly with all details.</p>
      </div>

      <div style="display: flex; gap: 10px;">
        <button onclick="window.location.href='index.html'" style="flex: 1; background: #10B981; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Go Home</button>
        <button onclick="printReceipt()" style="flex: 1; background: #3B82F6; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Receipt</button>
      </div>
    </div>
  `;

  confirmationDiv.innerHTML = html;

  // Clear session data
  sessionStorage.removeItem('paymentSuccess');
  sessionStorage.removeItem('paymentInfo');
  sessionStorage.removeItem('pendingRegistration');
  sessionStorage.removeItem('pendingOrder');
}

function printReceipt() {
  window.print();
}
