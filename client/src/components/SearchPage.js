import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCruises, setTotalCruises] = useState(0);
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    ports: [],
    durations: [],
    prices: [],
    departure: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '25', // Default to Royal Caribbean ID
    port: searchParams.get('port') || '310', // Default to Port Canaveral ID
    duration: searchParams.get('duration') || '',
    departure: searchParams.get('departure') || '', // Format: mm/dd/YYYY
    page: parseInt(searchParams.get('page') || '1')
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
            prices: response.data.data.prices || [],
            departure: response.data.data.departure || []
          });
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.port) params.set('port', filters.port);
    if (filters.duration) params.set('duration', filters.duration);
    if (filters.departure) params.set('departure', filters.departure);
    if (filters.page > 1) params.set('page', filters.page);
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Initialize filters from URL parameters when component mounts
  useEffect(() => {
    const brand = searchParams.get('brand');
    const port = searchParams.get('port');
    const duration = searchParams.get('duration');
    const departure = searchParams.get('departure');
    const page = parseInt(searchParams.get('page') || '1');

    setFilters(prev => ({
      ...prev,
      brand: brand || prev.brand,
      port: port || prev.port,
      duration: duration || prev.duration,
      departure: departure || prev.departure,
      page: page || prev.page
    }));
  }, [searchParams]);

  const fetchCruises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        'brand[]': [filters.brand],
        'port[]': [filters.port],
        page: filters.page,
        _t: new Date().getTime() // Add timestamp to prevent caching
      };

      // Only add duration parameter if it has a value
      if (filters.duration) {
        params['duration[]'] = [filters.duration];
      }

      // Only add departure parameter if it has a value
      if (filters.departure) {
        // Convert mm/dd/YYYY to YYYY-MM for API
        const [month, day, year] = filters.departure.split('/');
        params['departure[]'] = [`${year}-${month.padStart(2, '0')}`];
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
  }, [filters]);

  // Fetch cruises when filters change
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
            <FormControl fullWidth>
              <InputLabel>Departure Date</InputLabel>
              <Select
                value={filters.departure}
                label="Departure Date"
                onChange={(e) => handleFilterChange('departure', e.target.value)}
              >
                {filterOptions.departure?.map((date) => {
                  // Convert YYYY-MM to mm/dd/YYYY
                  const [year, month] = date.id.split('-');
                  const formattedDate = `${month}/01/${year}`; // Use first day of month
                  return (
                    <MenuItem key={date.id} value={formattedDate}>
                      {date.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Available Cruises ({totalCruises})
        </Typography>
        <Pagination 
          count={totalPages} 
          page={filters.page} 
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
                  <TableCell>Departure Date</TableCell>
                  <TableCell>Price Range</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cruises.map((cruise) => (
                  <TableRow
                    key={cruise.id}
                    hover
                    onClick={() => {
                      const currentParams = new URLSearchParams(searchParams);
                      navigate(`/cruise/${cruise.id}?${currentParams.toString()}`);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{cruise.vessel?.brand?.name || 'N/A'}</TableCell>
                    <TableCell>{cruise.vessel?.name || 'N/A'}</TableCell>
                    <TableCell>{cruise.duration} days</TableCell>
                    <TableCell>{cruise.port?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {cruise.departured_at ? (
                        (() => {
                          // API returns date in format "20/08/2025"
                          const [day, month, year] = cruise.departured_at.split('/');
                          return `${month}/${day}/${year}`;
                        })()
                      ) : 'N/A'}
                    </TableCell>
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
              page={filters.page} 
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