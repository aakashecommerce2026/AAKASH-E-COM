import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  LinearProgress,
  TextField,
  MenuItem,
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
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';
import { useLocation } from 'react-router-dom';
import { fetchMembersRequest, addMemberRequest, updateMemberRequest, deleteMemberRequest } from '../store/actions';
import { UnilevelTree } from '../components/UnilevelTree';
import RegisterModal from '../components/RegisterModal';
import { hierarchyApi, membersApi } from '../services/api';

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
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [role, setRole] = useState('MEMBER');
  const [referralCode, setReferralCode] = useState('');
  const [sponsorReferralCode, setSponsorReferralCode] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [membershipAmount, setMembershipAmount] = useState(10000);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [registrationNotice, setRegistrationNotice] = useState('');
  const [serverDownlines, setServerDownlines] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteMember, setSelectedDeleteMember] = useState(null);

  const handleOpenDeleteModal = (member) => {
    setSelectedDeleteMember(member);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDeleteMember) {
      dispatch(deleteMemberRequest(selectedDeleteMember.id));
      setDeleteModalOpen(false);
      setSelectedDeleteMember(null);
    }
  };

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
              address: m.address || '',
              profilePhoto: m.profilePhoto || null,
              upiId: m.upiId || null,
              bankDetails: m.bankDetails || null,
              profileCompletionPercentage: m.profileCompletionPercentage !== undefined ? m.profileCompletionPercentage : null,
              isProfileComplete: m.isProfileComplete || false,
              missingProfileFields: m.missingProfileFields || [],
              isCommissionFrozen: !!m.isCommissionFrozen,
              commissionFreezeReason: m.commissionFreezeReason || null,
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

    if (!isAdmin && currentMember) {
      const hasCurrent = sourceList.some(
        (m) =>
          String(m.id) === String(currentMember.id) ||
          (m.referralCode && currentMember.referralCode && m.referralCode === currentMember.referralCode)
      );

      if (!hasCurrent) {
        const rootNode = {
          ...currentMember,
          sponsorId: currentMember.sponsorId || null,
          referrerId: currentMember.sponsorId || null,
          level: 0,
        };
        sourceList = [rootNode, ...sourceList];
      }
    }

    if (!sourceList || sourceList.length === 0) return [];

    // Calculate level depth from root sponsors
    const levelMap = new Map();
    if (!isAdmin && currentMember) {
      levelMap.set(String(currentMember.id), 0);
    }

    let changed = true;
    let passes = 0;
    while (changed && passes < 50) {
      changed = false;
      passes++;
      sourceList.forEach((m) => {
        const mIdStr = String(m.id);
        if (!levelMap.has(mIdStr)) {
          const parentId = m.sponsorId || m.referrerId || m.referrer_id || m.sponsor_id;
          const parentIdStr = parentId ? String(parentId) : null;

          if (!parentIdStr || parentIdStr === mIdStr || !sourceList.some((p) => String(p.id) === parentIdStr)) {
            levelMap.set(mIdStr, 0); // Root level 0
            changed = true;
          } else if (levelMap.has(parentIdStr)) {
            levelMap.set(mIdStr, levelMap.get(parentIdStr) + 1);
            changed = true;
          }
        }
      });
    }

    // Assign level depth to member objects
    const listWithLevels = sourceList.map((m) => {
      const mIdStr = String(m.id);
      return {
        ...m,
        level: levelMap.has(mIdStr) ? levelMap.get(mIdStr) : (m.level !== undefined ? m.level : 0),
      };
    });

    // Primary sort by hierarchy level ASC, secondary by sponsorId ASC, tertiary by ID
    return listWithLevels.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.sponsorId !== b.sponsorId) return String(a.sponsorId || 0).localeCompare(String(b.sponsorId || 0));
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
    setMobile(member.mobile || '');
    setUsername(member.username || member.user_name || '');
    setStatus(member.status || 'ACTIVE');
    setRole(member.role === 'Admin' || member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
    setReferralCode(member.referralCode || member.memberCode || '');
    
    // Find sponsor code
    const sponsorObj = members.find(m => m.id === member.sponsorId || m.id === member.referrerId);
    setSponsorReferralCode(sponsorObj ? (sponsorObj.referralCode || sponsorObj.memberCode || String(sponsorObj.id)) : '');
    setSponsorId(member.sponsorId ? String(member.sponsorId) : (member.referrerId ? String(member.referrerId) : ''));
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingMember(null);
    setName('');
    setEmail('');
    setMobile('');
    setUsername('');
    setStatus('ACTIVE');
    setRole('MEMBER');
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
    if (!name || !email) return;

    if (editingMember) {
      // Edit Mode: Update profile fields without altering existing referrer/sponsor structure
      const updatePayload = {
        id: editingMember.id,
        name: name.trim(),
        email: email.trim(),
        ...(mobile ? { mobile: mobile.trim() } : {}),
        ...(username ? { username: username.trim() } : {}),
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      };

      dispatch(updateMemberRequest(updatePayload));
      handleCloseModal();
    } else {
      // Add Mode
      if (!referralCode || !isReferralCodeUnique) return;
      const finalSponsorId = matchedSponsor ? matchedSponsor.id : (sponsorId ? parseInt(sponsorId, 10) : null);
      const autoPassword = `AK@${Math.floor(100000 + Math.random() * 900000)}`;

      const payload = {
        name,
        email,
        mobile: mobile.trim() || undefined,
        password: autoPassword,
        referralCode: referralCode.trim().toUpperCase(),
        sponsorId: finalSponsorId,
        membershipAmount: parseFloat(membershipAmount) || 10000,
        isPaymentConfirmed,
        membershipTxId: `MTX-REG-${Date.now()}`,
      };

      setPendingPayload(payload);
      setOtpModalOpen(true);
    }
  };

  const [freezeModal, setFreezeModal] = useState({
    open: false,
    member: null,
    reason: '',
    submitting: false,
  });

  const calculateMemberCompletion = (row) => {
    if (row.profileCompletionPercentage !== undefined && row.profileCompletionPercentage !== null) {
      return row.profileCompletionPercentage;
    }
    let score = 0;
    if (row.name && row.name.trim()) score += 15;
    if (row.mobile && row.mobile.trim()) score += 15;
    if (row.email && row.email.trim()) score += 15;
    if (row.username || row.user_name) score += 15;
    if (row.address && row.address.trim()) score += 15;
    if (row.upiId || row.bankDetails) score += 20;
    if (row.profilePhoto && row.profilePhoto.trim()) score += 5;
    return score;
  };

  const handleOpenFreezeModal = (member) => {
    setFreezeModal({
      open: true,
      member,
      reason: member.commissionFreezeReason || '',
      submitting: false,
    });
  };

  const handleToggleCommissionFreeze = async (e) => {
    e.preventDefault();
    if (!freezeModal.member) return;

    setFreezeModal((prev) => ({ ...prev, submitting: true }));
    try {
      const isFrozen = !freezeModal.member.isCommissionFrozen;
      await membersApi.toggleCommissionFreeze(freezeModal.member.id, {
        isFrozen,
        reason: freezeModal.reason,
      });

      dispatch(fetchMembersRequest());
      setRegistrationNotice(
        `Updated commission payout status for ${freezeModal.member.name} (${freezeModal.member.referralCode || freezeModal.member.memberCode}) to ${isFrozen ? 'FROZEN' : 'ACTIVE'}!`
      );
      setTimeout(() => setRegistrationNotice(''), 6000);
      setFreezeModal({ open: false, member: null, reason: '', submitting: false });
    } catch (err) {
      setRegistrationNotice('');
      setFreezeModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // MUI DataGrid Column Configuration
  const columns = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { 
      field: 'level', 
      headerName: 'Hierarchy Level', 
      width: 150, 
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
      minWidth: 170, 
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <strong>{params.value}</strong>
          {params.row.id === currentMember?.id && (
            <Chip label="You (Root)" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
          )}
        </Box>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1.1, minWidth: 180 },
    { 
      field: 'referralCode', 
      headerName: 'Referral Code', 
      width: 140,
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
      field: 'profileCompletion',
      headerName: 'Profile Progress',
      width: 180,
      sortable: true,
      renderCell: (params) => {
        const score = calculateMemberCompletion(params.row);
        const color = score >= 100 ? 'success' : score >= 60 ? 'warning' : 'error';
        return (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress variant="determinate" value={score} color={color} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Chip
              label={`${score}%`}
              size="small"
              color={color}
              sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800 }}
            />
          </Box>
        );
      }
    },
    {
      field: 'isCommissionFrozen',
      headerName: 'Commission Payout',
      width: 160,
      sortable: true,
      renderCell: (params) => {
        const isFrozen = params.row.isCommissionFrozen;
        return (
          <Chip
            icon={isFrozen ? <LockIcon sx={{ fontSize: '13px !important' }} /> : <CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
            label={isFrozen ? 'Frozen' : 'Active'}
            size="small"
            color={isFrozen ? 'error' : 'success'}
            variant={isFrozen ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    { 
      field: 'sponsorId', 
      headerName: 'Sponsor ID', 
      width: 120, 
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
    { field: 'joinedDate', headerName: 'Joined Date', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 13 }} />}
            onClick={() => handleOpenEditModal(params.row)}
            sx={{ py: 0.4, px: 1, fontSize: '0.72rem' }}
          >
            Edit
          </Button>
          {isAdmin && (
            <Button
              variant="outlined"
              color={params.row.isCommissionFrozen ? 'success' : 'warning'}
              size="small"
              startIcon={params.row.isCommissionFrozen ? <LockOpenIcon sx={{ fontSize: 13 }} /> : <LockIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleOpenFreezeModal(params.row)}
              sx={{ py: 0.4, px: 1, fontSize: '0.72rem' }}
            >
              {params.row.isCommissionFrozen ? 'Unfreeze' : 'Freeze'}
            </Button>
          )}
          {isAdmin && params.row.role !== 'Admin' && params.row.sponsorId !== null && (
            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenDeleteModal(params.row)}
              title="Delete Member Account & Re-attach Downline to Super Admin"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      {/* Header Title Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3.5, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: { xs: '1.4rem', sm: '2.1rem' } }}>
            {isAdmin ? 'Member Directory & Unilevel Tree' : 'My Downline Network Tree'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
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
          sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' }, py: 1 }}
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
      <Paper sx={{ mb: 3.5, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)} 
          indicatorColor="secondary" 
          textColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
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
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
          <Box sx={{ width: '100%', overflowX: 'auto', minHeight: 400 }}>
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
          </Box>
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

      {/* Full 3-Step Registration Modal for Registering New Member (with Username, Mobile, Password, Address, and 6-Digit Email OTP Verification) */}
      <RegisterModal
        open={Boolean(openModal && !editingMember)}
        onClose={handleCloseModal}
        defaultSponsorCode={user?.referralCode || user?.memberCode || ''}
        onSuccess={(created) => {
          dispatch(fetchMembersRequest());
          setRegistrationNotice(
            `✓ Member ${created.name} (${created.memberCode}) successfully registered and placed in your Unilevel Tree line!`
          );
          setTimeout(() => setRegistrationNotice(''), 6000);
          handleCloseModal();
        }}
      />

      {/* Edit Profile Dialog Modal for Existing Member Modifications */}
      <Dialog open={Boolean(openModal && editingMember)} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
          Edit Member Profile — {editingMember?.name}
        </DialogTitle>
        <form onSubmit={handleSaveMember}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
              Member Information & Profile Details
            </Typography>

            <TextField
              label="Full Name *"
              variant="outlined"
              fullWidth
              required
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              disabled={saving}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe123"
            />

            <TextField
              label="Email Address *"
              type="email"
              variant="outlined"
              fullWidth
              required
              disabled={saving}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Mobile Phone Number"
              variant="outlined"
              fullWidth
              disabled={saving}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+919876543210"
            />

            {isAdmin && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Member Status"
                  variant="outlined"
                  fullWidth
                  disabled={saving}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                  <MenuItem value="BLOCKED">BLOCKED</MenuItem>
                  <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Access Role"
                  variant="outlined"
                  fullWidth
                  disabled={saving}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="MEMBER">MEMBER (Associate)</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                  <MenuItem value="SUB_ADMIN">SUB_ADMIN</MenuItem>
                  <MenuItem value="SUPPORT">SUPPORT</MenuItem>
                </TextField>
              </Box>
            )}

            {/* System Referral Code (READ-ONLY) */}
            <TextField
              label="Member Unique Referral Code (Locked)"
              variant="outlined"
              fullWidth
              disabled={true}
              value={referralCode}
              helperText="🔒 System-Generated Member Code"
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: '#F8FAFC' }}
            />

          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={handleCloseModal} color="inherit" disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={saving || !name || !email}
              sx={{ fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Profile Changes'}
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

      {/* Commission Freeze / Unfreeze Dialog Modal */}
      <Dialog
        open={freezeModal.open}
        onClose={() => setFreezeModal({ open: false, member: null, reason: '', submitting: false })}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <form onSubmit={handleToggleCommissionFreeze}>
          <DialogTitle
            sx={{
              bgcolor: freezeModal.member?.isCommissionFrozen ? '#F0FDF4' : '#FEF2F2',
              color: freezeModal.member?.isCommissionFrozen ? '#166534' : '#991B1B',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 2,
            }}
          >
            {freezeModal.member?.isCommissionFrozen ? (
              <LockOpenIcon sx={{ color: '#16A34A' }} />
            ) : (
              <LockIcon sx={{ color: '#DC2626' }} />
            )}
            <Typography variant="subtitle1" fontWeight={800}>
              {freezeModal.member?.isCommissionFrozen ? 'Unfreeze Member Commission' : 'Freeze Member Commission'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {freezeModal.member && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Member: <strong>{freezeModal.member.name}</strong> ({freezeModal.member.referralCode || freezeModal.member.memberCode})
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Profile Completion Progress:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={calculateMemberCompletion(freezeModal.member)}
                        color={calculateMemberCompletion(freezeModal.member) >= 100 ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Chip
                      label={`${calculateMemberCompletion(freezeModal.member)}%`}
                      size="small"
                      color={calculateMemberCompletion(freezeModal.member) >= 100 ? 'success' : 'warning'}
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>
                </Paper>

                <TextField
                  label="Freeze / Unfreeze Reason"
                  multiline
                  rows={2}
                  fullWidth
                  value={freezeModal.reason}
                  onChange={(e) => setFreezeModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder={freezeModal.member?.isCommissionFrozen ? 'Enter reason for unfreezing commission...' : 'e.g. Profile incomplete - missing bank details and address'}
                  helperText="Reason will be recorded in activity audit logs."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button
              onClick={() => setFreezeModal({ open: false, member: null, reason: '', submitting: false })}
              color="inherit"
              disabled={freezeModal.submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={freezeModal.member?.isCommissionFrozen ? 'success' : 'error'}
              disabled={freezeModal.submitting}
              sx={{ fontWeight: 700 }}
            >
              {freezeModal.submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : freezeModal.member?.isCommissionFrozen ? (
                'Confirm Unfreeze'
              ) : (
                'Confirm Freeze'
              )}
            </Button>
          </DialogActions>
        </form>
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

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main', pb: 1 }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to delete member <strong>{selectedDeleteMember?.name}</strong> ({selectedDeleteMember?.referralCode})?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Network Downline Re-attachment:</strong> All direct referral downlines under this member will be automatically re-attached to the Super Admin root account.
          </Alert>
          <Typography variant="caption" color="text.secondary" display="block">
            An official account termination email notice will be sent to <strong>{selectedDeleteMember?.email || 'the member email'}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ fontWeight: 700 }}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberManagement;
