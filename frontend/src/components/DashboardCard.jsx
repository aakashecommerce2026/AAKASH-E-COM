import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Modern Minimalist Dashboard Card Component
 * Enforces STRICT FIXED DIMENSIONS: 275px width x 200px height.
 * Eliminates dynamic percentage stretching across window resizes.
 */
export const DashboardCard = ({
  title,
  value,
  subtitle,
  chipLabel,
  icon,
  onClick,
  actionText = 'View Details',
  loading = false,
  themeConfig
}) => {
  const {
    mainColor = '#3B82F6',
    iconGradient = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
  } = themeConfig || {};

  return (
    <Card
      onClick={onClick}
      sx={{
        height: 200,
        minHeight: 200,
        maxHeight: 200,
        width: { xs: '100%', sm: 275 },
        minWidth: { xs: '100%', sm: 275 },
        maxWidth: { xs: '100%', sm: 275 },
        flexShrink: 0,
        flexGrow: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderLeft: `5px solid ${mainColor}`,
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
          borderColor: '#CBD5E1',
          borderLeftColor: mainColor,
          '& .action-arrow': {
            transform: 'translateX(3px)'
          }
        }
      }}
    >
      <CardContent
        sx={{
          p: 2.25,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          boxSizing: 'border-box',
          '&:last-child': { pb: 2.25 }
        }}
      >
        {/* Header Row: Equalized 32px height for all cards */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
          <Box
            sx={{
              background: iconGradient,
              p: 1,
              borderRadius: 2,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: `0 4px 12px ${mainColor}35`
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 20 } })}
          </Box>

          {chipLabel ? (
            <Chip
              label={chipLabel}
              size="small"
              sx={{
                bgcolor: `${mainColor}12`,
                color: mainColor,
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 24,
                border: `1px solid ${mainColor}25`
              }}
            />
          ) : <Box sx={{ height: 24 }} />}
        </Box>

        {/* Main Metric Value: Equalized title & value box */}
        <Box sx={{ my: 'auto', py: 0.5 }}>
          <Typography
            noWrap
            variant="caption"
            sx={{
              color: '#64748B',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              mb: 0.3,
              fontSize: '0.68rem',
              lineHeight: 1.3
            }}
          >
            {title}
          </Typography>

          <Typography
            noWrap
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontSize: '1.35rem',
              lineHeight: 1.2
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : value}
          </Typography>
        </Box>

        {/* Footer Row: Equalized 26px height */}
        <Box
          sx={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            minHeight: 26,
            pt: 1,
            borderTop: '1px solid #F1F5F9'
          }}
        >
          <Typography
            noWrap
            variant="caption"
            sx={{
              color: '#64748B',
              fontWeight: 600,
              fontSize: '0.7rem'
            }}
          >
            {subtitle}
          </Typography>

          {onClick && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: mainColor,
                fontWeight: 700,
                fontSize: '0.72rem',
                gap: 0.5,
                flexShrink: 0
              }}
            >
              {actionText}{' '}
              <ArrowForwardIcon
                className="action-arrow"
                sx={{ fontSize: 13, transition: 'transform 0.2s ease' }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
