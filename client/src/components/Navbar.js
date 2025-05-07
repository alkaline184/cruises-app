import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <DirectionsBoatIcon sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            Cruise Search
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
          >
            Search
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/watched"
          >
            Watched Cruises
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 