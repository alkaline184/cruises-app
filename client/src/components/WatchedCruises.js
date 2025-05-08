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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const API_URL = '/api';

const convertToDollars = (euroPrice) => {
  if (!euroPrice) return 'N/A';
  const cleanPrice = euroPrice.toString().replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  return cleanPrice;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
                height: 'auto',
                minHeight: 240,
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {watchedCruise.vessel_name || 'Unknown Ship'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Departure: {watchedCruise.departure_date ? (
                  (() => {
                    const [day, month, year] = watchedCruise.departure_date.split('/');
                    return `${month}/${day}/${year}`;
                  })()
                ) : 'N/A'}<br />
                Port: {watchedCruise.port_name || 'N/A'}<br />
                Duration: {watchedCruise.duration || 'N/A'} nights<br />
                {(() => {
                  const prices = watchedCruise.price_history || [];
                  const priceValues = prices.map(p => parseFloat(p.price));
                  const currentPrice = parseFloat(watchedCruise.starting_price);
                  const minPrice = Math.min(...priceValues, currentPrice);
                  const hasHistory = prices.length > 0;
                  
                  let color = 'inherit';
                  let previousPriceText = '';
                  
                  if (hasHistory) {
                    if (currentPrice === minPrice) {
                      color = '#2e7d32'; // success.main
                    } else {
                      color = '#d32f2f'; // error.main
                      // Find the previous lowest price
                      const previousPrices = prices.filter(p => parseFloat(p.price) < currentPrice);
                      if (previousPrices.length > 0) {
                        const lowestPrevious = previousPrices.reduce((min, p) => 
                          parseFloat(p.price) < parseFloat(min.price) ? p : min
                        );
                        previousPriceText = ` (was $${lowestPrevious.price} on ${formatDate(lowestPrevious.recorded_at)})`;
                      }
                    }
                  }
                  
                  return (
                    <>
                      Starting Price: <span style={{ color, fontWeight: 'bold' }}>${watchedCruise.starting_price || 'N/A'}</span>
                      {previousPriceText}
                    </>
                  );
                })()}
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
              <Accordion 
                sx={{ 
                  mt: 2,
                  '&.MuiAccordion-root': {
                    boxShadow: 'none',
                    '&:before': {
                      display: 'none',
                    },
                  },
                  '& .MuiAccordionSummary-root': {
                    minHeight: 40,
                    padding: 0,
                  },
                  '& .MuiAccordionDetails-root': {
                    padding: '8px 0',
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Price History</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="none" size="small">Date/Time</TableCell>
                          <TableCell padding="none" size="small" align="right">Price (USD)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const prices = watchedCruise.price_history || [];
                          const priceValues = prices.map(p => parseFloat(p.price));
                          const minPrice = Math.min(...priceValues);
                          const maxPrice = Math.max(...priceValues);
                          const allSame = minPrice === maxPrice;

                          return prices.map((price, index) => {
                            const priceValue = parseFloat(price.price);
                            let color = 'inherit';
                            if (!allSame) {
                              if (priceValue === minPrice) color = 'success.main';
                              if (priceValue === maxPrice) color = 'error.main';
                            }

                            return (
                              <TableRow key={index}>
                                <TableCell padding="none" size="small">{formatDate(price.recorded_at)}</TableCell>
                                <TableCell padding="none" size="small" align="right" sx={{ color, fontWeight: 'bold' }}>
                                  ${price.price}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default WatchedCruises; 