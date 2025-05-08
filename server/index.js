require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(express.json());

// Add cache control headers to all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Database configuration
const pool = mysql.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// API Routes
app.get('/api/filters', async (req, res) => {
  try {
    const response = await axios.get('http://api.cruiseway.gr/api/content/filters');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

app.get('/api/cruises', async (req, res) => {
  try {
    console.log('Received query parameters:', {
      raw: req.query,
      brand: req.query.brand,
      port: req.query.port,
      duration: req.query.duration,
      page: req.query.page
    });

    const params = {
      sort: 'departured_at',
      order: 'asc',
      page: req.query.page || 1
    };

    // Handle brand parameter
    if (req.query.brand) {
      params['brand[]'] = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
    } else {
      params['brand[]'] = ['25']; // Default brand
    }

    // Handle port parameter
    if (req.query.port) {
      params['port[]'] = Array.isArray(req.query.port) ? req.query.port : [req.query.port];
    } else {
      params['port[]'] = ['310']; // Default port
    }

    // Handle duration parameter
    if (req.query.duration) {
      params['duration[]'] = Array.isArray(req.query.duration) ? req.query.duration : [req.query.duration];
    }

    // Handle departure parameter
    if (req.query.departure) {
      params['departure[]'] = Array.isArray(req.query.departure) ? req.query.departure : [req.query.departure];
    }

    console.log('Sending parameters to Cruiseway API:', params);
    
    const response = await axios.get('http://api.cruiseway.gr/api/cruises', {
      params: {
        ...params,
        _t: new Date().getTime() // Add timestamp to prevent caching
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-None-Match': '', // Prevent 304 responses
        'If-Modified-Since': '' // Prevent 304 responses
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Only accept 2xx status codes
      }
    });
    
    // Log response headers and request details
    console.log('Cruiseway API Response Headers:', {
      'cache-control': response.headers['cache-control'],
      'etag': response.headers['etag'],
      'last-modified': response.headers['last-modified'],
      'date': response.headers['date'],
      'status': response.status,
      'statusText': response.statusText
    });
    
    console.log('Request URL:', response.request.res.responseUrl);
    
    // Validate the response structure
    if (!response.data || !response.data.data || !Array.isArray(response.data.data.data)) {
      console.error('Invalid response structure from Cruiseway API:', response.data);
      return res.status(500).json({ error: 'Invalid response from cruise API' });
    }

    // Log the full response for debugging
    console.log('Full Cruiseway API Response:', {
      total: response.data.data.total,
      last_page: response.data.data.last_page,
      current_page: response.data.data.current_page,
      data_length: response.data.data.data.length,
      data_structure: Object.keys(response.data),
      first_cruise: response.data.data.data[0] ? {
        id: response.data.data.data[0].id,
        brand: response.data.data.data[0].vessel?.brand?.name,
        port: response.data.data.data[0].port?.name,
        duration: response.data.data.data[0].duration
      } : null
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cruises:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    res.status(500).json({ error: 'Failed to fetch cruises' });
  }
});

app.get('/api/cruises/id/:id', async (req, res) => {
  try {
    console.log('Fetching cruise details for ID:', req.params.id);
    const response = await axios.get(`http://api.cruiseway.gr/api/cruises/id/${req.params.id}`);
    
    console.log('Cruiseway API Response:', {
      data_structure: Object.keys(response.data),
      has_data: !!response.data.data
    });
    
    if (!response.data.data) {
      console.log('Cruise not found in response');
      return res.status(404).json({ error: 'Cruise not found' });
    }
    
    res.json({ data: response.data.data });
  } catch (error) {
    console.error('Error fetching cruise details:', error);
    res.status(500).json({ error: 'Failed to fetch cruise details' });
  }
});

// Watched cruises routes
app.post('/api/watch', async (req, res) => {
  const { id, ...cruiseData } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.execute(
      'INSERT INTO watched_cruises (cruise_id, cruise_data) VALUES (?, ?)',
      [id, JSON.stringify(cruiseData)]
    );
    
    await connection.execute(
      'INSERT INTO price_history (cruise_id, price) VALUES (?, ?)',
      [id, cruiseData.price]
    );
    
    await connection.commit();
    res.json({ id: result.insertId, cruise_id: id, cruise_data: cruiseData });
  } catch (error) {
    await connection.rollback();
    console.error('Error watching cruise:', error);
    res.status(500).json({ error: 'Failed to watch cruise' });
  } finally {
    connection.release();
  }
});

app.get('/api/watched', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        wc.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'price', ph.price,
            'recorded_at', ph.recorded_at
          )
        ) as price_history
      FROM watched_cruises wc
      LEFT JOIN price_history ph ON wc.cruise_id = ph.cruise_id
      GROUP BY wc.id
    `);
    
    // Parse the JSON strings
    const parsedRows = rows.map(row => ({
      ...row,
      cruise_data: JSON.parse(row.cruise_data),
      price_history: JSON.parse(row.price_history)
    }));
    
    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching watched cruises:', error);
    res.status(500).json({ error: 'Failed to fetch watched cruises' });
  } finally {
    connection.release();
  }
});

app.post('/api/watched/update-prices', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [watchedCruises] = await connection.execute('SELECT * FROM watched_cruises');
    
    for (const cruise of watchedCruises) {
      const response = await axios.get(`http://api.cruiseway.gr/api/cruises/${cruise.cruise_id}`);
      const currentPrice = response.data.price;
      
      await connection.execute(
        'INSERT INTO price_history (cruise_id, price) VALUES (?, ?)',
        [cruise.cruise_id, currentPrice]
      );
    }
    
    await connection.commit();
    res.json({ message: 'Prices updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  } finally {
    connection.release();
  }
});

app.delete('/api/watch/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM watched_cruises WHERE cruise_id = ?', [req.params.id]);
    await connection.commit();
    res.json({ message: 'Cruise unwatched successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error unwatching cruise:', error);
    res.status(500).json({ error: 'Failed to unwatch cruise' });
  } finally {
    connection.release();
  }
});

// Database initialization
const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Drop tables if they exist
    await connection.execute(`DROP TABLE IF EXISTS price_history;`);
    await connection.execute(`DROP TABLE IF EXISTS watched_cruises;`);
    
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS watched_cruises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cruise_id VARCHAR(255) NOT NULL UNIQUE,
        cruise_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cruise_id VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cruise_id) REFERENCES watched_cruises(cruise_id)
      );
    `);
    
    await connection.commit();
    console.log('Database initialized successfully');
  } catch (error) {
    await connection.rollback();
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
};

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  initializeDatabase();
}); 