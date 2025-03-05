export class PaymentModal {
	constructor(game) {
		this.game = game;
		this.modal = document.getElementById('payment-modal');
		this.closeButton = document.querySelector('.close');
		this.payButton = document.getElementById('pay-button');

		// Add event listeners
		this.closeButton.addEventListener('click', () => this.hide());
		this.payButton.addEventListener('click', () => this.processPayment());
	}

	show() {
		this.modal.style.display = 'block';
	}

	hide() {
		this.modal.style.display = 'none';
	}

	processPayment() {
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
