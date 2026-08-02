import React from 'react';
import { Box } from '@mui/material';

/**
 * Cinema bezel + lit screen surface.
 * Pass scrollable to let long content scroll inside the screen.
 */
const CinemaScreen = ({
  children,
  maxWidth = 940,
  scrollable = false,
  maxHeight,
  sx = {},
}) => (
  <Box
    sx={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      alignItems: scrollable ? 'stretch' : 'center',
      justifyContent: 'center',
      px: { xs: 0.25, sm: 1.5 },
      pb: { xs: 0.5, sm: 1 },
      ...sx,
    }}
  >
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: scrollable ? 1 : undefined,
        animation: 'screenRise 0.55s ease both',
        '@keyframes screenRise': {
          from: { opacity: 0, transform: 'translateY(10px) scale(0.985)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          top: { xs: -28, sm: -40 },
          height: { xs: 48, sm: 70 },
          background:
            'linear-gradient(180deg, rgba(212,160,23,0.16) 0%, rgba(244,239,230,0.04) 55%, transparent 100%)',
          clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)',
          filter: 'blur(1px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: '7px', sm: '11px' },
          borderRadius: { xs: '10px', sm: '14px' },
          background: 'linear-gradient(160deg, #3a342c 0%, #1a1612 38%, #0f0d0b 72%, #2a241c 100%)',
          border: '1px solid rgba(212, 160, 23, 0.22)',
          boxShadow: `
            0 24px 48px rgba(0,0,0,0.55),
            0 0 0 1px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(244,239,230,0.12),
            inset 0 -1px 0 rgba(0,0,0,0.5)
          `,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          flex: scrollable ? 1 : undefined,
        }}
      >
        <Box
          sx={{
            p: '2px',
            borderRadius: { xs: '7px', sm: '10px' },
            background:
              'linear-gradient(180deg, rgba(230,220,200,0.45) 0%, rgba(120,105,80,0.35) 45%, rgba(60,52,40,0.7) 100%)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flex: scrollable ? 1 : undefined,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              borderRadius: { xs: '5px', sm: '8px' },
              overflow: scrollable ? 'hidden' : 'hidden',
              p: { xs: 1, sm: 1.5 },
              background: `
                radial-gradient(ellipse 90% 70% at 50% 35%, rgba(244,239,230,0.09) 0%, transparent 60%),
                linear-gradient(180deg, #2a2722 0%, #141210 55%, #0c0b0a 100%)
              `,
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.45), inset 0 0 28px rgba(212,160,23,0.05)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              flex: scrollable ? 1 : undefined,
              maxHeight: maxHeight || undefined,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 2,
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(244,239,230,0.04) 50%, transparent 60%)',
                animation: 'screenSheen 7s ease-in-out infinite',
              },
              '@keyframes screenSheen': {
                '0%, 100%': { opacity: 0.35, transform: 'translateX(-8%)' },
                '50%': { opacity: 0.7, transform: 'translateX(8%)' },
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                minHeight: 0,
                flex: scrollable ? 1 : undefined,
                overflowY: scrollable ? 'auto' : 'visible',
                overflowX: 'hidden',
                pr: scrollable ? 0.5 : 0,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(212,160,23,0.35)',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        aria-hidden
        sx={{
          height: { xs: 5, sm: 7 },
          mx: { xs: '6%', sm: '10%' },
          mt: 0.6,
          flexShrink: 0,
          borderRadius: '0 0 6px 6px',
          background: 'linear-gradient(180deg, #4a4034 0%, #1c1814 100%)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          opacity: 0.95,
        }}
      />
    </Box>
  </Box>
);

export default CinemaScreen;
