import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
} from '@mui/material';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    cruiseLine: '',
    duration: '',
    portOfDeparture: '',
    priceRange: [0, 10000],
  });
  const [filterOptions, setFilterOptions] = useState({
    cruiseLines: [],
    durations: [],
    ports: [],
  });
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/filters');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/cruises', {
        params: {
          cruiseLine: filters.cruiseLine,
          duration: filters.duration,
          portOfDeparture: filters.portOfDeparture,
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
        },
      });
      setCruises(response.data);
    } catch (error) {
      console.error('Error fetching cruises:', error);
    }
    setLoading(false);
  };

  const handleWatch = async (cruise) => {
    try {
      await axios.post('http://localhost:5001/api/watch', cruise);
      // Show success message or update UI
    } catch (error) {
      console.error('Error watching cruise:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cruise Line</InputLabel>
              <Select
                value={filters.cruiseLine}
                onChange={(e) => setFilters({ ...filters, cruiseLine: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions.cruiseLines.map((line) => (
                  <MenuItem key={line} value={line}>
                    {line}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                value={filters.duration}
                onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions.durations.map((duration) => (
                  <MenuItem key={duration} value={duration}>
                    {duration} days
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Port of Departure</InputLabel>
              <Select
                value={filters.portOfDeparture}
                onChange={(e) => setFilters({ ...filters, portOfDeparture: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions.ports.map((port) => (
                  <MenuItem key={port} value={port}>
                    {port}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography gutterBottom>Price Range ($)</Typography>
            <Slider
              value={filters.priceRange}
              onChange={(e, newValue) => setFilters({ ...filters, priceRange: newValue })}
              valueLabelDisplay="auto"
              min={0}
              max={10000}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={loading}
              fullWidth
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cruise Line</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Port of Departure</TableCell>
              <TableCell>Price</TableCell>
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
                <TableCell>{cruise.cruiseLine}</TableCell>
                <TableCell>{cruise.duration} days</TableCell>
                <TableCell>{cruise.portOfDeparture}</TableCell>
                <TableCell>${cruise.price}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWatch(cruise);
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
    </Container>
  );
};

export default Home; 