import express, { json } from 'express';
import { serve, setup } from 'swagger-ui-express';
import swaggerDocs from './swaggerConfig.js'; // Adjust the path if necessary
import programRoutes from './routes/program.js'; // Adjust the path if necessary

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// Middleware to parse JSON bodies
app.use(json());

// Serve Swagger documentation
app.use('/api-docs', serve, setup(swaggerDocs));

// Use the program routes
app.use('/api', programRoutes); // Prefix routes with /api

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

//Export docs in swagger.json
app.get('/swagger.json', (req, res) => {
    res.json(swaggerDocs);
});