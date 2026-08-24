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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { loginRequest } from '../store/actions';

import ForgotPasswordModal from '../components/ForgotPasswordModal';
import RegisterModal from '../components/RegisterModal';

const Login = () => {
  const dispatch = useDispatch();

  const { token, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate inputs
  const validateEmail = (value) => {
    if (!value) {
      setEmailError('Email or Member Code is required');
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
                  label="Email or Member Code"
                  type="text"
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
                  placeholder="Enter email or member code"
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
                  <Button
                    size="small"
                    onClick={() => setForgotModalOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Forgot Password?
                  </Button>
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

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    New to AAKASH E-COM?{' '}
                    <Button
                      onClick={() => setRegisterModalOpen(true)}
                      sx={{ textTransform: 'none', fontWeight: 800, color: 'secondary.main', p: 0, minWidth: 'auto' }}
                    >
                      Join Network / Register
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      <RegisterModal open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} />
    </Box>
  );
};

export default Login;
