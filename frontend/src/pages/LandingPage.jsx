import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Chip,
  Avatar,
  Stack,
  Slider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ErrorIcon from '@mui/icons-material/Error';
import CalculateIcon from '@mui/icons-material/Calculate';
import RegisterModal from '../components/RegisterModal';
import { membersApi } from '../services/api';

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const LandingPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [testSponsorCode, setTestSponsorCode] = useState('');
  const [testSponsorResult, setTestSponsorResult] = useState(null);
  const [testSearching, setTestSearching] = useState(false);
  const [testError, setTestError] = useState('');

  // Commission Calculator State
  const [directReferrals, setDirectReferrals] = useState(5);
  const [downlineDepth, setDownlineDepth] = useState(3);
  const [repurchaseAmountPerMember, setRepurchaseAmountPerMember] = useState(2500);

  // Calculate estimated earnings based on unilevel model
  const estimatedEarnings = useMemo(() => {
    const directBonus = directReferrals * 1000;
    let totalDownlineCount = 0;
    for (let l = 1; l <= downlineDepth; l++) {
      totalDownlineCount += Math.pow(directReferrals > 3 ? 3 : directReferrals, l);
    }
    const levelEarnings = totalDownlineCount * 250;
    const monthlyRepurchaseIncome = (totalDownlineCount + directReferrals) * (repurchaseAmountPerMember * 0.025);
    const totalFirstMonth = directBonus + levelEarnings + monthlyRepurchaseIncome;

    return {
      directBonus,
      levelEarnings,
      monthlyRepurchaseIncome,
      totalFirstMonth,
      totalDownlineCount,
    };
  }, [directReferrals, downlineDepth, repurchaseAmountPerMember]);

  // Sponsor Verification in Hero
  const handleCheckSponsor = async () => {
    if (!testSponsorCode || !testSponsorCode.trim()) return;
    const q = testSponsorCode.trim();
    setTestSearching(true);
    setTestError('');
    setTestSponsorResult(null);

    try {
      const res = await membersApi.getAll({ search: q, limit: 10 });
      const list = Array.isArray(res) ? res : res?.data || res?.items || [];
      let matched = list.find(
        (m) =>
          m.memberCode?.toLowerCase() === q.toLowerCase() ||
          String(m.id).toLowerCase() === q.toLowerCase() ||
          m.email?.toLowerCase() === q.toLowerCase()
      );

      if (!matched && list.length > 0) {
        matched =
          list.find(
            (m) =>
              m.memberCode?.toLowerCase().includes(q.toLowerCase()) ||
              m.name?.toLowerCase().includes(q.toLowerCase())
          ) || list[0];
      }

      if (matched) {
        setTestSponsorResult({
          name: matched.name || matched.memberName || 'Verified Sponsor',
          memberCode: matched.memberCode || matched.referralCode || q,
          id: matched.id,
        });
      } else {
        setTestError(`Sponsor code "${q}" not found in network.`);
      }
    } catch {
      setTestError(`Could not verify sponsor code "${q}".`);
    } finally {
      setTestSearching(false);
    }
  };

  const handleOpenRegisterWithCode = (code = '') => {
    setTestSponsorCode(code);
    setRegisterModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', color: '#0F172A', fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden' }}>
      {/* 1. REFRAMED ULTRA-SLEEK GLASSMORPHIC NAVBAR */}
      <Box
        component="header"
        sx={{
          bgcolor: 'rgba(2, 44, 34, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: { xs: 64, sm: 74 } }}>
            {/* Left Brand Logo & Name */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 1.5 },
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Box
                component="img"
                src="/favicon.svg"
                alt="AAKASH E MART Logo"
                sx={{
                  width: { xs: 36, sm: 44 },
                  height: { xs: 36, sm: 44 },
                  borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(217, 119, 6, 0.3)',
                  border: '1.5px solid rgba(217, 119, 6, 0.5)',
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  AAKASH E MART
                </Typography>
                <Typography variant="caption" sx={{ color: '#FBBF24', fontWeight: 800, letterSpacing: { xs: '0.8px', sm: '1.5px' }, fontSize: { xs: '0.55rem', sm: '0.68rem' } }}>
                  UNILEVEL NETWORK PLATFORM
                </Typography>
              </Box>
            </Box>

            {/* Desktop Action Buttons: Login & Register */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}>
              {token ? (
                <Button
                  variant="contained"
                  onClick={() => navigate('/')}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    bgcolor: '#D97706',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                    '&:hover': { bgcolor: '#B45309', transform: 'translateY(-1px)' },
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    startIcon={<LoginIcon fontSize="small" />}
                    sx={{
                      color: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.35)',
                      fontWeight: 700,
                      borderRadius: 3,
                      px: 2.8,
                      py: 0.8,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        borderColor: '#FBBF24',
                        color: '#FBBF24',
                        bgcolor: 'rgba(251, 191, 36, 0.1)',
                      },
                    }}
                  >
                    Member Login
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setRegisterModalOpen(true)}
                    startIcon={<PersonAddIcon fontSize="small" />}
                    sx={{
                      fontWeight: 900,
                      borderRadius: 3,
                      px: 3,
                      py: 0.8,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 6px 20px rgba(217, 119, 6, 0.4)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 25px rgba(217, 119, 6, 0.5)',
                      },
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Stack>

            {/* Mobile Hamburger Menu Icon Button */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ color: '#FFFFFF' }}>
                <MenuIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mobile Navigation Slide-Out Drawer */}
      <Paper
        component="div"
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '80%',
            maxWidth: 300,
            bgcolor: '#022C22',
            zIndex: 1300,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            color: '#FFFFFF',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FBBF24' }}>
              AAKASH E MART
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: '#FFFFFF' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={2} sx={{ mt: 1 }}>
            {token ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                sx={{ py: 1.2, fontWeight: 800, bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  startIcon={<LoginIcon />}
                  sx={{ py: 1.2, color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                >
                  Member Login
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setRegisterModalOpen(true);
                  }}
                  startIcon={<PersonAddIcon />}
                  sx={{ py: 1.2, fontWeight: 900, bgcolor: '#D97706', color: '#FFFFFF' }}
                >
                  Register Now
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {mobileMenuOpen && (
          <Box
            onClick={() => setMobileMenuOpen(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1250,
            }}
          />
        )}
      </Paper>

      {/* 2. REFRAMED HERO SECTION WITH EMBEDDED SPONSOR LOOKUP CARD */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #022C22 0%, #064E3B 50%, #047857 100%)',
          color: '#FFFFFF',
          pt: { xs: 7, md: 10 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} md={6.5}>
              <Chip
                icon={<VerifiedIcon sx={{ color: '#FBBF24 !important' }} />}
                label="Strict 2-Step Verified Member Network"
                sx={{
                  bgcolor: 'rgba(217, 119, 6, 0.2)',
                  color: '#FBBF24',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  mb: 3,
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: { xs: 1.2, md: 1.1 },
                  fontSize: { xs: '1.95rem', sm: '2.8rem', md: '3.6rem' },
                  mb: 2.5,
                }}
              >
                Build Your Network & Earn <span style={{ color: '#FBBF24' }}>Direct & Multi-Level</span> Income
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  fontSize: { xs: '0.98rem', sm: '1.15rem' },
                  mb: 4,
                  maxWidth: 580,
                }}
              >
                Join AAKASH E MART to build your unilevel network branch, receive direct referral rewards, level bonuses, and recurring repurchase cashback from grocery purchases.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setRegisterModalOpen(true)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#D97706',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    boxShadow: '0 10px 25px rgba(217, 119, 6, 0.4)',
                    '&:hover': { bgcolor: '#B45309' },
                  }}
                >
                  Join Network Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    py: 1.5,
                    px: 3.5,
                    borderRadius: 3,
                    '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  Member Portal Login
                </Button>
              </Stack>

              {/* Floating Glass Badges */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.15)', textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#FBBF24', fontSize: { xs: '1.4rem', sm: '1.6rem' } }}>
                      10,000+
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      Active Members
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.15)', textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#34D399', fontSize: { xs: '1.4rem', sm: '1.6rem' } }}>
                      ₹50L+
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      Disbursed Payouts
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.15)', textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#60A5FA', fontSize: { xs: '1.4rem', sm: '1.6rem' } }}>
                      100%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      OTP Email Verified
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Right Side: Embedded Sponsor Lookup & Registration Card */}
            <Grid item xs={12} md={5.5} id="sponsor-lookup">
              <Paper
                elevation={16}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  color: '#0F172A',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '2px solid #D97706',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#022C22', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon color="secondary" /> Step 1: Sponsor Referral Code Lookup
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter the Sponsor Code of the associate who invited you to verify their network standing before registering.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Sponsor Referral Code"
                    variant="outlined"
                    fullWidth
                    value={testSponsorCode}
                    onChange={(e) => setTestSponsorCode(e.target.value)}
                    placeholder="e.g. AK10001"
                    slotProps={{
                      input: {
                        endAdornment: testSearching ? <CircularProgress size={20} /> : null,
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    onClick={handleCheckSponsor}
                    disabled={testSearching || !testSponsorCode}
                    sx={{ py: 1.4, fontWeight: 800, bgcolor: '#064E3B', '&:hover': { bgcolor: '#022C22' } }}
                  >
                    Verify Sponsor Code
                  </Button>

                  {testSponsorResult ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: '#F0FDF4',
                        borderColor: '#BBF7D0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#166534' }}>
                            Verified Sponsor: {testSponsorResult.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#15803D' }}>
                            Sponsor Code: <strong>{testSponsorResult.memberCode}</strong> (ID: {testSponsorResult.id})
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => handleOpenRegisterWithCode(testSponsorResult.memberCode)}
                        sx={{ fontWeight: 800, py: 1 }}
                      >
                        Register Under {testSponsorResult.name}
                      </Button>
                    </Paper>
                  ) : testError ? (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FEF2F2', borderColor: '#FECACA', display: 'flex', gap: 1.5 }}>
                      <ErrorIcon color="error" />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#991B1B' }}>
                        {testError}
                      </Typography>
                    </Paper>
                  ) : (
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={() => handleOpenRegisterWithCode('AK10001')}
                      sx={{ py: 1.2, fontWeight: 700, borderStyle: 'dashed' }}
                    >
                      Register with Default Root Sponsor (AK10001)
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. INTERACTIVE EARNINGS & COMMISSION CALCULATOR */}
      <Container id="calculator" maxWidth="lg" sx={{ my: 10 }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid #E2E8F0',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip icon={<CalculateIcon />} label="INTERACTIVE INCOME CALCULATOR" color="secondary" sx={{ fontWeight: 800, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#022C22' }}>
              Simulate Your Unilevel Network Potential
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adjust the sliders below to estimate your potential direct bonuses, level commissions, and monthly repurchase earnings.
            </Typography>
          </Box>

          <Grid container spacing={5} alignItems="center">
            {/* Sliders */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Direct Referrals Invited by You: <span style={{ color: '#D97706', fontSize: '1.1rem' }}>{directReferrals} Members</span>
                  </Typography>
                  <Slider
                    value={directReferrals}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(e, val) => setDirectReferrals(val)}
                    color="secondary"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Downline Level Depth: <span style={{ color: '#D97706', fontSize: '1.1rem' }}>Level {downlineDepth}</span>
                  </Typography>
                  <Slider
                    value={downlineDepth}
                    min={1}
                    max={7}
                    step={1}
                    onChange={(e, val) => setDownlineDepth(val)}
                    color="secondary"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Avg Monthly E-Store Repurchase per Member: <span style={{ color: '#059669', fontSize: '1.1rem' }}>₹{repurchaseAmountPerMember}</span>
                  </Typography>
                  <Slider
                    value={repurchaseAmountPerMember}
                    min={1000}
                    max={10000}
                    step={500}
                    onChange={(e, val) => setRepurchaseAmountPerMember(val)}
                    color="success"
                  />
                </Box>
              </Stack>
            </Grid>

            {/* Income Results Box */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  bgcolor: '#064E3B',
                  color: '#FFFFFF',
                  borderRadius: 3.5,
                  border: '2px solid #059669',
                }}
              >
                <Typography variant="overline" sx={{ letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Estimated Network Earnings (1st Month Projection)
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FBBF24', my: 1 }}>
                  ₹{estimatedEarnings.totalFirstMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 3 }}>
                  Based on {estimatedEarnings.totalDownlineCount + directReferrals} total downline network associates.
                </Typography>

                <Stack spacing={1.5} sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Direct Referral Bonus (10%):</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#34D399' }}>
                      ₹{estimatedEarnings.directBonus.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Unilevel Matrix Level Income:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#60A5FA' }}>
                      ₹{estimatedEarnings.levelEarnings.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Monthly Repurchase BV Cashback:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FBBF24' }}>
                      ₹{estimatedEarnings.monthlyRepurchaseIncome.toLocaleString()} / mo
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* 4. 3-STREAM COMPENSATION MATRIX CARDS */}
      <Container id="matrix" maxWidth="lg" sx={{ mb: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip label="3-STREAM COMPENSATION MATRIX" color="secondary" sx={{ fontWeight: 800, mb: 1.5 }} />
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#022C22' }}>
            Multiple Streams of Income
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 650, mx: 'auto' }}>
            Earn from direct onboarding rewards, deep unilevel downline levels, and recurring grocery purchases.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3.5, p: 1, height: '100%', border: '1px solid #E2E8F0', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-6px)' } }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 60, height: 60, mb: 2 }}>
                  <GroupAddIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  1. Direct Referral Bonus
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                  Receive instant 10% direct referral commission credited to your wallet whenever a new Associate joins with your referral code.
                </Typography>
                <Chip label="Instant Wallet Credit" color="success" size="small" sx={{ fontWeight: 700 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3.5, p: 1, height: '100%', border: '1px solid #E2E8F0', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-6px)' } }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 60, height: 60, mb: 2 }}>
                  <AccountTreeIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  2. Unilevel Matrix Income
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                  Earn level percentages across multi-level network depth. Track your unilevel tree and upline payouts dynamically.
                </Typography>
                <Chip label="Multi-Level Depth" color="warning" size="small" sx={{ fontWeight: 700 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3.5, p: 1, height: '100%', border: '1px solid #E2E8F0', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-6px)' } }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 60, height: 60, mb: 2 }}>
                  <ShoppingBagIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  3. Repurchase E-Store BV
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                  Earn recurring monthly BV cashback every time downline members buy groceries and household items from the E-Store.
                </Typography>
                <Chip label="Recurring Monthly Income" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* 5. VERIFIED ONBOARDING TIMELINE */}
      <Box id="onboarding" sx={{ bgcolor: '#022C22', color: '#FFFFFF', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip label="3-STEP VERIFIED JOIN FLOW" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#FBBF24', fontWeight: 800, mb: 1.5 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
              How to Join AAKASH E-COM
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3.5, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FBBF24', mb: 1 }}>
                  01
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#FFFFFF' }}>
                  Get Sponsor Code
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Enter the Sponsor Code of the existing network associate who invited you (e.g. AK10001).
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3.5, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#34D399', mb: 1 }}>
                  02
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#FFFFFF' }}>
                  Verify Email 6-Digit OTP
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Enter your email address to receive a secure 6-digit OTP code dispatched via EmailService.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3.5, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#60A5FA', mb: 1 }}>
                  03
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#FFFFFF' }}>
                  Access Member Portal
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Auto-login to your Member Dashboard to view your member code, build your downline tree, and monitor weekly payouts.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. FOOTER */}
      <Box sx={{ bgcolor: '#011F18', color: '#FFFFFF', py: 5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                AAKASH E-COM
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                &copy; {new Date().getFullYear()} AAKASH E-COM Network Platform. All rights reserved.
              </Typography>
            </Box>

            <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} flexWrap="wrap">
              <Button onClick={() => navigate('/terms-and-conditions')} sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Terms & Conditions
              </Button>
              <Button onClick={() => navigate('/privacy-policy')} sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Privacy Policy
              </Button>
              <Button onClick={() => setRegisterModalOpen(true)} sx={{ color: '#FBBF24', fontWeight: 800 }}>
                Join Network
              </Button>
              <Button onClick={() => navigate('/login')} sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                Member Login
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* REGISTRATION MODAL */}
      <RegisterModal open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} defaultSponsorCode={testSponsorCode} />
    </Box>
  );
};

export default LandingPage;
