const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files with proper MIME types
app.use((req, res, next) => {
	if (req.path.endsWith('.js')) {
		res.set('Content-Type', 'application/javascript');
	}
	next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle JSON requests
app.use(express.json());

// Root route
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 errors
app.use((req, res) => {
	console.log(`404 Not Found: ${req.originalUrl}`);
	res.status(404).send('404 Not Found');
});

// Start server
app.listen(PORT, () => {
	console.log(`Quantum Grid: Neon Legacy running on port ${PORT}`);
});
