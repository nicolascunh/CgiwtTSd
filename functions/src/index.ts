import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Proxy function for Traccar API
export const api = functions.https.onRequest((req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Extract the API path from the request
  const apiPath = req.path.replace('/api', '');
  const targetUrl = `http://35.230.168.225:8082/api${apiPath}`;
  
  // Forward the request to Traccar API
  const fetch = require('node-fetch');
  
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  // Forward authorization header if present
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  
  const options = {
    method: req.method,
    headers: headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  };
  
  fetch(targetUrl, options)
    .then((response: any) => {
      // Forward the response status and headers
      res.status(response.status);
      
      // Copy relevant headers
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.set('Content-Type', contentType);
      }
      
      return response.text();
    })
    .then((data: string) => {
      res.send(data);
    })
    .catch((error: any) => {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy error' });
    });
});

