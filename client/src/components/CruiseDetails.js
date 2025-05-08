import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CruiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [cruise, setCruise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCabinDescription = (code) => {
    // Extract the main category (first letter or letters)
    const mainCategory = code.match(/^[A-Z]+/)?.[0] || '';
    // Extract the sub-category (numbers)
    const subCategory = code.match(/\d+/)?.[0] || '';

    const categoryMap = {
      'A': 'Penthouse',
      'B': 'Suites and Family Suites',
      'C': 'Ocean View Stateroom with Large Balcony',
      'CB': 'Connecting Oceanview Balcony Stateroom',
      'D': 'Ocean View Balcony Stateroom',
      'E': 'Ocean View Stateroom with Balcony',
      'G': 'Grand Panoramic',
      'GS': 'General Suite Stateroom',
      'J': 'Junior Suite',
      'JY': 'Sky Junior Suite',
      'L': 'Panoramic Ocean View Stateroom',
      'LO': 'Large Outside Stateroom',
      'M': 'Family staterooms',
      'N': 'Ocean View Stateroom',
      'O': 'Owner\'s Suites',
      'OS': 'Owner\'s Suite',
      'S': 'Staterooms',
      'T': 'Star Loft Suite',
      'V': 'Interior Stateroom',
      'W': 'Suite/Deluxe',
      'WS': 'Suite Guarantee',
      'X': 'Balcony Stateroom',
      'XB': 'Balcony Stateroom with Ocean View Guarantee',
      'XN': 'Neighborhood Balcony Stateroom Guarantee',
      'Y': 'Ocean View Stateroom',
      'Z': 'Interior Stateroom',
      'RL': 'Royal Loft Suite',
      'VS': 'Villa Suite',
      'GP': 'Grand Panoramic Suite'
    };

    const baseDescription = categoryMap[mainCategory] || mainCategory;
    return subCategory ? `${baseDescription} (sub-category ${subCategory})` : baseDescription;
  };

  const convertToDollars = (euroPrice) => {
    const rate = 1.13; // 1 EUR = 1.13 USD
    // Convert European format (€2.713,00) to number
    const price = parseFloat(euroPrice?.toString()
      .replace(/[€\s]/g, '') // Remove € and spaces
      .replace(/\./g, '')    // Remove dots (thousand separators)
      .replace(',', '.'));   // Replace comma with dot for decimal
    return isNaN(price) ? 'N/A' : Math.round(price * rate);
  };

  useEffect(() => {
    const fetchCruiseDetails = async () => {
      try {
        const response = await fetch(`/api/cruises/id/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch cruise details');
        }
        const data = await response.json();
        setCruise(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCruiseDetails();
  }, [id]);

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
        <Box mt={4} textAlign="center">
          <Typography color="error">{error}</Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              const currentParams = new URLSearchParams(location.search);
              navigate(`/?${currentParams.toString()}`);
            }}
            sx={{ mt: 2 }}
          >
            Back to Search
          </Button>
        </Box>
      </Container>
    );
  }

  if (!cruise) {
    return null;
  }

  // Group prices by cabin type
  const cabinPrices = cruise.vessel?.cabinCategories?.reduce((acc, category) => {
    const type = category.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push({
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      price: category.price
    });
    return acc;
  }, {}) || {};

  console.log('Cruise data:', cruise);
  console.log('Cabin prices:', cabinPrices);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          const currentParams = new URLSearchParams(location.search);
          navigate(`/?${currentParams.toString()}`);
        }}
        sx={{ mb: 3 }}
      >
        Back to Search
      </Button>

      <Grid container spacing={4}>
        {/* Main Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {cruise.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Cruise Code: {cruise.code}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Ship:</strong> {cruise.vessel.name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Duration:</strong> {cruise.duration} nights
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Departure Date:</strong>{' '}
                  {cruise.departured_at ? (
                    (() => {
                      // API returns date in format "20/08/2025"
                      const [day, month, year] = cruise.departured_at.split('/');
                      return `${month}/${day}/${year}`;
                    })()
                  ) : 'N/A'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Port of Departure:</strong> {cruise.port.name}, {cruise.port.country.name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Port Code:</strong> {cruise.port.code}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Ship Description
                </Typography>
                <Typography variant="body1">
                  {cruise.vessel.description}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ship Image */}
        {cruise.vessel.media?.primary_image?.original && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Ship Image
              </Typography>
              <Box sx={{ maxWidth: '100%', height: 'auto' }}>
                <img 
                  src={cruise.vessel.media.primary_image.original} 
                  alt={cruise.vessel.name}
                  style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }}
                />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Pricing Information */}
        {cruise.vessel?.cabinCategories && cruise.vessel.cabinCategories.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Available Cabins and Pricing
              </Typography>
              {Object.entries(cabinPrices).map(([type, categories]) => (
                <Accordion key={type}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      {type === 'B' ? 'Balcony' : 
                       type === 'I' ? 'Interior' : 
                       type === 'O' ? 'Ocean View' : 
                       type === 'S' ? 'Suite' : type}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Package</TableCell>
                            <TableCell>Availability</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell>{category.name}</TableCell>
                              <TableCell>{getCabinDescription(category.code)}</TableCell>
                              <TableCell>${convertToDollars(category.price.display)}</TableCell>
                              <TableCell>{category.price.package}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={category.price.availability > 0 ? 'Available' : 'Unavailable'} 
                                  color={category.price.availability > 0 ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          </Grid>
        )}

        {/* Vessel Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Vessel Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Vessel ID:</strong> {cruise.vessel.id}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Vessel Slug:</strong> {cruise.vessel.slug}
                </Typography>
                {cruise.vessel.brand && (
                  <>
                    <Typography variant="subtitle1">
                      <strong>Brand Name:</strong> {cruise.vessel.brand.name}
                    </Typography>
                    <Typography variant="subtitle1">
                      <strong>Brand Description:</strong> {cruise.vessel.brand.description}
                    </Typography>
                    {cruise.vessel.brand.included && (
                      <Typography variant="subtitle1">
                        <strong>Included Services:</strong>
                        <div dangerouslySetInnerHTML={{ __html: cruise.vessel.brand.included }} />
                      </Typography>
                    )}
                    {cruise.vessel.brand.excluded && (
                      <Typography variant="subtitle1">
                        <strong>Excluded Services:</strong>
                        <div dangerouslySetInnerHTML={{ __html: cruise.vessel.brand.excluded }} />
                      </Typography>
                    )}
                    {cruise.vessel.brand.general_info && (
                      <Typography variant="subtitle1">
                        <strong>General Information:</strong>
                        <div dangerouslySetInnerHTML={{ __html: cruise.vessel.brand.general_info }} />
                      </Typography>
                    )}
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Port Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Port Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Port ID:</strong> {cruise.port.id}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Port Name:</strong> {cruise.port.name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Port Code:</strong> {cruise.port.code}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Country:</strong> {cruise.port.country.name} (ID: {cruise.port.country.id})
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Cruise Stops */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Cruise Itinerary
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Arrival</TableCell>
                    <TableCell>Departure</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(cruise.stops_daily || {}).map(([date, stops]) => (
                    stops.map((stop, index) => (
                      <TableRow key={`${date}-${index}`}>
                        <TableCell>
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">{stop.port.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stop.port.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{stop.port.country.name}</TableCell>
                        <TableCell>
                          {stop.arrival ? (
                            new Date(stop.arrival_raw).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {stop.departure ? (
                            new Date(stop.departure_raw).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CruiseDetails; 