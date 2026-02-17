import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Badge
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import api from '../config/axios';

const MovieFilters = ({
  filters,
  onFiltersChange,
  showRatingRange = true,
  showSearchWithin = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    setLoadingGenres(true);
    try {
      const response = await api.get('/api/movies/genres');
      setGenres(response.data.genres || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
      setGenres([]);
    } finally {
      setLoadingGenres(false);
    }
  };

  const handleGenreToggle = (genreId) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter(id => id !== genreId)
      : [...currentGenres, genreId];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleDecadeToggle = (decade) => {
    const currentDecades = filters.decades || [];
    const newDecades = currentDecades.includes(decade)
      ? currentDecades.filter(d => d !== decade)
      : [...currentDecades, decade];
    onFiltersChange({ ...filters, decades: newDecades });
  };

  const handleYearRangeChange = (event, newValue) => {
    onFiltersChange({ ...filters, yearRange: newValue });
  };

  const handleRatingRangeChange = (event, newValue) => {
    onFiltersChange({ ...filters, ratingRange: newValue });
  };

  const handleSortChange = (event) => {
    onFiltersChange({ ...filters, sortBy: event.target.value });
  };

  const handleSearchChange = (event) => {
    onFiltersChange({ ...filters, searchQuery: event.target.value });
  };

  const clearFilters = () => {
    onFiltersChange({
      genres: [],
      decades: [],
      yearRange: [1900, new Date().getFullYear() + 1],
      ratingRange: [1, 10],
      sortBy: showRatingRange ? 'rating' : 'popularity',
      searchQuery: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.genres?.length > 0) count++;
    if (filters.decades?.length > 0) count++;
    if (filters.yearRange && (filters.yearRange[0] !== 1900 || filters.yearRange[1] !== new Date().getFullYear() + 1)) count++;
    if (filters.ratingRange && (filters.ratingRange[0] !== 1 || filters.ratingRange[1] !== 10)) count++;
    if (filters.sortBy && filters.sortBy !== 'rating') count++;
    if (filters.searchQuery?.trim().length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const decades = [
    { label: '2020s', value: 2020 },
    { label: '2010s', value: 2010 },
    { label: '2000s', value: 2000 },
    { label: '1990s', value: 1990 },
    { label: '1980s', value: 1980 },
    { label: '1970s', value: 1970 },
    { label: '1960s', value: 1960 },
    { label: '1950s', value: 1950 },
    { label: 'Older', value: 0 }
  ];

  const getSortOptions = () => {
    if (showRatingRange) {
      // For rankings page
      return [
        { value: 'rating', label: 'Rating (Best to Worst)' },
        { value: 'rating-asc', label: 'Rating (Worst to Best)' },
        { value: 'date-added', label: 'Date Added (Newest)' },
        { value: 'date-added-desc', label: 'Date Added (Oldest)' },
        { value: 'release-date', label: 'Release Date (Newest)' },
        { value: 'release-date-desc', label: 'Release Date (Oldest)' },
        { value: 'title', label: 'Title (A-Z)' },
        { value: 'title-desc', label: 'Title (Z-A)' }
      ];
    } else {
      // For search page
      return [
        { value: 'popularity', label: 'Popularity (Highest)' },
        { value: 'popularity-asc', label: 'Popularity (Lowest)' },
        { value: 'rating', label: 'Rating (Best to Worst)' },
        { value: 'rating-asc', label: 'Rating (Worst to Best)' },
        { value: 'release-date', label: 'Release Date (Newest)' },
        { value: 'release-date-desc', label: 'Release Date (Oldest)' },
        { value: 'title', label: 'Title (A-Z)' },
        { value: 'title-desc', label: 'Title (Z-A)' }
      ];
    }
  };

  const sortOptions = getSortOptions();

  const filterContent = (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant={activeFilterCount > 0 ? "contained" : "outlined"}
            size="small"
            onClick={clearFilters}
            startIcon={<ClearIcon />}
            disabled={activeFilterCount === 0}
            sx={{
              ...(activeFilterCount > 0 ? {
                backgroundColor: '#ff6b35',
                color: '#ffffff',
                border: '1px solid #ff6b35',
                '&:hover': {
                  backgroundColor: '#e64a19',
                  borderColor: '#e64a19',
                },
              } : {
                borderColor: 'rgba(255, 107, 53, 0.3)',
                color: 'rgba(255, 107, 53, 0.5)',
              }),
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 2,
              textTransform: 'none',
            }}
          >
            Clear Filters
          </Button>
          {isMobile && (
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Search Within */}
      {showSearchWithin && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search within results..."
            value={filters.searchQuery || ''}
            onChange={handleSearchChange}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                color: '#ffffff',
                '& fieldset': {
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 212, 255, 0.6)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00d4ff',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Genre Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1.5, fontWeight: 600 }}>
          Genres
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {loadingGenres ? (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Loading genres...
            </Typography>
          ) : (
            genres.slice(0, 20).map((genre) => (
              <Chip
                key={genre.id}
                label={genre.name}
                onClick={() => handleGenreToggle(genre.id)}
                sx={{
                  backgroundColor: (filters.genres || []).includes(genre.id)
                    ? 'rgba(0, 212, 255, 0.3)'
                    : 'rgba(0, 212, 255, 0.1)',
                  color: (filters.genres || []).includes(genre.id)
                    ? '#00d4ff'
                    : 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid',
                  borderColor: (filters.genres || []).includes(genre.id)
                    ? '#00d4ff'
                    : 'rgba(0, 212, 255, 0.3)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  },
                }}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Decade Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1.5, fontWeight: 600 }}>
          Decades
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {decades.map((decade) => (
            <Chip
              key={decade.value}
              label={decade.label}
              onClick={() => handleDecadeToggle(decade.value)}
              sx={{
                backgroundColor: (filters.decades || []).includes(decade.value)
                  ? 'rgba(255, 107, 53, 0.3)'
                  : 'rgba(255, 107, 53, 0.1)',
                color: (filters.decades || []).includes(decade.value)
                  ? '#ff6b35'
                  : 'rgba(255, 255, 255, 0.7)',
                border: '1px solid',
                borderColor: (filters.decades || []).includes(decade.value)
                  ? '#ff6b35'
                  : 'rgba(255, 107, 53, 0.3)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 53, 0.2)',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Year Range */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1.5, fontWeight: 600 }}>
          Year Range: {filters.yearRange?.[0] || 1900} - {filters.yearRange?.[1] || new Date().getFullYear() + 1}
        </Typography>
        <Slider
          value={filters.yearRange || [1900, new Date().getFullYear() + 1]}
          onChange={handleYearRangeChange}
          min={1900}
          max={new Date().getFullYear() + 1}
          step={1}
          valueLabelDisplay="auto"
          sx={{
            color: '#00d4ff',
            '& .MuiSlider-thumb': {
              '&:hover': {
                boxShadow: '0 0 0 8px rgba(0, 212, 255, 0.16)',
              },
            },
          }}
        />
      </Box>

      {/* Rating Range */}
      {showRatingRange && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1.5, fontWeight: 600 }}>
            Rating Range: {filters.ratingRange?.[0] || 1} - {filters.ratingRange?.[1] || 10}
          </Typography>
          <Slider
            value={filters.ratingRange || [1, 10]}
            onChange={handleRatingRangeChange}
            min={1}
            max={10}
            step={0.1}
            valueLabelDisplay="auto"
            sx={{
              color: '#ff6b35',
              '& .MuiSlider-thumb': {
                '&:hover': {
                  boxShadow: '0 0 0 8px rgba(255, 107, 53, 0.16)',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Sort Options */}
      <Box>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sort By</InputLabel>
          <Select
            value={filters.sortBy || (showRatingRange ? 'rating' : 'popularity')}
            onChange={handleSortChange}
            label="Sort By"
            sx={{
              color: '#ffffff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 212, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 212, 255, 0.6)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00d4ff',
              },
              '& .MuiSvgIcon-root': {
                color: '#00d4ff',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: 'rgba(26, 26, 26, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  '& .MuiMenuItem-root': {
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 212, 255, 0.3)',
                      },
                    },
                  },
                },
              },
            }}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outlined"
          startIcon={
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterIcon />
            </Badge>
          }
          onClick={() => setOpen(true)}
          sx={{
            borderColor: '#00d4ff',
            color: '#00d4ff',
            '&:hover': {
              borderColor: '#66e0ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
            },
          }}
        >
          Filters
        </Button>
        <Drawer
          anchor="right"
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '85%', sm: 400 },
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(0, 212, 255, 0.2)',
            },
          }}
        >
          {filterContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterIcon />
            </Badge>
          }
          onClick={() => setOpen(!open)}
          sx={{
            borderColor: '#00d4ff',
            color: '#00d4ff',
            '&:hover': {
              borderColor: '#66e0ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
            },
          }}
        >
          {open ? 'Hide Filters' : 'Show Filters'}
        </Button>
        {activeFilterCount > 0 && (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </Typography>
        )}
      </Box>
      <Collapse in={open}>
        <Card
          sx={{
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            mb: 3,
          }}
        >
          {filterContent}
        </Card>
      </Collapse>
    </Box>
  );
};

export default MovieFilters;

