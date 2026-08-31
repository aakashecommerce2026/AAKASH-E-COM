import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                <ShieldIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                  Privacy Policy & Data Security
                </Typography>
                <Typography variant="body1" sx={{ color: '#FBBF24', fontWeight: 700 }}>
                  AAKASH E-COM Official Commitment to Member Privacy & Absolute Data Safety
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Highlighted Banner: Absolute Data Safety Guarantee */}
        <Paper
          elevation={0}
          sx={{
            p: 3.5,
            mb: 4,
            bgcolor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: 3.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2.5,
          }}
        >
          <Box
            sx={{
              bgcolor: '#10B981',
              color: '#FFFFFF',
              p: 1.5,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 0.5,
            }}
          >
            <VerifiedUserIcon fontSize="large" />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#065F46', mb: 0.5 }}>
              🛡️ 100% User Data Safety & Confidentiality Commitment
            </Typography>
            <Typography variant="body2" sx={{ color: '#047857', lineHeight: 1.7, fontSize: '0.95rem' }}>
              At <strong>AAKASH E-COM</strong>, we prioritize the absolute security and privacy of our members. All personal profile information, mobile numbers, physical shipping addresses, bank/UPI account credentials, and network downline records are stored in high-security encrypted environments. We guarantee that your information is kept completely safe, confidential, and protected from unauthorized access at all times.
            </Typography>
          </Box>
        </Paper>

        {/* Content grid sections */}
        <Grid container spacing={3}>
          {/* Section 1 */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon color="primary" /> 1. Information We Collect & Protect
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                To provide seamless product dispatch, repurchase order management, and automated weekly payouts, we collect and securely safeguard:
              </Typography>
              <List spacing={1}>
                {[
                  'Full Legal Name & Member Username',
                  'Contact Number & Official WhatsApp Phone Number',
                  'Complete Delivery Address (for door shipping within 7-15 days)',
                  'Verified Email Address (for 6-digit OTP security alerts)',
                  'Bank Account & UPI ID Details (strictly for weekly payout transfers)',
                  'Network Downline Hierarchy & Business Volume (BV) records',
                ].map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleOutlinedIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item} slotProps={{ primary: { fontSize: '0.88rem', color: '#334155', fontWeight: 500 } }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Section 2 */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" /> 2. How Your Data Is Safely Utilized
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                Your data is strictly utilized for legitimate operational and member service purposes only:
              </Typography>
              <List spacing={1}>
                {[
                  'Safely dispatching product packages to your confirmed door address',
                  'Accurately processing weekly commission disbursements every Wednesday',
                  'Verifying member identity and preventing fraudulent duplicate accounts',
                  'Dispatching 6-digit security OTPs and WhatsApp repurchase confirmations',
                  'Calculating quarterly BV achievements for company awards and recognition',
                ].map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleOutlinedIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item} slotProps={{ primary: { fontSize: '0.88rem', color: '#334155', fontWeight: 500 } }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Section 3 */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWalletIcon color="primary" /> 3. Safe Handling of UPI & Financial Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Members' UPI IDs and Bank account credentials are used <strong>exclusively for processing automated weekly payouts</strong>. Financial data is stored in encrypted format and is never shared, accessed by unauthorized personnel, or used for any secondary transactions.
              </Typography>
            </Paper>
          </Grid>

          {/* Section 4 */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon color="primary" /> 4. Zero Third-Party Commercial Sharing
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                AAKASH E-COM strictly adheres to a zero-spam and zero-data-monetization policy. Your personal details, contact numbers, or network data will <strong>never be sold, rented, leased, or traded</strong> to third-party telemarketers or external advertising companies under any circumstances.
              </Typography>
            </Paper>
          </Grid>

          {/* Section 5 */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                5. Communication Consent & Profile Controls
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                By registering on AAKASH E-COM, members consent to receiving critical order status updates, 6-digit security OTPs, repurchase receipts, and payout alerts via official Email, SMS, and WhatsApp notification channels.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Members retain full control over their information and can review or update their physical delivery address and UPI payout settings at any time directly through the <strong>Profile Settings</strong> panel inside their Member Portal.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
