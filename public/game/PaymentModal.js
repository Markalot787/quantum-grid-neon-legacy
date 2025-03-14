export class PaymentModal {
	constructor(game) {
		this.game = game;
		this.modal = document.getElementById('payment-modal');

		if (!this.modal) {
			console.warn('Payment modal element not found, creating a dummy');
			this.modal = document.createElement('div');
			this.modal.id = 'payment-modal';
			this.modal.style.display = 'none';
			document.body.appendChild(this.modal);
		}

		this.closeButton = document.querySelector('.close');
		this.payButton = document.getElementById('pay-button');

		// Handle missing elements
		if (!this.closeButton) {
			console.warn('Close button not found, creating a dummy');
			this.closeButton = document.createElement('span');
			this.closeButton.className = 'close';
			this.modal.appendChild(this.closeButton);
		}

		if (!this.payButton) {
			console.warn('Pay button not found, creating a dummy');
			this.payButton = document.createElement('button');
			this.payButton.id = 'pay-button';
			this.payButton.textContent = 'Pay $2.99';
			this.modal.appendChild(this.payButton);
		}

		// Add event listeners
		this.closeButton.addEventListener('click', () => this.hide());
		this.payButton.addEventListener('click', () => this.processPayment());

		// Load Stripe.js
		this.loadStripeScript();

		console.log('PaymentModal initialized successfully');
	}

	show() {
		this.modal.style.display = 'block';
	}

	hide() {
		this.modal.style.display = 'none';
	}

	loadStripeScript() {
		if (!document.getElementById('stripe-js')) {
			const script = document.createElement('script');
			script.id = 'stripe-js';
			script.src = 'https://js.stripe.com/v3/';
			script.async = true;
			document.body.appendChild(script);

			console.log('Stripe.js script loaded');
		}
	}

	async processPayment() {
		try {
			// Check if Stripe is loaded
			if (window.Stripe) {
				// Create a Stripe instance
				const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

				// Call backend to create checkout session
				const response = await fetch('/create-checkout-session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						product: 'Quantum Grid: Neon Legacy Full Version',
					}),
				});

				const session = await response.json();

				// Redirect to checkout
				const result = await stripe.redirectToCheckout({
					sessionId: session.id,
				});

				if (result.error) {
					console.error(result.error.message);
					this.fallbackPayment();
				}
			} else {
				// If Stripe isn't loaded, use fallback
				console.warn('Stripe not loaded, using fallback payment');
				this.fallbackPayment();
			}
		} catch (error) {
			console.error('Payment error:', error);
			this.fallbackPayment();
		}
	}

	fallbackPayment() {
		// Mock payment processing as fallback
		alert('Thank you for your purchase! Enjoy the full game!');

		// Hide modal
		this.hide();

		// Reset play count
		this.game.playCount = 0;

		// Continue to next level
		this.game.startLevel(this.game.currentLevel);
	}
}
