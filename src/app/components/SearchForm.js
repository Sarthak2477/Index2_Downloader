"use client";
import { useState, useEffect } from "react";
import axios from "axios";
<<<<<<< HEAD
import {
  TextField, Button, Container, Typography, CircularProgress,
=======
import { 
  TextField, Button, Container, Typography, CircularProgress, 
>>>>>>> 5d02fc4 (Initial commit)
  Box, Snackbar, Alert, List, ListItem, Paper, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Dark Mode Theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
<<<<<<< HEAD
    primary: { main: "#1976d2" },
    secondary: { main: "#d32f2f" },
    background: { default: "#121212", paper: "#1e1e1e" },
    text: { primary: "#ffffff" },
=======
    primary: {
      main: "#1976d2", 
    },
    secondary: {
      main: "#d32f2f", 
    },
    background: {
      default: "#121212", 
      paper: "#1e1e1e", 
    },
    text: {
      primary: "#ffffff", 
    },
>>>>>>> 5d02fc4 (Initial commit)
  },
});

const SearchForm = () => {
  const [formData, setFormData] = useState({
    year: "2025",
    district: "",
    tahsil: "",
    village: "",
    propertyNo: "",
  });

  const [translatedData, setTranslatedData] = useState({ ...formData });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const years = Array.from({ length: 2024 - 1985 + 1 }, (_, i) => (2024 - i).toString());

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const translateToMarathi = async (text) => {
    try {
      const response = await fetch(`/api/translate?text=${encodeURIComponent(text)}`);
<<<<<<< HEAD
=======
      console.log("Scrape API Response:", response.data);

>>>>>>> 5d02fc4 (Initial commit)
      const data = await response.json();
      return data.transliterated;
    } catch (error) {
      console.error(`Error transliterating "${text}":`, error);
      return text;
    }
  };

  useEffect(() => {
    const translateFields = async () => {
      setLoading(true);
      const translatedDistrict = await translateToMarathi(formData.district);
      const translatedTahsil = await translateToMarathi(formData.tahsil);
      const translatedVillage = await translateToMarathi(formData.village);

      setTranslatedData({
        ...formData,
        district: translatedDistrict,
        tahsil: translatedTahsil,
        village: translatedVillage,
      });
      setLoading(false);
    };

    translateFields();
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/scrape", translatedData);
      if (response.data.length === 0) {
        setErrorMessage("No record found! Please check your details.");
      } else {
        setResults(response.data);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred while fetching records.");
    }

    setLoading(false);
  };

<<<<<<< HEAD
  const handleDownload = (link) => {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = link.split("/").pop();
=======
  // Function to download a single file
  const handleDownload = (link) => {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank"; 
    a.rel = "noopener noreferrer"; // Security best practice
    a.download = link.split("/").pop(); // Suggests downloading the file
>>>>>>> 5d02fc4 (Initial commit)
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Paper elevation={6} sx={{ padding: 4, borderRadius: 2, textAlign: "center", backgroundColor: "background.paper" }}>
          <Typography variant="h4" gutterBottom>
            Search Property Records
          </Typography>
          <form onSubmit={handleSubmit}>
<<<<<<< HEAD
=======
            {/* Year Dropdown */}
>>>>>>> 5d02fc4 (Initial commit)
            <FormControl fullWidth margin="normal">
              <InputLabel>Year</InputLabel>
              <Select name="year" value={formData.year} onChange={handleChange}>
                {years.map((year) => (
<<<<<<< HEAD
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="District"
              name="district"
              value={formData.district}
              onChange={handleChange}
              onBlur={() => translateFields()}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Tahsil"
              name="tahsil"
              value={formData.tahsil}
              onChange={handleChange}
              onBlur={() => translateFields()}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Village"
              name="village"
              value={formData.village}
              onChange={handleChange}
              onBlur={() => translateFields()}
            />

            <TextField fullWidth margin="normal" label="Property No" name="propertyNo" value={formData.propertyNo} onChange={handleChange} />

=======
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField fullWidth margin="normal" label="District" name="district" value={formData.district} onChange={handleChange} />
            <TextField fullWidth margin="normal" label="Tahsil" name="tahsil" value={formData.tahsil} onChange={handleChange} />
            <TextField fullWidth margin="normal" label="Village" name="village" value={formData.village} onChange={handleChange} />
            <TextField fullWidth margin="normal" label="Property No" name="propertyNo" value={formData.propertyNo} onChange={handleChange} />
            
>>>>>>> 5d02fc4 (Initial commit)
            <Box mt={2} display="flex" justifyContent="center">
              <Button variant="contained" color="primary" type="submit" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Search"}
              </Button>
            </Box>
          </form>

<<<<<<< HEAD
          <Typography variant="h6" mt={3}>Results:</Typography>
=======
          <Typography variant="h6" mt={3}>
            Results:
          </Typography>

          {/* Display individual download buttons for each result, centered horizontally */}
>>>>>>> 5d02fc4 (Initial commit)
          {results.length > 0 ? (
            <List>
              {results.map((link, index) => (
                <ListItem key={index} sx={{ justifyContent: "center" }}>
                  <Button variant="contained" color="secondary" onClick={() => handleDownload(link)}>
                    Download Index2 File {index + 1}
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
<<<<<<< HEAD
            <Typography></Typography>
          )}

          <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage("")}>
            <Alert severity="error" onClose={() => setErrorMessage("")}>{errorMessage}</Alert>
=======
            <Typography>No records found.</Typography>
          )}

          {/* Snackbar for Error Messages */}
          <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage("")}>
            <Alert severity="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
>>>>>>> 5d02fc4 (Initial commit)
          </Snackbar>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SearchForm;
