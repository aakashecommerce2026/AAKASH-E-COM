import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Avatar,
  LinearProgress,
  IconButton,
  CircularProgress,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { updateProfileRequest, updateProfileSuccess, clearProfileStatus } from '../store/actions';
import { authApi, membersApi } from '../services/api';

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
  const [address, setAddress] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // UPI Identifiers Grid State
  const [upiId, setUpiId] = useState('');
  const [secondaryUpiId, setSecondaryUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState('Google Pay');

  const [upiError, setUpiError] = useState('');

  // Photo Upload State
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' });

  // Calculate Profile Completion Score (0% - 100%)
  const completionScore = useMemo(() => {
    let score = 0;
    // 1. Contact Info = 25%
    if (name && email && user?.mobile) score += 25;
    // 2. Shipping Address = 25%
    if (address && address.trim().length >= 5) score += 25;
    // 3. Profile Photo Uploaded = 25%
    if (user?.profilePhoto) score += 25;
    // 4. Primary UPI Handle = 25%
    if (upiId && upiId.includes('@')) score += 25;
    return score;
  }, [name, email, user, address, upiId]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage({ type: 'error', text: 'Image file size must be under 5MB.' });
      return;
    }

    setPhotoUploading(true);
    setPhotoMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await membersApi.uploadProfilePhoto(formData);
      const photoPath = res.profilePhoto || res.member?.profilePhoto;

      const updatedUser = {
        ...user,
        profilePhoto: photoPath,
      };

      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        parsed.user = updatedUser;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }

      dispatch(updateProfileSuccess(updatedUser));
      setPhotoMessage({ type: 'success', text: 'Profile photo uploaded successfully!' });
    } catch (err) {
      setPhotoMessage({ type: 'error', text: err.message || 'Failed to upload photo.' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const populateUserData = useCallback(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAddress(user.address || '');

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
    if (!address || address.trim().length < 5) {
      setUpiError('Full shipping address is compulsory for product delivery.');
      return false;
    }
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
      address: address.trim(),
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordStatus({ type: '', message: '' });
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordStatus({
        type: 'success',
        message: 'Password updated successfully! Please use your new password on your next login.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to change password. Check current password.',
      });
    } finally {
      setChangingPassword(false);
    }
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
              Member Profile & Security Settings
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

          {/* Profile Completion Meter */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              bgcolor: completionScore === 100 ? '#F0FDF4' : '#FFFBEB',
              borderColor: completionScore === 100 ? '#BBF7D0' : '#FDE68A',
              borderRadius: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: completionScore === 100 ? '#166534' : '#92400E' }}>
                Profile Completion: {completionScore}%
              </Typography>
              <Chip
                icon={completionScore === 100 ? <VerifiedIcon /> : <CloudUploadIcon />}
                label={completionScore === 100 ? '100% Complete Verified' : 'Action Required'}
                color={completionScore === 100 ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 800, height: 22, fontSize: '0.68rem' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionScore}
              color={completionScore === 100 ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block' }}>
              {completionScore === 100
                ? '✅ Profile work is 100% complete! All contact details, profile photo, and UPI handles are verified.'
                : '⚠️ Upload a profile photo and enter your primary UPI handle to achieve 100% profile work completion.'}
            </Typography>
          </Paper>

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

                {/* Profile Photo Avatar & Upload Control */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={
                        user?.profilePhoto
                          ? user.profilePhoto.startsWith('http')
                            ? user.profilePhoto
                            : `http://localhost:3000${user.profilePhoto}`
                          : undefined
                      }
                      sx={{
                        width: 88,
                        height: 88,
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        bgcolor: '#064E3B',
                        color: '#FBBF24',
                        border: '3px solid #D97706',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      }}
                    >
                      {name ? name.charAt(0).toUpperCase() : 'M'}
                    </Avatar>
                    <label htmlFor="profile-modal-photo-upload-input">
                      <input
                        id="profile-modal-photo-upload-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handlePhotoSelect}
                      />
                      <IconButton
                        component="span"
                        disabled={photoUploading}
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          bgcolor: '#D97706',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          '&:hover': { bgcolor: '#B45309' },
                        }}
                      >
                        {photoUploading ? <CircularProgress size={18} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
                      </IconButton>
                    </label>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
                    {user?.profilePhoto ? 'Click camera icon to change photo' : 'Upload photo to complete profile work'}
                  </Typography>

                  {photoMessage.text && (
                    <Alert severity={photoMessage.type || 'info'} sx={{ mt: 1.5, py: 0.2, px: 1.5, fontSize: '0.78rem', width: '100%' }}>
                      {photoMessage.text}
                    </Alert>
                  )}
                </Box>

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

                  <TextField
                    label="Full Delivery & Shipping Address (Compulsory)"
                    variant="outlined"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    required
                    disabled={!isEditing}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Door No, Street Name, Landmark, City, State - Pincode"
                    helperText="📍 Products and physical order packages will be dispatched to this address."
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

            {/* Grid 3: Security & Password Management */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#FAF9F6' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <KeyIcon color="warning" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400E' }}>
                    Security & Password Change
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {passwordStatus.message && (
                  <Alert severity={passwordStatus.type} sx={{ mb: 2, borderRadius: 2 }}>
                    {passwordStatus.message}
                  </Alert>
                )}

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Current Password"
                      type="password"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="New Password"
                      type="password"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                    <Button
                      type="button"
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<KeyIcon />}
                      onClick={handleChangePassword}
                      disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                      sx={{ fontWeight: 700, px: 3, bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }}
                    >
                      {changingPassword ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </Grid>
                </Grid>
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
