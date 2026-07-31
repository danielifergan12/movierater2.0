import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Skeleton } from '@mui/material';
import api from '../config/axios';

const HealthBanner = () => {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await api.get('/api/health', { timeout: 5000 });
        if (!cancelled) setDown(!res.data?.ok);
      } catch {
        if (!cancelled) setDown(true);
      }
    };
    check();
    const id = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!down) return null;

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1300 }}>
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
        sx={{ borderRadius: 0 }}
      >
        We’re having trouble reaching the database. Login and rankings may be unavailable.
      </Alert>
    </Box>
  );
};

export const MovieCardSkeleton = () => (
  <Box>
    <Skeleton variant="rectangular" sx={{ aspectRatio: '2/3', borderRadius: 1, bgcolor: 'rgba(244,239,230,0.06)' }} />
    <Skeleton width="80%" sx={{ mt: 1, bgcolor: 'rgba(244,239,230,0.06)' }} />
  </Box>
);

export default HealthBanner;
