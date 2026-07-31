import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/** Visual share card for rankings — copy link + screenshot-friendly layout */
const ShareCard = ({ username, rankings = [], shareUrl, onCopy }) => {
  const top = rankings.slice(0, 5);

  return (
    <Box
      sx={{
        border: '1px solid rgba(244,239,230,0.12)',
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: '#141210',
      }}
    >
      <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, rgba(212,160,23,0.18), transparent)' }}>
        <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--rl-cream)', lineHeight: 1 }}>
          ReelList
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', mt: 0.5 }}>
          {username ? `${username}'s top films` : 'My top films'}
        </Typography>
      </Box>
      <Box sx={{ px: 2.5, py: 2 }}>
        {top.map((r, i) => (
          <Box key={r.id || i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.25 }}>
            <Typography sx={{ width: 28, fontFamily: '"Bebas Neue", sans-serif', color: 'var(--rl-accent)', fontSize: '1.2rem' }}>
              #{i + 1}
            </Typography>
            {r.posterUrl && (
              <Box component="img" src={r.posterUrl} alt="" sx={{ width: 28, height: 42, objectFit: 'cover', borderRadius: '2px' }} />
            )}
            <Typography sx={{ color: 'var(--rl-cream)', fontSize: '0.95rem', fontWeight: 600 }}>
              {r.title}
            </Typography>
          </Box>
        ))}
        {rankings.length > 5 && (
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mt: 1 }}>
            +{rankings.length - 5} more
          </Typography>
        )}
      </Box>
      {shareUrl && (
        <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ flex: 1, color: 'var(--rl-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shareUrl}
          </Typography>
          <Button size="small" onClick={onCopy} sx={{ color: '#140f0a', backgroundColor: 'var(--rl-accent)', backgroundImage: 'none', '&:hover': { backgroundColor: 'var(--rl-accent-hover)', backgroundImage: 'none' } }}>
            Copy
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ShareCard;
