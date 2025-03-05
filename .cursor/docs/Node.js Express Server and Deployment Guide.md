// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(\_\_dirname, 'public')));

app.get('/', (req, res) => {
res.sendFile(path.join(\_\_dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
console.log(`Intelligence Cube 3D running on port ${PORT}`);
});

// package.json
/_
{
"name": "intelligence-cube-3d",
"version": "1.0.0",
"description": "Intelligence Cube 3D game using Three.js",
"main": "server.js",
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js"
},
"keywords": ["game", "threejs", "puzzle"],
"author": "",
"license": "MIT",
"dependencies": {
"express": "^4.18.2"
},
"devDependencies": {
"nodemon": "^2.0.22"
}
}
_/

// Deployment instructions for Render.com:
/\*

1. Create a GitHub repository and push your code:

   - Create a new repository on GitHub
   - Initialize git in your project folder: git init
   - Add your files: git add .
   - Commit: git commit -m "Initial commit"
   - Add remote: git remote add origin <your-repo-url>
   - Push: git push -u origin main

2. Sign up for Render.com:

   - Go to render.com and sign up or login
   - Connect your GitHub account

3. Create a new Web Service:

   - Click "New" and select "Web Service"
   - Select your repository
   - Configure settings:
     - Name: intelligence-cube-3d
     - Environment: Node
     - Build Command: npm install
     - Start Command: npm start
     - Select a free or paid plan

4. Add environment variables (if needed):

   - Go to your web service dashboard
   - Navigate to "Environment" tab
   - Add any required environment variables

5. Deploy:

   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Once deployed, you can access your game at the provided URL

6. Setup Mock Payment Integration:

   - The mock payment is already implemented
   - After 7 game plays, the payment modal will appear
   - User can click "Pay $2.99" to continue
   - In a real implementation, you would integrate Stripe API:

7. Stripe Integration (for future implementation):
   - npm install stripe
   - Create a Stripe account and get API keys
   - Add to server.js:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-checkout-session', async (req, res) => {
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: 'Intelligence Cube 3D Full Version',
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
});
```

- Client-side implementation would use Stripe's checkout.js library
  \*/

// Folder Structure for Deployment:
/_
intelligence-cube-3d/
├── package.json
├── server.js
└── public/
├── index.html
├── main.js
├── game/
│ ├── Game.js
│ ├── Player.js
│ ├── Level.js
│ ├── Cube.js
│ ├── UI.js
│ └── PaymentModal.js
└── lib/
└── three.min.js (or use CDN)
_/
