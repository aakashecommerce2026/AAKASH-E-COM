import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';
import { authApi } from '../services/api';

const ForgotPasswordModal = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccessMsg('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authApi.forgotPassword({ email });
      setSuccessMsg(res.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth paperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockResetIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Forgot Password?
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Enter your registered email address below. We will send you an email with a link and code to reset your password.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
              {successMsg}
            </Alert>
          )}

          <TextField
            label="Registered Email Address"
            type="email"
            fullWidth
            required
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || Boolean(successMsg)}
            placeholder="member@example.com"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            {successMsg ? 'Close' : 'Cancel'}
          </Button>
          {!successMsg && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !email}
              sx={{ px: 3, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPasswordModal;
