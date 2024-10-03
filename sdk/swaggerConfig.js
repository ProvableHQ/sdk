import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Provable SDK', 
    version: '1.0.0',
    description: 'API documentation for Provable SDK',
  },
  servers: [
    {
      url: 'https://api.explorer.provable.com/v1/mainnet', 
      description: 'Mainnet API',
    },
    {
      url: 'https://api.explorer.provable.com/v1/testnet', 
      description: 'Testnet API',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;