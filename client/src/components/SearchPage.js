import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Pagination,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Slider
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

function SearchPage() {
  const navigate = useNavigate();
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCruises, setTotalCruises] = useState(0);
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    ports: [],
    durations: [],
    prices: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    brand: ['25'], // Default to Royal Caribbean ID
    port: ['310'], // Default to Port Canaveral ID
    duration: [],
    priceRange: [0, 5000],
    page: 1
  });

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/filters`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.data?.data) {
          setFilterOptions({
            brands: response.data.data.brands || [],
            ports: response.data.data.ports || [],
            durations: response.data.data.durations || [],
            prices: response.data.data.prices || []
          });
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchCruises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        'brand[]': filters.brand,
        'port[]': filters.port,
        page: filters.page,
        _t: new Date().getTime() // Add timestamp to prevent caching
      };

      // Only add duration parameter if it has values
      if (filters.duration.length > 0) {
        params['duration[]'] = filters.duration;
      }

      console.log('Sending filters to API:', {
        filters,
        queryParams: params
      });
      
      const response = await axios.get(`${API_URL}/cruises`, { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('No data received from API');
      }

      // Log the entire response structure
      console.log('Full API Response:', response.data);
      
      // The data structure from the API is response.data.data.data
      const cruisesData = response.data.data?.data;
      console.log('Processed cruises data:', cruisesData);
      
      if (!Array.isArray(cruisesData)) {
        console.error('Unexpected API response structure:', response.data);
        throw new Error('Invalid API response structure');
      }

      // Update state with new data
      setCruises(cruisesData);
      setTotalPages(response.data.data?.last_page || 1);
      setTotalCruises(response.data.data?.total || 0);
      
      // Log state updates
      console.log('Updated state:', {
        cruisesCount: cruisesData.length,
        totalPages: response.data.data?.last_page,
        totalCruises: response.data.data?.total
      });

    } catch (err) {
      console.error('Error fetching cruises:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        params: err.config?.params
      });
      
      let errorMessage = 'Failed to fetch cruises. ';
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.status === 422) {
        errorMessage += 'Invalid filter parameters.';
      } else if (err.response?.status === 404) {
        errorMessage += 'API endpoint not found.';
      } else if (err.response?.status === 500) {
        errorMessage += 'Server error.';
      } else if (!err.response) {
        errorMessage += 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Fetch cruises when filters or page changes
  useEffect(() => {
    fetchCruises();
  }, [fetchCruises]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePriceRangeChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  const handlePageChange = (event, value) => {
    setFilters(prev => ({
      ...prev,
      page: value
    }));
  };

  const handleWatchCruise = async (cruise) => {
    try {
      await axios.post(`${API_URL}/watch`, cruise);
      // You might want to show a success message or update the UI
    } catch (err) {
      console.error('Error watching cruise:', err);
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Filters
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cruise Line</InputLabel>
              <Select
                multiple
                value={filters.brand}
                label="Cruise Line"
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                {filterOptions.brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                multiple
                value={filters.duration}
                label="Duration"
                onChange={(e) => handleFilterChange('duration', e.target.value)}
              >
                {filterOptions.durations.map((duration) => (
                  <MenuItem key={duration.id} value={duration.id}>
                    {duration.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Port of Departure</InputLabel>
              <Select
                multiple
                value={filters.port}
                label="Port of Departure"
                onChange={(e) => handleFilterChange('port', e.target.value)}
              >
                {filterOptions.ports.map((port) => (
                  <MenuItem key={port.id} value={port.id.toString()}>
                    {port.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography gutterBottom>Price Range (€)</Typography>
            <Slider
              value={filters.priceRange}
              onChange={handlePriceRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={5000}
              step={100}
              marks={[
                { value: 0, label: '0€' },
                { value: 5000, label: '5000€' }
              ]}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Available Cruises ({totalCruises})
        </Typography>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Box>

      {cruises.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No cruises found. Please try different search criteria.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cruise Line</TableCell>
                  <TableCell>Ship Name</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Port of Departure</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Departure Date ↑</TableCell>
                  <TableCell>Price Range</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cruises.map((cruise) => (
                  <TableRow
                    key={cruise.id}
                    hover
                    onClick={() => navigate(`/cruise/${cruise.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{cruise.vessel?.brand?.name || 'N/A'}</TableCell>
                    <TableCell>{cruise.vessel?.name || 'N/A'}</TableCell>
                    <TableCell>{cruise.duration} days</TableCell>
                    <TableCell>{cruise.port?.name || 'N/A'}</TableCell>
                    <TableCell>{cruise.departured_at || 'N/A'}</TableCell>
                    <TableCell>
                      {cruise.group_prices ? (
                        <>
                          {cruise.group_prices.min} - {cruise.group_prices.S}
                        </>
                      ) : (
                        cruise.starting_price || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatchCruise(cruise);
                        }}
                      >
                        Watch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        </>
      )}
    </Container>
  );
}

export default SearchPage; 