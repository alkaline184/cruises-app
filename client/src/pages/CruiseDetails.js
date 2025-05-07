import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  Card,
  CardMedia,
  Divider,
} from '@mui/material';
import axios from 'axios';

const CruiseDetails = () => {
  const { id } = useParams();
  const [cruise, setCruise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCruiseDetails();
  }, [id]);

  const fetchCruiseDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/cruises/${id}`);
      setCruise(response.data);
    } catch (error) {
      console.error('Error fetching cruise details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!cruise) {
    return (
      <Container>
        <Typography>Cruise not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={cruise.imageUrl}
                alt={cruise.name}
              />
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {cruise.name}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              ${cruise.price}
            </Typography>
            <Typography variant="body1" paragraph>
              {cruise.description}
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Cruise Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Cruise Line:</strong> {cruise.cruiseLine}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {cruise.duration} days
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Port of Departure:</strong> {cruise.portOfDeparture}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Departure Date:</strong> {new Date(cruise.departureDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Itinerary
              </Typography>
              {cruise.itinerary.map((port, index) => (
                <Typography key={index} variant="body2" paragraph>
                  Day {index + 1}: {port}
                </Typography>
              ))}
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                // Handle watch functionality
              }}
            >
              Watch This Cruise
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CruiseDetails; 