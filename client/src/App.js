import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import SearchPage from './components/SearchPage';
import WatchedCruises from './components/WatchedCruises';
import CruiseDetails from './components/CruiseDetails';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/watched" element={<WatchedCruises />} />
          <Route path="/cruise/:id" element={<CruiseDetails />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
