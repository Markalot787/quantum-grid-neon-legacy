const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// Add Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY
	? require('stripe')(process.env.STRIPE_SECRET_KEY)
	: null;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Stripe payment endpoint
if (stripe) {
	app.post('/create-checkout-session', async (req, res) => {
		try {
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: [
					{
						price_data: {
							currency: 'usd',
							product_data: {
								name: 'Quantum Grid: Neon Legacy Full Version',
							},
							unit_amount: 299, // $2.99
						},
						quantity: 1,
					},
				],
				mode: 'payment',
				success_url: `${req.headers.origin}/success.html`,
				cancel_url: `${req.headers.origin}/`,
			});
			res.json({ id: session.id });
		} catch (error) {
			console.error('Stripe error:', error);
			res.status(500).json({ error: error.message });
		}
	});
}

// Handle 404 errors for any other routes
app.use((req, res) => {
	console.log(`404 Not Found: ${req.originalUrl}`);
	res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
	console.log(`Quantum Grid: Neon Legacy running on port ${PORT}`);
});
