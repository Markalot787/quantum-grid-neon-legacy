export class PaymentModal {
	constructor(game) {
		console.log('DEBUG - PaymentModal initialization started');
		this.game = game;
		this.modal = document.getElementById('payment-modal');

		// Get button elements with null checks
		this.closeButton = document.getElementById('cancel-payment');
		this.payButton = document.getElementById('pay-button');

		console.log('DEBUG - PaymentModal elements found:', {
			modal: !!this.modal,
			closeButton: !!this.closeButton,
			payButton: !!this.payButton,
		});

		// Add event listeners with null checks
		if (this.closeButton) {
			this.closeButton.addEventListener('click', () => {
				console.log('DEBUG - Cancel payment button clicked');
				this.hide();
				// Reset play count to allow more free play
				this.game.playCount = 0;
				// Continue to next level
				this.game.startLevel(this.game.currentLevel);
			});
		} else {
			console.warn('WARNING - Cancel payment button not found');
		}

		if (this.payButton) {
			this.payButton.addEventListener('click', () => {
				console.log('DEBUG - Pay button clicked');
				this.processPayment();
			});
		} else {
			console.warn('WARNING - Pay button not found');
		}

		// Load Stripe script for payment integration
		this.loadStripeScript();

		console.log('DEBUG - PaymentModal initialization complete');
	}

	show() {
		console.log('DEBUG - Showing payment modal');
		if (this.modal) {
			this.modal.style.display = 'flex';
		} else {
			console.warn('WARNING - Payment modal element not found');
			// Fallback: If modal not found, just continue the game
			this.fallbackPayment();
		}
	}

	hide() {
		console.log('DEBUG - Hiding payment modal');
		if (this.modal) {
			this.modal.style.display = 'none';
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
		console.log('DEBUG - Processing payment');
		try {
			// For demo purposes, we'll use fallback payment
			// In a real implementation, we would integrate with Stripe
			this.fallbackPayment();
		} catch (error) {
			console.error('Payment error:', error);
			this.fallbackPayment();
		}
	}

	fallbackPayment() {
		console.log('DEBUG - Using fallback payment process');
		// Mock payment processing
		alert('Thank you for your purchase! Enjoy the full game!');

		// Hide modal
		this.hide();

		// Reset play count
		this.game.playCount = 0;

		// Continue to next level
		this.game.startLevel(this.game.currentLevel);
	}
}
