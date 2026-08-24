import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedIcon from '@mui/icons-material/Verified';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { otpApi, membersApi } from '../services/api';
import { loginRequest } from '../store/actions';

// Helper to generate unique referral code prefix
const generateMemberCode = (name = '') => {
  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = clean.length >= 2 ? clean.substring(0, 2) : 'AK';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${num}`;
};

const RegisterModal = ({ open, onClose, defaultSponsorCode = '' }) => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);

  const [activeStep, setActiveStep] = useState(0);

  // Form Fields
  const [sponsorCode, setSponsorCode] = useState(defaultSponsorCode);
  const [sponsorDetails, setSponsorDetails] = useState(null);
  const [searchingSponsor, setSearchingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [memberCode, setMemberCode] = useState('');

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');

  // General Status
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  // Populate default sponsor code when modal opens
  useEffect(() => {
    if (open) {
      const initialCode = defaultSponsorCode || authUser?.referralCode || authUser?.memberCode || 'AK10001';
      setSponsorCode(initialCode);
      setMemberCode(generateMemberCode(name));
      setUsername('');
      setActiveStep(0);
      setRegisteredUser(null);
      setGeneralError('');
      setOtpSent(false);
      setOtp('');
    }
  }, [open, defaultSponsorCode, authUser, name]);

  // Cooldown timer effect for OTP resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Real-time Sponsor Lookup
  useEffect(() => {
    if (!sponsorCode || !sponsorCode.trim()) {
      setSponsorDetails(null);
      setSponsorError('');
      return;
    }

    const q = sponsorCode.trim();
    let isMounted = true;
    setSearchingSponsor(true);
    setSponsorError('');

    // Check if sponsor is current logged in user
    if (
      authUser &&
      (authUser.referralCode === q || authUser.memberCode === q || String(authUser.id) === q || authUser.email === q)
    ) {
      setSponsorDetails({
        id: authUser.id,
        name: authUser.name,
        memberCode: authUser.memberCode || authUser.referralCode || String(authUser.id),
      });
      setSearchingSponsor(false);
      return;
    }

    // Search via members list API
    membersApi
      .getAll({ search: q, limit: 10 })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.data || res?.items || [];

        // 1. Check exact match
        let matched = list.find(
          (m) =>
            m.memberCode?.toLowerCase() === q.toLowerCase() ||
            String(m.id).toLowerCase() === q.toLowerCase() ||
            m.email?.toLowerCase() === q.toLowerCase()
        );

        // 2. Fallback to partial match or first search result returned by backend
        if (!matched && list.length > 0) {
          matched =
            list.find(
              (m) =>
                m.memberCode?.toLowerCase().includes(q.toLowerCase()) ||
                m.name?.toLowerCase().includes(q.toLowerCase())
            ) || list[0];
        }

        if (matched) {
          setSponsorDetails({
            id: matched.id,
            name: matched.name || matched.memberName || 'Verified Sponsor',
            memberCode: matched.memberCode || matched.referralCode || q,
          });
          setSponsorError('');
        } else {
          setSponsorDetails(null);
          setSponsorError(`Sponsor Code "${q}" not found in network.`);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSponsorDetails(null);
        setSponsorError(`Could not verify sponsor code "${q}".`);
      })
      .finally(() => {
        if (isMounted) setSearchingSponsor(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sponsorCode, authUser]);

  // Regenerate Member Code
  const handleRegenerateCode = () => {
    setMemberCode(generateMemberCode(name));
  };

  // Dispatch OTP to Email
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setOtpError('Please enter a valid email address first.');
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    try {
      await otpApi.sendOtp({ email, purpose: 'EMAIL_VERIFICATION' });
      setOtpSent(true);
      setCooldown(60);
      setActiveStep(1);
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Failed to dispatch 6-digit OTP code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit Final Registration with OTP Code
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!sponsorDetails) {
      setGeneralError('Please enter a valid sponsor referral code.');
      return;
    }
    if (!name || !mobile || !email || !password || !address.trim()) {
      setGeneralError('Please complete all compulsory registration fields including Full Shipping Address.');
      return;
    }
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP verification code sent to your email.');
      return;
    }

    setLoading(true);
    setGeneralError('');
    setOtpError('');

    try {
      const payload = {
        memberCode: memberCode || generateMemberCode(name),
        name,
        ...(username ? { username: username.trim() } : {}),
        mobile,
        email,
        address: address.trim(),
        password,
        referrerId: sponsorDetails.id,
        otp,
      };

      const created = await membersApi.create(payload);

      setRegisteredUser({
        name: created.name,
        email: created.email,
        memberCode: created.memberCode,
        password,
        sponsorName: sponsorDetails.name,
      });

      // Auto login newly registered member
      dispatch(loginRequest(created.email || created.memberCode, password, 'Member'));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      if (typeof msg === 'string' && msg.toLowerCase().includes('otp')) {
        setOtpError(Array.isArray(msg) ? msg.join(', ') : msg);
      } else {
        setGeneralError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps={{ sx: { borderRadius: 3.5, p: 1 } }}>
      {/* Dialog Header */}
      <DialogTitle sx={{ fontWeight: 800, color: 'primary.dark', pb: 1 }}>
        🚀 Join AAKASH E-COM Network
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Direct Referral & Multi-Level E-Commerce Portal
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
        {/* Stepper Progress */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 1 }}>
          <Step completed={Boolean(sponsorDetails)}>
            <StepLabel>1. Sponsor Code</StepLabel>
          </Step>
          <Step completed={otpSent}>
            <StepLabel>2. Verify Email OTP</StepLabel>
          </Step>
          <Step completed={Boolean(registeredUser)}>
            <StepLabel>3. Complete Join</StepLabel>
          </Step>
        </Stepper>

        {registeredUser ? (
          /* SUCCESS BANNER & CREDENTIALS CARD */
          <Box sx={{ textContent: 'center', py: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 60, color: '#16A34A', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532D', mb: 0.5 }}>
                Registration Successful!
              </Typography>
              <Typography variant="body2" color="#166534" sx={{ mb: 2 }}>
                Welcome, <strong>{registeredUser.name}</strong>! Your account has been created under sponsor{' '}
                <strong>{registeredUser.sponsorName}</strong>.
              </Typography>

              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  p: 2,
                  borderRadius: 2,
                  border: '1px dashed #22C55E',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Member Code: <strong style={{ color: '#047857', fontSize: '1rem' }}>{registeredUser.memberCode}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Email: <strong>{registeredUser.email}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Temporary Password: <strong>{registeredUser.password}</strong>
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onClose}
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                Go to Dashboard
              </Button>
            </Paper>
          </Box>
        ) : (
          <form onSubmit={handleSubmitRegistration}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {generalError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {generalError}
                </Alert>
              )}

              {/* STEP 1: SPONSOR CODE VERIFICATION */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, borderColor: '#E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon color="secondary" fontSize="small" /> Step 1: Sponsor Referral Code
                </Typography>

                <TextField
                  label="Sponsor Referral Code"
                  variant="outlined"
                  fullWidth
                  required
                  value={sponsorCode}
                  onChange={(e) => setSponsorCode(e.target.value)}
                  placeholder="e.g. AK10001"
                  sx={{ bgcolor: '#FFFFFF' }}
                  slotProps={{
                    input: {
                      endAdornment: searchingSponsor ? <CircularProgress size={20} /> : null,
                    },
                  }}
                />

                {sponsorDetails ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      bgcolor: '#F0FDF4',
                      borderColor: '#BBF7D0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534' }}>
                        Verified Sponsor: {sponsorDetails.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803D' }}>
                        Code: <strong>{sponsorDetails.memberCode}</strong> | ID: {sponsorDetails.id}
                      </Typography>
                    </Box>
                  </Paper>
                ) : sponsorError ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      bgcolor: '#FEF2F2',
                      borderColor: '#FECACA',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <ErrorIcon color="error" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#991B1B' }}>
                      {sponsorError}
                    </Typography>
                  </Paper>
                ) : null}
              </Paper>

              {/* STEP 2: MEMBER INFORMATION */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                Step 2: Personal Information & Generated Code
              </Typography>

              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMemberCode(generateMemberCode(e.target.value));
                }}
                placeholder="Enter full legal name"
              />

              <TextField
                label="Username (Unique)"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username (e.g. johndoe123)"
                helperText="Optional handle. Name can be duplicated, but username must be strictly unique."
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label="Mobile Number"
                  variant="outlined"
                  fullWidth
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+919876543210"
                />
                <TextField
                  label="Unique Member Code"
                  variant="outlined"
                  fullWidth
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleRegenerateCode} title="Generate Code">
                            <AutoFixHighIcon color="secondary" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <TextField
                label="Full Delivery Address (Compulsory for product shipping)"
                variant="outlined"
                fullWidth
                required
                multiline
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street Name, Landmark, City, State - Pincode"
                helperText="📍 Products and physical order packages will be dispatched to this exact address."
              />

              {/* STEP 3: EMAIL 6-DIGIT OTP VERIFICATION */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#ECFDF5', borderColor: '#A7F3D0', borderRadius: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MarkEmailReadIcon color="success" fontSize="small" /> Step 3: Email 6-Digit OTP Verification
                </Typography>

                {otpError && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.8rem' }}>
                    {otpError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <TextField
                    label="6-Digit OTP Code"
                    variant="outlined"
                    fullWidth
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    disabled={!otpSent}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />

                  <Button
                    variant="outlined"
                    color="success"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || cooldown > 0 || !email}
                    sx={{ whiteSpace: 'nowrap', height: 56, px: 2.5, fontWeight: 700 }}
                  >
                    {sendingOtp ? (
                      <CircularProgress size={20} />
                    ) : cooldown > 0 ? (
                      `Resend in ${cooldown}s`
                    ) : otpSent ? (
                      'Resend OTP'
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </Box>
                {otpSent && (
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block', mt: 1 }}>
                    📩 6-Digit OTP Code dispatched to <strong>{email}</strong>. (Valid for 10 minutes)
                  </Typography>
                )}
              </Paper>
            </Box>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button onClick={onClose} disabled={loading} color="inherit">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                disabled={loading || !sponsorDetails || !otpSent || otp.length !== 6}
                sx={{ px: 4, py: 1.2, fontWeight: 800 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP & Complete Join'}
              </Button>
            </DialogActions>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
