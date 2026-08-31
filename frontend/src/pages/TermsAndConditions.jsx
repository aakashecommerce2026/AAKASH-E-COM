import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { TERMS_POINTS } from '../components/TermsAndConditionsModal';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 5, fontFamily: 'Inter, sans-serif' }}>
      <Container maxWidth="lg">
        {/* Navigation / Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2, fontWeight: 700, color: '#022C22' }}
          >
            Back
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: '#022C22',
              color: '#FFFFFF',
              borderRadius: 3.5,
              background: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)',
              boxShadow: '0 10px 30px rgba(2, 44, 34, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  bgcolor: '#FBBF24',
                  color: '#022C22',
                  p: 1.5,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GavelIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                  Terms & Conditions
                </Typography>
                <Typography variant="body1" sx={{ color: '#FBBF24', fontWeight: 700 }}>
                  AAKASH E-COM Network Platform Policy (Official 20 Points)
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* 20 Points Grid */}
        <Grid container spacing={2.5}>
          {TERMS_POINTS.map((point) => (
            <Grid item xs={12} md={6} key={point.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                    borderColor: '#FBBF24',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`Point #${point.id}`}
                    sx={{ bgcolor: '#022C22', color: '#FBBF24', fontWeight: 800 }}
                  />
                  <Chip
                    label={point.category}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 700, borderColor: '#CBD5E1', color: '#475569' }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                  {point.title}
                </Typography>

                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, flexGrow: 1 }}>
                  {point.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Footer info */}
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            For further queries regarding product dispatches, repurchases, or payouts, contact AAKASH E-COM Official Support.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TermsAndConditions;
