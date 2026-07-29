import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { updateProfileRequest, clearProfileStatus } from '../store/actions';

const UPI_PROVIDERS = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'BHIM UPI',
  'Amazon Pay',
  'Other'
];

export const ProfileModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user, saveSuccess } = useSelector((state) => state.auth);

  // Lock / Unlock Editing State
  const [isEditing, setIsEditing] = useState(false);

  // Personal Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // UPI Identifiers Grid State
  const [upiId, setUpiId] = useState('');
  const [secondaryUpiId, setSecondaryUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState('Google Pay');

  const [upiError, setUpiError] = useState('');

  const populateUserData = useCallback(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');

      setUpiId(user.upiId || (user.id === 2 ? 'priya@okicici' : 'arun@upi'));
      setSecondaryUpiId(user.secondaryUpiId || '');
      setUpiProvider(user.upiProvider || 'Google Pay');
      setUpiError('');
    }
  }, [user]);

  useEffect(() => {
    populateUserData();
    setIsEditing(false); // Reset to read-only when opening
  }, [populateUserData, open]);

  useEffect(() => {
    if (saveSuccess && open) {
      setIsEditing(false);
      const timer = setTimeout(() => {
        dispatch(clearProfileStatus());
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, open, dispatch, onClose]);

  const validateInputs = () => {
    if (!upiId) {
      setUpiError('Primary UPI ID is required');
      return false;
    }
    if (!upiId.includes('@') || upiId.length < 5) {
      setUpiError('Please enter a valid UPI ID format (e.g. name@upi or mobile@paytm)');
      return false;
    }
    setUpiError('');
    return true;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    const updatedUser = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      upiId: upiId.trim(),
      secondaryUpiId: secondaryUpiId.trim(),
      upiProvider,
    };

    // Dispatch explicit Redux action (processed by profileSaga with DB latency delay)
    dispatch(updateProfileRequest(updatedUser));
  };

  const handleCancel = () => {
    populateUserData();
    setIsEditing(false);
  };

  // Generate real-time UPI QR URL
  const encodedName = encodeURIComponent(name || 'Member');
  const cleanUpi = upiId.trim();
  const upiPayUrl = `upi://pay?pa=${cleanUpi}&pn=${encodedName}&cu=INR`;
  const qrImageUrl = cleanUpi && cleanUpi.includes('@')
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`
    : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #E2E8F0', pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 38, height: 38 }}>
            <PaymentIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
              Member Profile & UPI Settings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEditing ? 'Editing Mode Unlocked' : 'Read-Only Mode — Click Edit button to modify details'}
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={isEditing ? <EditIcon /> : <LockIcon />}
          label={isEditing ? 'Editing Unlocked' : 'Locked'}
          color={isEditing ? 'warning' : 'default'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <form onSubmit={handleSave}>
        <DialogContent sx={{ pt: 3, pb: 4 }}>
          {saveSuccess && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              Member profile and UPI handles saved successfully!
            </Alert>
          )}

          {!isEditing && (
            <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              Profile fields are currently locked in <strong>Read-Only Mode</strong>. Click the <strong>Edit Profile</strong> button to make changes.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Grid 1: Personal Account Info */}
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3, bgcolor: '#FAF9F6', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      Personal Profile Grid
                    </Typography>
                  </Box>
                  {!isEditing && <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Full Name"
                    variant="outlined"
                    fullWidth
                    size="small"
                    required
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    fullWidth
                    size="small"
                    required
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1 }}>
                    <Chip 
                      label={`Role: ${user?.role || 'Member'}`} 
                      color="primary" 
                      size="small" 
                      sx={{ fontWeight: 700 }} 
                    />
                    {user?.referralCode && (
                      <Chip 
                        label={`Ref: ${user.referralCode}`} 
                        color="secondary" 
                        variant="outlined"
                        size="small" 
                        sx={{ fontWeight: 700 }} 
                      />
                    )}
                    {user?.id && (
                      <Chip 
                        label={`ID: ${user.id}`} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: '#E2E8F0' }} 
                      />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Grid 2: UPI Identifiers Grid */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3, bgcolor: '#FAF9F6', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon color="secondary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.dark' }}>
                      UPI Identifiers Grid
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isEditing && <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                    <Chip label="Instant UPI" color="secondary" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Primary UPI ID (VPA) *"
                    variant="outlined"
                    fullWidth
                    size="small"
                    required
                    disabled={!isEditing}
                    placeholder="e.g. mobile@upi or name@okicici"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      if (upiError) validateInputs();
                    }}
                    error={Boolean(upiError)}
                    helperText={upiError || 'Direct instant payout destination VPA'}
                  />

                  <Grid container spacing={1.5}>
                    <Grid item xs={7}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Preferred UPI App"
                        disabled={!isEditing}
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value)}
                      >
                        {UPI_PROVIDERS.map((prov) => (
                          <MenuItem key={prov} value={prov}>
                            {prov}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={5}>
                      <TextField
                        label="Secondary UPI"
                        variant="outlined"
                        fullWidth
                        size="small"
                        disabled={!isEditing}
                        placeholder="alt@paytm"
                        value={secondaryUpiId}
                        onChange={(e) => setSecondaryUpiId(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  {/* UPI QR Code Preview Box */}
                  <Paper variant="outlined" sx={{ p: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF', borderRadius: 2 }}>
                    {qrImageUrl ? (
                      <Box component="img" src={qrImageUrl} alt="UPI QR Code" sx={{ width: 75, height: 75, borderRadius: 1.5, border: '1px solid #CBD5E1' }} />
                    ) : (
                      <Box sx={{ width: 75, height: 75, borderRadius: 1.5, bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode2Icon sx={{ color: '#94A3B8', fontSize: 36 }} />
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
                        Live UPI QR Preview
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cleanUpi || 'Enter valid UPI VPA'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
                        Scan via Google Pay, PhonePe, Paytm, or BHIM
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {!isEditing ? (
              <Button 
                type="button" 
                variant="contained" 
                color="secondary" 
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{ px: 3, fontWeight: 700 }}
              >
                Edit Profile & UPI
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} color="inherit" startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="secondary" startIcon={<SaveIcon />} sx={{ px: 3.5, fontWeight: 700 }}>
                  Save Profile & UPI Settings
                </Button>
              </>
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};
