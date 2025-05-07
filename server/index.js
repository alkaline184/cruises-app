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
    const filterData = response.data.data;
    
    // Format the data for the frontend
    const formattedFilters = {
      brands: filterData.brands.map(brand => ({
        id: brand.id.toString(),
        name: brand.name
      })),
      ports: filterData.ports.map(port => ({
        id: port.id.toString(),
        name: port.name,
        code: port.code
      })),
      durations: filterData.durations.map(duration => ({
        id: duration.id,
        name: duration.name
      }))
    };
    
    res.json(formattedFilters);
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

app.get('/api/cruises', async (req, res) => {
  try {
    console.log('Fetching cruises with params:', req.query);
    const response = await axios.get('http://api.cruiseway.gr/api/cruises', {
      params: {
        'brand[]': req.query['brand[]'] || ['25'], // Default to Royal Caribbean if not specified
        'port[]': req.query['port[]'] || ['310'],
        'duration[]': req.query['duration[]'] || [],
        sort: 'departured_at',
        order: 'asc',
        page: req.query.page || 1
      }
    });
    console.log('Cruiseway API Response:', {
      total: response.data.total,
      last_page: response.data.last_page,
      current_page: response.data.current_page,
      data_length: response.data.data?.length,
      data_structure: Object.keys(response.data)
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cruises:', error);
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