import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = '/api';

function WatchedCruises() {
  const navigate = useNavigate();
  const [watchedCruises, setWatchedCruises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWatchedCruises();
  }, []);

  const fetchWatchedCruises = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/watched`);
      setWatchedCruises(response.data);
    } catch (err) {
      setError('Failed to fetch watched cruises. Please try again later.');
      console.error('Error fetching watched cruises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnwatchCruise = async (cruiseId) => {
    try {
      await axios.delete(`${API_URL}/watch/${cruiseId}`);
      setWatchedCruises(watchedCruises.filter(cruise => cruise.cruise_id !== cruiseId));
    } catch (err) {
      console.error('Error unwatching cruise:', err);
      // Handle error appropriately
    }
  };

  const handleUpdatePrices = async () => {
    try {
      await axios.post(`${API_URL}/watched/update-prices`);
      fetchWatchedCruises(); // Refresh the list to show updated prices
    } catch (err) {
      console.error('Error updating prices:', err);
      // Handle error appropriately
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Watched Cruises
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdatePrices}
        >
          Update Prices
        </Button>
      </Box>
      <Grid container spacing={3}>
        {watchedCruises.map((watchedCruise) => (
          <Grid item xs={12} md={6} lg={4} key={watchedCruise.id}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 240,
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {watchedCruise.vessel_name || 'Unknown Ship'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Departure: {watchedCruise.departure_date ? (
                  (() => {
                    // API returns date in format "20/08/2025"
                    const [day, month, year] = watchedCruise.departure_date.split('/');
                    return `${month}/${day}/${year}`;
                  })()
                ) : 'N/A'}<br />
                Port: {watchedCruise.port_name || 'N/A'}<br />
                Duration: {watchedCruise.duration || 'N/A'} nights<br />
                Starting Price: ${watchedCruise.starting_price || 'N/A'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/cruise/${watchedCruise.cruise_id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleUnwatchCruise(watchedCruise.cruise_id)}
                >
                  Unwatch
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default WatchedCruises; 