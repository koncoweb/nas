/**
 * Vercel serverless function handler for React Router + Hono
 */

const path = require('path');

// Import the Hono server from the build
let server;

try {
  // Try to import the built server
  server = require('../__create/index.ts');
} catch (error) {
  console.error('Failed to import server:', error);
  
  // Fallback handler
  module.exports = async (req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed',
      details: error.message 
    });
  };
  return;
}

// Export the Vercel handler
module.exports = async (req, res) => {
  try {
    // Convert Vercel request to standard Request object
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Handle the request with Hono
    const response = await server.fetch(request);
    
    // Convert Response to Vercel response
    const body = await response.text();
    
    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Set status and send response
    res.status(response.status);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      res.json(JSON.parse(body));
    } else {
      res.send(body);
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
};