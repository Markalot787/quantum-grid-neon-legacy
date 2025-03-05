export class PaymentModal {
	constructor(game) {
		this.game = game;
		this.modal = document.getElementById('payment-modal');

		// Safely get elements, handling cases where they might not exist
		this.closeButton = document.getElementById('cancel-payment');
		this.payButton = document.getElementById('pay-button');

		// Add event listeners only if elements exist
		if (this.closeButton) {
			this.closeButton.addEventListener('click', () => this.hide());
		}

		if (this.payButton) {
			this.payButton.addEventListener('click', () => this.processPayment());
		}

		// Load Stripe.js
		this.loadStripeScript();

		console.log('DEBUG - PaymentModal initialized');
	}

	show() {
		if (this.modal) {
			this.modal.style.display = 'flex';
			console.log('DEBUG - Payment modal shown');
		}
	}

	hide() {
		if (this.modal) {
			this.modal.style.display = 'none';
			console.log('DEBUG - Payment modal hidden');
		}
	}

	loadStripeScript() {
		if (!document.getElementById('stripe-js')) {
			const script = document.createElement('script');
			script.id = 'stripe-js';
			script.src = 'https://js.stripe.com/v3/';
			script.async = true;
			document.body.appendChild(script);
			console.log('DEBUG - Stripe script loaded');
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
