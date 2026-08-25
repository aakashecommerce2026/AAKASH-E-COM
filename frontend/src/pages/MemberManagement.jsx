import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import { DataGrid } from '@mui/x-data-grid';
import { useLocation } from 'react-router-dom';
import { fetchMembersRequest, addMemberRequest, updateMemberRequest } from '../store/actions';
import { UnilevelTree } from '../components/UnilevelTree';
import { hierarchyApi } from '../services/api';

// Helper function to generate unique referral code
const generateUniqueReferralCode = (memberName, existingMembers = []) => {
  const cleanName = (memberName || 'MEMBER').replace(/[^a-zA-Z]/g, '').toUpperCase();
  let prefix = cleanName.length >= 2 ? cleanName.substring(0, 2) : 'AK';
  let code = '';
  let attempts = 0;

  do {
    const num = Math.floor(100 + Math.random() * 900);
    code = `${prefix}${num}`;
    attempts++;
  } while (
    existingMembers.some((m) => m.referralCode && m.referralCode.toUpperCase() === code) &&
    attempts < 50
  );

  return code;
};

import OtpVerificationModal from '../components/OtpVerificationModal';

const MemberManagement = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { members, loading, error, saving } = useSelector((state) => state.membership);

  // Parse location state or query params to open Unilevel Tree tab directly when Tree card is clicked
  const initialTab = useMemo(() => {
    if (location.state?.tab !== undefined) return location.state.tab;
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'tree' ? 1 : 0;
  }, [location]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (location.state?.tab !== undefined) {
      setActiveTab(location.state.tab);
    } else {
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'tree') {
        setActiveTab(1);
      } else if (params.get('tab') === 'list') {
        setActiveTab(0);
      }
    }
  }, [location]);
  const [openModal, setOpenModal] = useState(false);
  
  // Dialog state variables
  const [editingMember, setEditingMember] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [sponsorReferralCode, setSponsorReferralCode] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [membershipAmount, setMembershipAmount] = useState(10000);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [registrationNotice, setRegistrationNotice] = useState('');
  const [serverDownlines, setServerDownlines] = useState([]);

  useEffect(() => {
    dispatch(fetchMembersRequest());
  }, [dispatch]);

  const isAdmin = user?.role === 'Admin';

  // Identify current member in the membership store or fallback to logged-in user
  const currentMember = useMemo(() => {
    const list = [...members, ...serverDownlines];
    if (list.length > 0) {
      const found = list.find(
        (m) =>
          m.id === user?.id ||
          (user?.email && m.email?.toLowerCase() === user.email.toLowerCase()) ||
          (user?.referralCode && m.referralCode === user.referralCode)
      );
      if (found) return found;
    }
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email || '',
        mobile: user.mobile || '',
        role: user.role === 'Admin' ? 'Admin' : 'Associate',
        referralCode: user.referralCode || user.memberCode || String(user.id),
        status: user.status || 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        sponsorId: null,
      };
    }
    return null;
  }, [members, serverDownlines, user]);

  // Real-time Sponsor Lookup by Sponsor Referral Code
  const matchedSponsor = useMemo(() => {
    if (!sponsorReferralCode || !sponsorReferralCode.trim()) return null;
    const q = sponsorReferralCode.trim().toUpperCase();

    // 1. Check logged-in currentMember
    if (
      currentMember &&
      ((currentMember.referralCode && currentMember.referralCode.toUpperCase() === q) ||
        String(currentMember.id) === q ||
        (currentMember.email && currentMember.email.toUpperCase() === q))
    ) {
      return currentMember;
    }

    // 2. Check logged-in auth user
    if (
      user &&
      ((user.referralCode && user.referralCode.toUpperCase() === q) ||
        (user.memberCode && user.memberCode.toUpperCase() === q) ||
        String(user.id) === q ||
        (user.email && user.email.toUpperCase() === q))
    ) {
      return {
        id: user.id,
        name: user.name,
        email: user.email || '',
        mobile: user.mobile || '',
        role: user.role === 'Admin' ? 'Admin' : 'Associate',
        referralCode: user.referralCode || user.memberCode || String(user.id),
        status: user.status || 'Active',
      };
    }

    // 3. Search in loaded members and serverDownlines
    const searchList = [...members, ...serverDownlines];
    return searchList.find(
      (m) =>
        (m.referralCode && m.referralCode.toUpperCase() === q) ||
        String(m.id) === q ||
        (m.email && m.email.toUpperCase() === q)
    );
  }, [members, serverDownlines, sponsorReferralCode, currentMember, user]);

  // Sync Sponsor ID when Matched Sponsor changes
  useEffect(() => {
    if (matchedSponsor) {
      setSponsorId(String(matchedSponsor.id));
    } else if (!sponsorReferralCode) {
      setSponsorId('');
    }
  }, [matchedSponsor, sponsorReferralCode]);

  // Uniqueness check for new member referral code
  const isReferralCodeUnique = useMemo(() => {
    if (!referralCode || !referralCode.trim()) return true;
    const code = referralCode.trim().toUpperCase();
    const existing = members.find(
      (m) => m.referralCode && m.referralCode.toUpperCase() === code
    );
    if (!existing) return true;
    return editingMember ? existing.id === editingMember.id : false;
  }, [members, referralCode, editingMember]);

  useEffect(() => {
    if (!isAdmin && currentMember) {
      hierarchyApi
        .getMemberDownline()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          if (list.length > 0) {
            const mapped = list.map((m) => ({
              id: m.id,
              name: m.name,
              username: m.username || m.user_name || null,
              email: m.email || '',
              mobile: m.mobile || '',
              role: m.role === 'ADMIN' ? 'Admin' : 'Associate',
              referralCode: m.memberCode,
              status: m.status,
              joinedDate: m.joiningDate ? m.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
              sponsorId: m.referrerId || null,
            }));
            setServerDownlines(mapped);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, currentMember]);

  // Compute members to display: Admin sees all, Member sees ONLY their branch and downline members, sorted by Hierarchy Level depth (Root -> L1 -> L2...)
  const displayMembers = useMemo(() => {
    let sourceList = isAdmin ? members : (serverDownlines.length > 0 ? serverDownlines : members);
    if (!isAdmin && serverDownlines.length === 0 && currentMember) {
      const downlineSet = new Set([currentMember.id]);
      let addedNew = true;
      while (addedNew) {
        addedNew = false;
        sourceList.forEach((m) => {
          if (
            m.sponsorId !== null &&
            m.sponsorId !== undefined &&
            downlineSet.has(m.sponsorId) &&
            !downlineSet.has(m.id)
          ) {
            downlineSet.add(m.id);
            addedNew = true;
          }
        });
      }
      sourceList = sourceList.filter((m) => downlineSet.has(m.id));
    }

    if (!sourceList || sourceList.length === 0) return [];

    // Calculate level depth from root sponsors
    const levelMap = new Map();
    let changed = true;
    let passes = 0;
    while (changed && passes < 50) {
      changed = false;
      passes++;
      sourceList.forEach((m) => {
        if (!levelMap.has(m.id)) {
          if (!m.sponsorId || m.sponsorId === m.id) {
            levelMap.set(m.id, 0); // Root level 0
            changed = true;
          } else if (levelMap.has(m.sponsorId)) {
            levelMap.set(m.id, levelMap.get(m.sponsorId) + 1);
            changed = true;
          }
        }
      });
    }

    // Assign level depth to member objects
    const listWithLevels = sourceList.map((m) => ({
      ...m,
      level: levelMap.has(m.id) ? levelMap.get(m.id) : (m.level !== undefined ? m.level : 0),
    }));

    // Primary sort by hierarchy level ASC, secondary by sponsorId ASC, tertiary by ID
    return listWithLevels.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.sponsorId !== b.sponsorId) return (a.sponsorId || 0) - (b.sponsorId || 0);
      return String(a.id).localeCompare(String(b.id));
    });
  }, [members, currentMember, isAdmin, serverDownlines]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');

    const adminMember = members.find((m) => m.role === 'Admin' || m.role === 'ADMIN' || m.id === user?.id) || members[0];
    const defaultSponsorCode = !isAdmin && currentMember
      ? (currentMember.referralCode || String(currentMember.id))
      : (adminMember?.referralCode || user?.referralCode || 'ADM-0001');

    setSponsorReferralCode(defaultSponsorCode);
    setSponsorId(isAdmin ? String(adminMember?.id || '1') : String(currentMember?.id || user?.id || '1'));

    const autoCode = generateUniqueReferralCode('', members);
    setReferralCode(autoCode);

    setMembershipAmount(10000);
    setIsPaymentConfirmed(true);
    setOpenModal(true);
  };

  const handleRegenerateCode = () => {
    const newCode = generateUniqueReferralCode(name, members);
    setReferralCode(newCode);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setName(member.name || '');
    setEmail(member.email || '');
    setReferralCode(member.referralCode || '');
    
    // Find sponsor code
    const sponsorObj = members.find(m => m.id === member.sponsorId);
    setSponsorReferralCode(sponsorObj ? (sponsorObj.referralCode || String(sponsorObj.id)) : '');
    setSponsorId(member.sponsorId ? String(member.sponsorId) : '');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingMember(null);
    setName('');
    setEmail('');
    setReferralCode('');
    setSponsorReferralCode('');
    setSponsorId('');
  };

  const [createdCredentialsModal, setCreatedCredentialsModal] = useState({ open: false, data: null });
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const executeAddMember = (payload) => {
    dispatch(addMemberRequest(payload));
    
    const sponsorNameStr = matchedSponsor ? matchedSponsor.name : 'Network Root';
    setRegistrationNotice(
      `Registered ${payload.name} under sponsor "${sponsorNameStr}" (Code: ${payload.referralCode})! Email verified and member placed in tree line.`
    );

    setCreatedCredentialsModal({
      open: true,
      data: {
        name: payload.name,
        email: payload.email,
        memberCode: payload.referralCode,
        password: payload.password,
        sponsorName: sponsorNameStr,
      },
    });

    handleCloseModal();
    setActiveTab(1);
    setTimeout(() => setRegistrationNotice(''), 8000);
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!name || !email || !referralCode || !isReferralCodeUnique) return;

    const finalSponsorId = matchedSponsor ? matchedSponsor.id : (sponsorId ? parseInt(sponsorId, 10) : null);
    const autoPassword = `AK@${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      name,
      email,
      password: autoPassword,
      referralCode: referralCode.trim().toUpperCase(),
      sponsorId: finalSponsorId,
      membershipAmount: parseFloat(membershipAmount) || 10000,
      isPaymentConfirmed,
      membershipTxId: `MTX-REG-${Date.now()}`,
    };

    if (editingMember) {
      // Edit Mode
      dispatch(updateMemberRequest({
        ...payload,
        id: editingMember.id,
        joinedDate: editingMember.joinedDate
      }));
      handleCloseModal();
    } else {
      // Add Mode: Open Email OTP verification modal first
      setPendingPayload(payload);
      setOtpModalOpen(true);
    }
  };

  // MUI DataGrid Column Configuration
  const columns = [
    { field: 'id', headerName: 'ID', width: 90, sortable: true },
    { 
      field: 'level', 
      headerName: 'Hierarchy Level', 
      width: 170, 
      sortable: true,
      renderCell: (params) => {
        const lvl = params.value ?? 0;
        return (
          <Chip 
            label={lvl === 0 ? '👑 Level 0 (Root)' : `Level ${lvl} Downline`} 
            size="small" 
            color={lvl === 0 ? 'primary' : lvl === 1 ? 'secondary' : 'default'} 
            variant={lvl === 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }} 
          />
        );
      }
    },
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1, 
      minWidth: 180, 
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <strong>{params.value}</strong>
          {params.row.id === currentMember?.id && (
            <Chip label="You (Root)" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
          )}
        </Box>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    { 
      field: 'referralCode', 
      headerName: 'Unique Referral Code', 
      width: 170,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'N/A'} 
          size="small" 
          color="secondary" 
          variant="outlined" 
          sx={{ fontWeight: 700 }} 
        />
      )
    },
    { 
      field: 'sponsorId', 
      headerName: 'Sponsor ID', 
      width: 130, 
      renderCell: (params) => {
        const sponsorObj = members.find(m => m.id === params.value);
        return params.value ? (
          <Box>
            <strong style={{ color: '#064E3B' }}>ID: {params.value}</strong>
            {sponsorObj && (
              <Typography variant="caption" display="block" color="text.secondary">
                ({sponsorObj.name})
              </Typography>
            )}
          </Box>
        ) : (
          <em style={{ color: '#94A3B8' }}>Root Sponsor</em>
        );
      }
    },
    { field: 'joinedDate', headerName: 'Joined Date', width: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
          onClick={() => handleOpenEditModal(params.row)}
          sx={{ py: 0.5 }}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <Box>
      {/* Header Title Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            {isAdmin ? 'Member Directory & Unilevel Tree' : 'My Downline Network Tree'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin 
              ? 'Manage network members, confirm membership payments, generate unique referral codes, and verify placement in the tree line.' 
              : 'View your personal referral network, downline organization, and placement tree.'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
          sx={{ fontWeight: 700 }}
        >
          Register New Referral
        </Button>
      </Box>

      {/* Registration Success Banner */}
      {registrationNotice && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}>
          {registrationNotice}
        </Alert>
      )}

      {/* Error Alert with Retry Dispatch */}
      {error && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => dispatch(fetchMembersRequest())}>
              Retry Fetch
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {!isAdmin && currentMember && (
        <Alert severity="info" icon={<AccountTreeIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Showing downline members referred by <strong>{currentMember.name}</strong> (Referral Code: <strong>{currentMember.referralCode}</strong> | Sponsor ID: <strong>{currentMember.id}</strong>). You are viewing your dedicated branch and downline hierarchy only.
        </Alert>
      )}

      {/* Tabs Selector for Directory List vs Unilevel Tree Chart */}
      <Paper sx={{ mb: 3.5 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)} 
          indicatorColor="secondary" 
          textColor="secondary"
          sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}
        >
          <Tab 
            label={`Member Directory List (${displayMembers.length})`} 
            sx={{ fontWeight: 700, py: 1.5 }} 
          />
          <Tab 
            icon={<AccountTreeIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label="Unilevel Network Tree Chart" 
            sx={{ fontWeight: 700, py: 1.5 }} 
          />
        </Tabs>
      </Paper>

      {/* State View Cycling */}
      {activeTab === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <DataGrid
            rows={displayMembers}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [{ field: 'level', sort: 'asc' }],
              },
            }}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell': { py: 1.5 },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAF9F6', fontWeight: 700 },
            }}
          />
        </Paper>
      ) : (
        <Box sx={{ width: '100%' }}>
          {loading ? (
            <Paper variant="outlined" sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 3 }}>
              <CircularProgress color="secondary" size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading network tree hierarchy via Redux-Saga...
              </Typography>
            </Paper>
          ) : (
            <UnilevelTree members={displayMembers} />
          )}
        </Box>
      )}

      {/* Add / Edit Profile Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
          {editingMember ? 'Edit Member Profile' : 'Register New Referral (Sponsor Referral Code Lookup)'}
        </DialogTitle>
        <form onSubmit={handleSaveMember}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            
            {/* Step 1: Sponsor Referral Code Lookup */}
            {!editingMember && (
              <Box sx={{ p: 2, bgcolor: '#FAF9F6', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon fontSize="small" color="secondary" /> Step 1: Enter Sponsor Referral Code
                </Typography>

                <TextField
                  label="Sponsor Referral Code"
                  variant="outlined"
                  fullWidth
                  required
                  value={sponsorReferralCode}
                  onChange={(e) => setSponsorReferralCode(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder="e.g. AK100, PC101"
                  helperText={!isAdmin ? "Automatically set to your personal referral code" : "Enter referral code of the sponsor who invited this new member"}
                  sx={{ bgcolor: 'white' }}
                />

                {/* Real-time Sponsor Matching Status */}
                {matchedSponsor ? (
                  <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: '#F0FDF4', borderColor: '#BBF7D0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534' }}>
                        Verified Sponsor: {matchedSponsor.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803D' }}>
                        Sponsor ID: <strong>{matchedSponsor.id}</strong> | Code: <strong>{matchedSponsor.referralCode}</strong> | Role: {matchedSponsor.role}
                      </Typography>
                    </Box>
                  </Paper>
                ) : sponsorReferralCode ? (
                  <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: '#FEF2F2', borderColor: '#FECACA', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#991B1B' }}>
                      Sponsor Referral Code "{sponsorReferralCode}" not found in network.
                    </Typography>
                  </Paper>
                ) : null}
              </Box>
            )}

            {/* Step 2: New Member Details & System-Generated Unique Referral Code */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark', mt: 1 }}>
              Step 2: New Member Information & System-Generated Referral Code
            </Typography>

            <TextField
              label="Full Name"
              variant="outlined"
              fullWidth
              required
              disabled={saving}
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                if (!editingMember) {
                  setReferralCode(generateUniqueReferralCode(newName, members));
                }
              }}
            />

            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              disabled={saving}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* System-Generated Unique Referral Code (LOCKED / READ-ONLY) */}
            <Box>
              <TextField
                label="New Member Unique Referral Code (System Locked)"
                variant="outlined"
                fullWidth
                required
                disabled={true}
                value={referralCode}
                helperText="🔒 System-Generated & Locked. Used by this new member to refer downlines."
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: !editingMember && (
                      <InputAdornment position="end">
                        <IconButton
                          color="secondary"
                          onClick={handleRegenerateCode}
                          title="Regenerate System Code"
                          size="small"
                        >
                          <AutoFixHighIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ bgcolor: '#F8FAFC' }}
              />
            </Box>

            {/* Step 3: Payment Confirmation & Tree Placement Controls */}
            {!editingMember && (
              <Box sx={{ p: 2, bgcolor: '#FEFCE8', borderRadius: 2.5, border: '1px solid #FEF08A' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.dark', mb: 1 }}>
                  Step 3: Membership Payment & Tree Placement
                </Typography>

                <TextField
                  label="Membership Package Fee (₹)"
                  type="number"
                  variant="outlined"
                  fullWidth
                  required
                  disabled={saving}
                  value={membershipAmount}
                  onChange={(e) => setMembershipAmount(e.target.value)}
                  sx={{ bgcolor: 'white', mb: 1.5 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isPaymentConfirmed}
                      onChange={(e) => setIsPaymentConfirmed(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Payment Confirmed & Membership Activated ({isPaymentConfirmed ? 'Active & Confirmed' : 'Pending Payment'})
                    </Typography>
                  }
                />

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {isPaymentConfirmed 
                    ? `✓ Payment confirmed. The user will be placed under ${matchedSponsor ? matchedSponsor.name : 'Sponsor'} in the Unilevel Tree line, and 20-level upline commissions will be generated.`
                    : '⚠️ Payment pending. User will not generate upline commissions until payment is confirmed.'}
                </Typography>
              </Box>
            )}

          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={handleCloseModal} color="inherit" disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={saving || (!editingMember && (!matchedSponsor || !isReferralCodeUnique))}
              sx={{ fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : editingMember ? 'Save Profile Changes' : 'Confirm Payment & Place in Tree'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Member Enrolled Credentials Modal */}
      <Dialog
        open={createdCredentialsModal.open}
        onClose={() => setCreatedCredentialsModal({ open: false, data: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', textAlign: 'center', py: 2.5 }}>
          🎉 New Member Enrolled Successfully!
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          {createdCredentialsModal.data && (
            <>
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                Member <strong>{createdCredentialsModal.data.name}</strong> has been enrolled and placed under sponsor <strong>{createdCredentialsModal.data.sponsorName}</strong>.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#ECFDF5', borderColor: '#A7F3D0', borderRadius: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon sx={{ color: '#047857' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46' }}>
                    Auto-Generated Login Credentials
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: '#A7F3D0' }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Member Referral Code
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#065F46' }}>
                    {createdCredentialsModal.data.memberCode}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Login Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#065F46' }}>
                    {createdCredentialsModal.data.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Auto-Generated Temporary Password
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'white', borderColor: '#6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#047857', letterSpacing: '0.05em' }}>
                      {createdCredentialsModal.data.password}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => {
                        if (createdCredentialsModal.data?.password) {
                          navigator.clipboard.writeText(
                            `Member Code: ${createdCredentialsModal.data.memberCode}\nEmail: ${createdCredentialsModal.data.email}\nPassword: ${createdCredentialsModal.data.password}`
                          );
                        }
                      }}
                      sx={{ fontSize: '0.7rem', py: 0.3, px: 1, bgcolor: '#059669' }}
                    >
                      Copy Credentials
                    </Button>
                  </Paper>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2, fontSize: '0.78rem' }}>
                ℹ️ The member can log in using their email/member code and password, and change their password anytime via <strong>Profile Settings</strong>.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCreatedCredentialsModal({ open: false, data: null })}
            sx={{ fontWeight: 700, px: 4 }}
          >
            Done & Return to Directory
          </Button>
        </DialogActions>
      </Dialog>

      <OtpVerificationModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={pendingPayload?.email}
        purpose="EMAIL_VERIFICATION"
        onVerifySuccess={() => {
          if (pendingPayload) {
            executeAddMember(pendingPayload);
            setPendingPayload(null);
          }
        }}
      />
    </Box>
  );
};

export default MemberManagement;
