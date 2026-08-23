import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { otpApi } from '../services/api';

const OtpVerificationModal = ({
  open,
  onClose,
  email,
  purpose = 'EMAIL_VERIFICATION',
  onVerifySuccess,
}) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Cooldown countdown timer effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP automatically when modal opens if needed
  useEffect(() => {
    if (open && email) {
      handleSendOtp();
    } else {
      resetForm();
    }
  }, [open, email, purpose]);

  const resetForm = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setVerifying(false);
  };

  const handleSendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await otpApi.sendOtp({ email, purpose });
      setSuccessMsg(res.message || `OTP sent to ${email}`);
      setCooldown(res.cooldownSeconds || 60);
      setTimeout(() => inputRefs[0].current?.focus(), 200);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, value) => {
    // Only accept numeric single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError('');

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous box on Backspace if current box is empty
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);
    if (pasted.length === 6) {
      inputRefs[5].current?.focus();
    } else if (pasted.length > 0) {
      inputRefs[pasted.length - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the OTP code');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await otpApi.verifyOtp({ email, otp: code, purpose });
      setSuccessMsg('OTP verified successfully!');
      setTimeout(() => {
        if (onVerifySuccess) onVerifySuccess(res);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth paperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MarkEmailReadIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Email OTP Verification
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We have sent a 6-digit OTP verification code to <strong>{email}</strong>. Please enter it below.
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

        {/* 6 Digit Input Boxes */}
        <Box
          sx={{
            display: 'flex',
            justify: 'center',
            gap: 1.2,
            my: 3,
          }}
          onPaste={handlePaste}
        >
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: '42px',
                height: '50px',
                fontSize: '22px',
                fontWeight: '700',
                textAlign: 'center',
                borderRadius: '8px',
                border: digit ? '2px solid #059669' : '1px solid #cbd5e1',
                backgroundColor: digit ? '#ecfdf5' : '#ffffff',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Didn't receive the code?
          </Typography>
          <Button
            size="small"
            onClick={handleSendOtp}
            disabled={cooldown > 0 || loading}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            {loading ? (
              <CircularProgress size={16} />
            ) : cooldown > 0 ? (
              `Resend OTP in ${cooldown}s`
            ) : (
              'Resend OTP'
            )}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={verifying}>
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          color="primary"
          disabled={verifying || otpDigits.join('').length < 6}
          sx={{ px: 3, fontWeight: 700 }}
        >
          {verifying ? <CircularProgress size={22} color="inherit" /> : 'Verify Code'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpVerificationModal;
