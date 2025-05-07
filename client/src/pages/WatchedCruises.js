import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import axios from 'axios';

const WatchedCruises = () => {
  const navigate = useNavigate();
  const [watchedCruises, setWatchedCruises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchedCruises();
  }, []);

  const fetchWatchedCruises = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/watched');
      setWatchedCruises(response.data);
    } catch (error) {
      console.error('Error fetching watched cruises:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/watched/update-prices');
      await fetchWatchedCruises();
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceTendency = (cruise) => {
    const priceHistory = cruise.priceHistory;
    if (priceHistory.length < 2) return 'stable';
    
    const latestPrice = priceHistory[priceHistory.length - 1].price;
    const previousPrice = priceHistory[priceHistory.length - 2].price;
    
    if (latestPrice > previousPrice) return 'up';
    if (latestPrice < previousPrice) return 'down';
    return 'stable';
  };

  const getTendencyIcon = (tendency) => {
    switch (tendency) {
      case 'up':
        return <TrendingUpIcon color="error" />;
      case 'down':
        return <TrendingDownIcon color="success" />;
      default:
        return <TrendingFlatIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Watched Cruises</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={updatePrices}
          disabled={loading}
        >
          Update Prices
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cruise Line</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Port of Departure</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>Min Price</TableCell>
              <TableCell>Price Tendency</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {watchedCruises.map((cruise) => {
              const tendency = getPriceTendency(cruise);
              const minPrice = Math.min(...cruise.priceHistory.map(p => p.price));
              const currentPrice = cruise.priceHistory[cruise.priceHistory.length - 1].price;

              return (
                <TableRow
                  key={cruise.id}
                  hover
                  onClick={() => navigate(`/cruise/${cruise.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{cruise.cruiseLine}</TableCell>
                  <TableCell>{cruise.duration} days</TableCell>
                  <TableCell>{cruise.portOfDeparture}</TableCell>
                  <TableCell>${currentPrice}</TableCell>
                  <TableCell>${minPrice}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getTendencyIcon(tendency)}
                      label={tendency.toUpperCase()}
                      color={
                        tendency === 'up'
                          ? 'error'
                          : tendency === 'down'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle unwatch functionality
                      }}
                    >
                      Unwatch
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default WatchedCruises; 