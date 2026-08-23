import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authApi } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get('email') || '';
    const urlToken = searchParams.get('token') || searchParams.get('otp') || '';

    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token || !newPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword({
        email,
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your link/token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #022C22 0%, #064E3B 50%, #854D0E 100%)',
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textCenter: 'center', textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <LockResetIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                Reset Your Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Enter your details and new password below
              </Typography>
            </Box>

            {success ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Password Reset Complete!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your password has been reset successfully. You can now log in with your new password.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                  sx={{ py: 1.2, fontWeight: 700 }}
                >
                  Go to Login Portal
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Registered Email"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />

                  <TextField
                    label="Reset Token / OTP Code"
                    type="text"
                    fullWidth
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={loading}
                    placeholder="Enter 6-digit code from email"
                  />

                  <TextField
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    helperText="Min 8 characters (uppercase, lowercase, number/special char)"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 1, py: 1.4, fontWeight: 700 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Set New Password'}
                  </Button>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;
