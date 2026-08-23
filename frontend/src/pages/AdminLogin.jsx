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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { loginRequest } from '../store/actions';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const AdminLogin = () => {
  const dispatch = useDispatch();

  const { token, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate inputs
  const validateEmail = (value) => {
    if (!value) {
      setEmailError('Admin Email or Member Code is required');
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
      dispatch(loginRequest(email, password, 'Admin'));
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
        background: 'linear-gradient(135deg, #011E17 0%, #022C22 50%, #854D0E 100%)',
        px: 2,
        py: 4
      }}
    >
      <Container maxWidth="xs">
        {/* Header Branding */}
        <Box sx={{ mb: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box component="img" src="/favicon.svg" alt="AAKASH E MART Logo" sx={{ width: 48, height: 48, mb: 1, filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.4))' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '0.05em', mb: 0.5 }}>
            AAKASH E MART
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Multi-Level Marketing Management Platform
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0px 16px 36px rgba(0, 0, 0, 0.5)', borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: '50%', mb: 1.5, display: 'flex' }}>
                <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Admin Portal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
                Secure access for MLM system administrators
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Admin Email or Member Code"
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
                  placeholder="admin@aakashecom.com or ADM-0001"
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
                        color="primary"
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
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1, py: 1.4, fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In as Admin'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </Box>
  );
};

export default AdminLogin;
