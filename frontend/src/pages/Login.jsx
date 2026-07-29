import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import { loginRequest } from '../store/actions';

const Login = () => {
  const dispatch = useDispatch();

  const { token, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate inputs
  const validateEmail = (value) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      dispatch(loginRequest(email, password, 'Member'));
    }
  };

  const handleFillDemo = () => {
    setEmail('arun@example.com');
    setPassword('password');
    setEmailError('');
    setPasswordError('');
  };

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #022C22 0%, #064E3B 50%, #854D0E 100%)',
        px: 2,
        py: 4
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={12}
          sx={{
            borderRadius: 4,
            bgcolor: '#FFFFFF',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}
        >
          {/* Header Banner */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 3.5,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)'
            }}
          >
            <Box
              component="img"
              src="/favicon.svg"
              alt="AAKASH E MART Logo"
              sx={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                margin: '0 auto 12px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'block'
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, tracking: '-0.02em', mb: 0.5 }}>
              Member Portal Login
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Sign in to manage your Unilevel MLM earnings & downline
            </Typography>
          </Box>

          <CardContent sx={{ p: 3.5 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Member Email Address"
                  type="email"
                  variant="outlined"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  error={Boolean(emailError)}
                  helperText={emailError}
                  disabled={loading}
                  placeholder="arun@example.com"
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  error={Boolean(passwordError)}
                  helperText={passwordError}
                  disabled={loading}
                  placeholder="••••••••"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="secondary"
                        size="small"
                      />
                    }
                    label={<Typography variant="caption" color="text.secondary">Remember me</Typography>}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'secondary.dark', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={handleFillDemo}
                  >
                    Quick Demo Credentials
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1, py: 1.4, fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In as Member'}
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3 }}>
              <Chip label="Demo Helper" size="small" sx={{ fontSize: '0.75rem' }} />
            </Divider>

            <Box
              sx={{
                bgcolor: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: 2,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon sx={{ color: '#B45309', fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E' }}>
                  Demo Member Credentials
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: '#78350F' }}>
                    ID 2: Priya Chandran
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#92400E' }}>
                    priya@example.com / password
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={() => {
                    setEmail('priya@example.com');
                    setPassword('password');
                    setEmailError('');
                    setPasswordError('');
                  }}
                  sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, bgcolor: '#D97706', color: 'white', '&:hover': { bgcolor: '#B45309' } }}
                >
                  Fill ID 2
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #FCD34D', pt: 1 }}>
                <Box>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: '#78350F' }}>
                    ID 1: Arun Kumar
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#92400E' }}>
                    arun@example.com / password
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={handleFillDemo}
                  sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, borderColor: '#D97706', color: '#92400E' }}
                >
                  Fill ID 1
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
