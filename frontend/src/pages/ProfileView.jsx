import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  IconButton,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import ErrorIcon from '@mui/icons-material/Error';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { updateProfileRequest, updateProfileSuccess, clearProfileStatus } from '../store/actions';
import { ProfileModal } from '../components/ProfileModal';
import { PromotionProgressCard } from '../components/PromotionProgressCard';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { membersApi } from '../services/api';

const UPI_PROVIDERS = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'BHIM UPI',
  'Amazon Pay',
  'Other'
];

const ProfileView = () => {
  const dispatch = useDispatch();
  const { user, saving, saveSuccess, error } = useSelector((state) => state.auth);

  // Edit Mode Lock/Unlock State
  const [isEditing, setIsEditing] = useState(false);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Personal Info State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // UPI Identifiers Grid State
  const [upiId, setUpiId] = useState('');
  const [secondaryUpiId, setSecondaryUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState('Google Pay');

  const [upiError, setUpiError] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Photo Upload State
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' });

  // Calculate Profile Completion Score (0% - 100%)
  const completionScore = useMemo(() => {
    let score = 0;
    // 1. Basic Info (Name, Email, Mobile) = 25%
    if (name && email && user?.mobile) score += 25;
    // 2. Full Shipping Address = 25%
    if (address && address.trim().length >= 5) score += 25;
    // 3. Profile Photo Uploaded = 25%
    if (user?.profilePhoto) score += 25;
    // 4. Primary UPI / Bank Handle = 25%
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

      // Save to localStorage session
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        parsed.user = updatedUser;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }

      dispatch(updateProfileSuccess(updatedUser));
      setPhotoMessage({ type: 'success', text: 'Profile photo uploaded and saved successfully!' });
    } catch (err) {
      setPhotoMessage({ type: 'error', text: err.message || 'Failed to upload profile photo.' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const populateUserData = useCallback(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setUpiId(user.upiId || user.bankDetails?.upiId || '');
      setSecondaryUpiId(user.secondaryUpiId || user.bankDetails?.secondaryUpiId || '');
      setUpiProvider(user.upiProvider || user.bankDetails?.upiProvider || 'Google Pay');
      setUpiError('');
    }
  }, [user]);

  useEffect(() => {
    populateUserData();
  }, [populateUserData]);

  // Fetch fresh profile from DB on component mount
  useEffect(() => {
    let isMounted = true;
    membersApi
      .getProfile()
      .then((profileData) => {
        if (!isMounted) return;
        if (profileData) {
          dispatch(updateProfileSuccess(profileData));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (saveSuccess) {
      setIsEditing(false); // Lock fields after successful Saga save
      const timer = setTimeout(() => {
        dispatch(clearProfileStatus());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, dispatch]);

  const validateInputs = () => {
    if (!address || address.trim().length < 5) {
      setUpiError('Full shipping address is compulsory for product delivery.');
      return false;
    }
    if (!upiId) {
      setUpiError('Primary UPI ID is required');
      return false;
    }
    if (!upiId.includes('@') || upiId.trim().length < 5) {
      setUpiError('Please enter a valid UPI ID format (e.g. mobile@upi or name@okicici)');
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
      username: username.trim(),
      email: email.trim(),
      address: address.trim(),
      upiId: upiId.trim(),
      secondaryUpiId: secondaryUpiId.trim(),
      upiProvider,
    };

    // Dispatch explicit Redux event for profile update (processed by profileSaga with latency delay)
    dispatch(updateProfileRequest(updatedUser));
  };

  const handleCancel = () => {
    populateUserData();
    setIsEditing(false); // Re-lock form
    dispatch(clearProfileStatus());
  };

  // Live UPI QR code generator URL
  const encodedName = encodeURIComponent(name || 'Member');
  const cleanUpi = upiId.trim();
  const upiPayUrl = `upi://pay?pa=${cleanUpi}&pn=${encodedName}&cu=INR`;
  const qrImageUrl = cleanUpi && cleanUpi.includes('@')
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayUrl)}`
    : null;

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Header Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 46, height: 46 }}>
            <PaymentIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
              Member Profile & UPI Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEditing 
                ? 'Edit mode unlocked. Modify your details below and click Save.' 
                : 'Click the Edit button to unlock and edit your profile credentials and UPI payment handles.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={isEditing ? <EditIcon /> : <LockIcon />}
            label={isEditing ? 'Editing Unlocked' : 'Read-Only Mode'}
            color={isEditing ? 'warning' : 'default'}
            sx={{ fontWeight: 700, py: 0.5 }}
          />

          {!isEditing ? (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ fontWeight: 800, borderRadius: 2, px: 2.5 }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Cancel Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* State View Cycling: Success & Error Alerts */}
      {saveSuccess && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3.5, borderRadius: 2.5, fontWeight: 700 }}>
          Profile updated successfully! Your profile details and UPI payment handles have been saved.
        </Alert>
      )}

      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3.5, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      {isEditing && (
        <Alert severity="info" icon={<EditIcon />} sx={{ mb: 3.5, borderRadius: 2.5 }}>
          You are currently in <strong>Edit Mode</strong>. Input fields are unlocked for modification.
        </Alert>
      )}

      {/* Promotion Rank Progress Card */}
      <Box sx={{ mb: 3.5 }}>
        <PromotionProgressCard />
      </Box>

      <form onSubmit={handleSave}>
        <Grid container spacing={3}>
          {/* GRID 1: PERSONAL PROFILE GRID */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, bgcolor: '#FFFFFF', opacity: isEditing ? 1 : 0.95 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <PersonIcon color="primary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      Personal Profile Grid
                    </Typography>
                  </Box>
                  {!isEditing && <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Completion Banner */}
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
                      label={completionScore === 100 ? '100% Complete' : 'Action Required'}
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
                      ? '✅ Profile work is 100% complete! Contact info, profile photo, and UPI handles are verified.'
                      : '⚠️ Upload a profile photo and enter your primary UPI handle to complete 100% profile work.'}
                  </Typography>
                </Paper>

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
                        width: 96,
                        height: 96,
                        fontSize: '2.4rem',
                        fontWeight: 800,
                        bgcolor: '#064E3B',
                        color: '#FBBF24',
                        border: '3px solid #D97706',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      }}
                    >
                      {name ? name.charAt(0).toUpperCase() : 'M'}
                    </Avatar>
                    <label htmlFor="profile-photo-upload-input">
                      <input
                        id="profile-photo-upload-input"
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

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.2, fontWeight: 700 }}>
                    {user?.profilePhoto ? 'Click camera icon to change photo' : 'Upload photo to complete profile work'}
                  </Typography>

                  {photoMessage.text && (
                    <Alert severity={photoMessage.type || 'info'} sx={{ mt: 1.5, py: 0.2, px: 1.5, fontSize: '0.78rem', width: '100%' }}>
                      {photoMessage.text}
                    </Alert>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Full Name"
                    variant="outlined"
                    fullWidth
                    size="small"
                    required
                    disabled={!isEditing || saving}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <TextField
                    label="Username (Unique)"
                    variant="outlined"
                    fullWidth
                    size="small"
                    disabled={!isEditing || saving}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. johndoe123"
                    helperText="👤 Unique handle for your profile across the network."
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    fullWidth
                    size="small"
                    required
                    disabled={!isEditing || saving}
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
                    disabled={!isEditing || saving}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Door No, Street Name, Landmark, City, State - Pincode"
                    helperText="📍 Products and physical order packages will be dispatched to this address."
                  />

                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#FAF9F6', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, mb: 1.5 }}>
                      MEMBER CREDENTIAL BADGES
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Role: ${user?.role || 'Member'}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                      {user?.referralCode && (
                        <Chip label={`Ref Code: ${user.referralCode}`} color="secondary" variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                      )}
                      {user?.id && (
                        <Chip label={`User ID: ${user.id}`} size="small" sx={{ fontWeight: 700, bgcolor: '#E2E8F0' }} />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* GRID 2: UPI IDENTIFIERS GRID */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, bgcolor: '#FFFFFF', opacity: isEditing ? 1 : 0.95 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <PaymentIcon color="secondary" sx={{ fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.dark' }}>
                      UPI Identifiers Grid
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isEditing && <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                    <Chip label="Instant UPI Payout" color="secondary" size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }} />
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={7}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <TextField
                        label="Primary UPI ID (VPA) *"
                        variant="outlined"
                        fullWidth
                        size="small"
                        required
                        disabled={!isEditing || saving}
                        placeholder="e.g. mobile@upi or name@okicici"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          if (upiError) validateInputs();
                        }}
                        error={Boolean(upiError)}
                        helperText={upiError || 'Primary VPA handle for direct instant payouts'}
                      />

                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Preferred UPI App Provider"
                        disabled={!isEditing || saving}
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value)}
                      >
                        {UPI_PROVIDERS.map((prov) => (
                          <MenuItem key={prov} value={prov}>
                            {prov}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        label="Secondary UPI Handle (Optional)"
                        variant="outlined"
                        fullWidth
                        size="small"
                        disabled={!isEditing || saving}
                        placeholder="e.g. alt@paytm"
                        value={secondaryUpiId}
                        onChange={(e) => setSecondaryUpiId(e.target.value)}
                        helperText="Backup UPI address"
                      />
                    </Box>
                  </Grid>

                  {/* Dynamic UPI QR Code Box */}
                  <Grid item xs={12} sm={5}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2.5, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: '#FAF9F6', 
                        borderRadius: 3.5,
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.5px', mb: 1.5 }}>
                        LIVE UPI QR CODE PREVIEW
                      </Typography>

                      {qrImageUrl ? (
                        <Box 
                          component="img" 
                          src={qrImageUrl} 
                          alt="UPI QR Code" 
                          sx={{ width: 140, height: 140, borderRadius: 2, border: '2px solid #CBD5E1', mb: 1.5, p: 0.5, bgcolor: '#FFFFFF' }} 
                        />
                      ) : (
                        <Box sx={{ width: 140, height: 140, borderRadius: 2, bgcolor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                          <QrCode2Icon sx={{ color: '#64748B', fontSize: 60 }} />
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.88rem', wordBreak: 'break-all' }}>
                        {cleanUpi || 'Enter valid VPA handle'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block', mt: 0.5 }}>
                        Scan using Google Pay, PhonePe, Paytm, BHIM or any UPI app
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submit / Edit Form Action Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, flexWrap: 'wrap', gap: 2 }}>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<LockIcon />}
            onClick={() => setResetModalOpen(true)}
            sx={{ py: 1.5, px: 3, fontWeight: 700, borderRadius: 2 }}
          >
            Send Password Reset Link to Email
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isEditing ? (
              <Button
                type="button"
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{ px: 4, py: 1.5, fontWeight: 800, borderRadius: 2 }}
              >
                Edit Profile Settings
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  size="large"
                  disabled={saving}
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ px: 3, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{ px: 4, py: 1.5, fontWeight: 800, borderRadius: 2 }}
                >
                  {saving ? 'Processing DB Write...' : 'Save Profile & UPI Settings'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </form>

      <ForgotPasswordModal open={resetModalOpen} onClose={() => setResetModalOpen(false)} />

      {/* Profile Edit Modal */}
      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </Box>
  );
};

export default ProfileView;
