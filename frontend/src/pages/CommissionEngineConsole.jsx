import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import ShieldIcon from '@mui/icons-material/Shield';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BugReportIcon from '@mui/icons-material/BugReport';
import LockIcon from '@mui/icons-material/Lock';

import {
  updateCommissionStrategyRules,
  resetCommissionStrategyRules,
  updateRepurchaseStrategyRules,
  resetRepurchaseStrategyRules,
  generateMembershipCommissionsRequest,
  clearCommissionEngineLogs,
  toggleCommissionDeductions,
  generateRepurchaseCommissionsRequest,
  clearRepurchaseEngineLogs,
  fetchCommissionConfigsRequest,
  saveMembershipConfigRequest,
  saveRepurchaseConfigRequest,
  fetchTdsStatusRequest,
  saveTdsStatusRequest,
} from '../store/actions';
import { CommissionProcessor } from '../services/commissionEngine/CommissionProcessor';
import { MembershipCommissionStrategy, DEFAULT_MEMBERSHIP_RULES } from '../services/commissionEngine/MembershipCommissionStrategy';
import { RepurchaseCommissionProcessor } from '../services/commissionEngine/RepurchaseCommissionProcessor';
import { RepurchaseCommissionStrategy, DEFAULT_REPURCHASE_RULES } from '../services/commissionEngine/RepurchaseCommissionStrategy';
import CommissionAuditModal from '../components/CommissionAuditModal';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const CommissionEngineConsole = () => {
  const dispatch = useDispatch();
  const { members } = useSelector((state) => state.membership);
  const {
    strategyRules,
    repurchaseStrategyRules,
    currentMembershipVersion,
    engineLogs,
    repurchaseEngineLogs,
    processedTxIds,
    enableDeductions = true,
  } = useSelector((state) => state.commission);

  const [engineMode, setEngineMode] = useState('MEMBERSHIP'); // 'MEMBERSHIP' | 'REPURCHASE'
  const [activeTab, setActiveTab] = useState(0); // 0 = Rules Config, 1 = Traversal Simulator, 2 = Audit Logs

  const activeLogs = engineMode === 'MEMBERSHIP' ? (engineLogs || []) : (repurchaseEngineLogs || []);

  // Fetch live active database configuration and TDS status on mount
  React.useEffect(() => {
    dispatch(fetchCommissionConfigsRequest());
    dispatch(fetchTdsStatusRequest());
  }, [dispatch]);

  // Editable 20-Level State Maps for both engines
  const [membershipRules, setMembershipRules] = useState(() => {
    if (typeof strategyRules === 'object' && !Array.isArray(strategyRules)) return { ...DEFAULT_MEMBERSHIP_RULES, ...strategyRules };
    return { ...DEFAULT_MEMBERSHIP_RULES };
  });

  const [repurchaseRules, setRepurchaseRules] = useState(() => {
    return { ...DEFAULT_REPURCHASE_RULES, ...(repurchaseStrategyRules || {}) };
  });

  // Sync component state when Redux rules are loaded from database
  React.useEffect(() => {
    if (strategyRules && typeof strategyRules === 'object') {
      setMembershipRules({ ...DEFAULT_MEMBERSHIP_RULES, ...strategyRules });
    }
  }, [strategyRules]);

  React.useEffect(() => {
    if (repurchaseStrategyRules && typeof repurchaseStrategyRules === 'object') {
      setRepurchaseRules({ ...DEFAULT_REPURCHASE_RULES, ...repurchaseStrategyRules });
    }
  }, [repurchaseStrategyRules]);

  const [ruleSaveMessage, setRuleSaveMessage] = useState('');
  const [benchmarkAmount, setBenchmarkAmount] = useState(10000);

  // Active level map (Levels 1 through 20)
  const currentRules = engineMode === 'MEMBERSHIP' ? membershipRules : repurchaseRules;

  // Handle Level Rate Input Changes for levels 1..20
  const handleLevelRateChange = (level, val) => {
    const parsed = parseFloat(val);
    const safeRate = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    if (engineMode === 'MEMBERSHIP') {
      setMembershipRules((prev) => ({ ...prev, [level]: safeRate }));
    } else {
      setRepurchaseRules((prev) => ({ ...prev, [level]: safeRate }));
    }
  };

  // Calculate total pool percentage across all 20 levels
  const totalPoolPercentage = useMemo(() => {
    const rulesObj = engineMode === 'MEMBERSHIP' ? membershipRules : repurchaseRules;
    let sum = 0;
    for (let lvl = 1; lvl <= 20; lvl++) {
      sum += parseFloat(rulesObj[lvl]) || 0;
    }
    return Math.round(sum * 100) / 100;
  }, [engineMode, membershipRules, repurchaseRules]);

  // Calculate total max simulated payout for 20 levels
  const totalSimulatedPayout = useMemo(() => {
    const base = parseFloat(benchmarkAmount) || 0;
    return (base * totalPoolPercentage) / 100;
  }, [benchmarkAmount, totalPoolPercentage]);

  // Simulator Form State
  const [simMemberName, setSimMemberName] = useState('Rahul Verma');
  const [simSponsorId, setSimSponsorId] = useState(members && members.length > 1 ? String(members[members.length - 1].id) : '10');
  const [simTxId, setSimTxId] = useState(`TX-SIM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [simAmount, setSimAmount] = useState(10000);
  const [simPaymentConfirmed, setSimPaymentConfirmed] = useState(true);

  // Simulation Result State
  const [simulationResult, setSimulationResult] = useState(null);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState(null);

  // Dynamic sponsor options from Redux members
  const sponsorOptions = useMemo(() => {
    return members || [];
  }, [members]);

  const handleSaveRules = () => {
    if (engineMode === 'MEMBERSHIP') {
      const rates = Array.from({ length: 20 }, (_, i) => ({
        level: i + 1,
        percentage: parseFloat(membershipRules[i + 1]) || 0,
      }));
      dispatch(updateCommissionStrategyRules(membershipRules));
      dispatch(
        saveMembershipConfigRequest({
          version: (currentMembershipVersion || 1) + 1,
          isActive: true,
          rates,
        })
      );
      setRuleSaveMessage('Direct referral membership 20-Level strategy rates saved to database successfully!');
    } else {
      const rates = Array.from({ length: 20 }, (_, i) => ({
        level: i + 1,
        percentage: parseFloat(repurchaseRules[i + 1]) || 0,
      }));
      dispatch(updateRepurchaseStrategyRules(repurchaseRules));
      dispatch(saveRepurchaseConfigRequest({ rates }));
      setRuleSaveMessage('Repurchase 20-Level strategy rates saved to database successfully!');
    }
    setTimeout(() => setRuleSaveMessage(''), 5000);
  };

  const handleResetRules = () => {
    if (engineMode === 'MEMBERSHIP') {
      dispatch(resetCommissionStrategyRules());
      setMembershipRules({ ...DEFAULT_MEMBERSHIP_RULES });
      setRuleSaveMessage('Membership 20-Level strategy rates reset to default structure.');
    } else {
      dispatch(resetRepurchaseStrategyRules());
      setRepurchaseRules({ ...DEFAULT_REPURCHASE_RULES });
      setRuleSaveMessage('Repurchase 20-Level strategy rates reset to default 5% pool structure.');
    }
    setTimeout(() => setRuleSaveMessage(''), 4000);
  };

  // Execute Commission Engine Simulation
  const handleRunSimulation = (simulateFault = false) => {
    const selectedSponsor = sponsorOptions.find((m) => String(m.id) === String(simSponsorId));
    const simulatedMember = {
      id: Date.now(),
      name: simMemberName || 'New Member',
      sponsorId: selectedSponsor ? selectedSponsor.id : (simSponsorId ? parseInt(simSponsorId, 10) : null),
    };

    if (engineMode === 'MEMBERSHIP') {
      const customStrategy = new MembershipCommissionStrategy(membershipRules);

      const result = CommissionProcessor.processMembershipCommission({
        member: simulatedMember,
        membershipTxId: simTxId,
        membershipAmount: parseFloat(simAmount) || 10000,
        isPaymentConfirmed: simPaymentConfirmed,
        membersList: sponsorOptions,
        strategy: customStrategy,
        simulateFault,
        enableDeductions,
      });

      setSimulationResult(result);

      if (result.success && !simulateFault) {
        dispatch(generateMembershipCommissionsRequest({
          member: simulatedMember,
          membershipTxId: simTxId,
          membershipAmount: parseFloat(simAmount) || 10000,
          isPaymentConfirmed: simPaymentConfirmed,
        }));
      }
    } else {
      const customStrategy = new RepurchaseCommissionStrategy(repurchaseRules);

      const result = RepurchaseCommissionProcessor.processRepurchaseCommission({
        member: simulatedMember,
        repurchaseTxId: simTxId,
        repurchaseAmount: parseFloat(simAmount) || 5000,
        isPaymentConfirmed: simPaymentConfirmed,
        membersList: sponsorOptions,
        strategy: customStrategy,
        simulateFault,
        enableDeductions,
      });

      setSimulationResult(result);

      if (result.success && !simulateFault) {
        dispatch(generateRepurchaseCommissionsRequest({
          member: simulatedMember,
          repurchaseTxId: simTxId,
          repurchaseAmount: parseFloat(simAmount) || 5000,
          isPaymentConfirmed: simPaymentConfirmed,
        }));
      }
    }
  };

  // Generate fresh Tx ID
  const handleRefreshTxId = () => {
    const prefix = engineMode === 'MEMBERSHIP' ? 'MTX' : 'REPTX';
    setSimTxId(`${prefix}-SIM-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Banner & Engine Mode Switcher */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsSuggestIcon sx={{ fontSize: 36, color: 'secondary.main' }} />
            {engineMode === 'MEMBERSHIP' ? 'Membership Commission Engine Console' : 'Repurchase Commission Engine Console'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Modular, scalable Unilevel MLM Commission Engine with 20-level hierarchy traversal, strategy pattern configuration, idempotency protection, ledger creation, and atomic transaction rollback.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2.5, bgcolor: '#FAF9F6' }}>
          <ToggleButtonGroup
            value={engineMode}
            exclusive
            onChange={(e, val) => val && setEngineMode(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="MEMBERSHIP" sx={{ fontWeight: 800, px: 2, py: 0.75 }}>
              Membership Engine
            </ToggleButton>
            <ToggleButton value="REPURCHASE" sx={{ fontWeight: 800, px: 2, py: 0.75 }}>
              Repurchase Engine
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* KPI Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderColor: '#BBF7D0', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                <AccountTreeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                  Max Upline Traversal
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.25 }}>
                  20 Levels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FEFCE8', borderColor: '#FEF08A', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
                <AutoFixHighIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                  Active Strategy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.dark', mt: 0.25 }}>
                  {engineMode === 'MEMBERSHIP' ? 'Membership 20L' : 'Repurchase 20L (5% Pool)'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#059669', width: 44, height: 44 }}>
                <ShieldIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Processed Tx IDs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.25 }}>
                  {processedTxIds?.length || 0} Tx
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#0284C7', width: 44, height: 44 }}>
                <HistoryEduIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Audit Trail Records
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284C7', mt: 0.25 }}>
                  {activeLogs?.length || 0} Logs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Switcher */}
      <Paper sx={{ mb: 3.5 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="secondary"
          textColor="secondary"
          sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}
        >
          <Tab
            icon={<SettingsSuggestIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="20-Level Commission Rules"
            sx={{ fontWeight: 700, py: 1.5 }}
          />
          <Tab
            icon={<PlayArrowIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Hierarchy Traversal Simulator"
            sx={{ fontWeight: 700, py: 1.5 }}
          />
          <Tab
            icon={<HistoryEduIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Engine Audit Trail (${engineLogs?.length || 0})`}
            sx={{ fontWeight: 700, py: 1.5 }}
          />
        </Tabs>
      </Paper>

      {/* ================= TAB 0: CONFIGURABLE STRATEGY RULES ================= */}
      {activeTab === 0 && (
        <Box>
          {ruleSaveMessage && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {ruleSaveMessage}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {engineMode === 'MEMBERSHIP' ? 'Membership Commission (Direct) 20-Level Matrix' : 'Repurchase Commission 20-Level Matrix'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fully editable rate percentages for every level (Level 1 to Level 20). Adjust any level rate and click Save.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" color="primary" startIcon={<ReplayIcon />} onClick={handleResetRules}>
                  Reset Defaults
                </Button>
                <Button variant="contained" color="secondary" onClick={handleSaveRules}>
                  Save {engineMode === 'MEMBERSHIP' ? 'Direct' : 'Repurchase'} Strategy Rates
                </Button>
              </Box>
            </Box>

            {/* Dynamic Statutory Taxation & TDS Policy Card */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: enableDeductions ? '#FEFCE8' : '#F0FDF4', borderColor: enableDeductions ? '#FEF08A' : '#BBF7D0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ color: enableDeductions ? '#B45309' : '#15803D' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: enableDeductions ? '#854D0E' : '#166534' }}>
                    Dynamic Statutory Taxation & TDS Configuration
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableDeductions}
                      onChange={(e) => dispatch(saveTdsStatusRequest(e.target.checked))}
                      color="warning"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 800, color: enableDeductions ? '#B45309' : '#15803D' }}>
                      {enableDeductions ? 'Admin Tax Deductions: ENABLED (5% TDS + 5% Admin Fee)' : 'Admin Tax Deductions: DISABLED (0% Reduced)'}
                    </Typography>
                  }
                />
              </Box>
              <Typography variant="body2" sx={{ color: enableDeductions ? '#78350F' : '#14532D', mb: 2 }}>
                {enableDeductions
                  ? 'Admin Tax Deductions are currently TURNED ON. 5.00% TDS (Sec 194H) and 5.00% Admin Fee (total 10%) are automatically reduced from gross commissions.'
                  : 'Admin Tax Deductions are currently TURNED OFF. Gross commissions are distributed directly to beneficiaries without any TDS or Admin fee reductions.'}
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: `1px solid ${enableDeductions ? '#FEF08A' : '#BBF7D0'}` }}>
                    <Typography variant="caption" sx={{ color: enableDeductions ? '#92400E' : '#166534', fontWeight: 700, display: 'block' }}>
                      TDS Deduction (Sec 194H)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: enableDeductions ? '#B45309' : '#15803D' }}>
                      {enableDeductions ? '5.00%' : '0.00% (Off)'} <Chip label={enableDeductions ? 'Active' : 'Disabled'} size="small" color={enableDeductions ? 'warning' : 'success'} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: `1px solid ${enableDeductions ? '#FEF08A' : '#BBF7D0'}` }}>
                    <Typography variant="caption" sx={{ color: enableDeductions ? '#92400E' : '#166534', fontWeight: 700, display: 'block' }}>
                      Admin Service Charges
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: enableDeductions ? '#B45309' : '#15803D' }}>
                      {enableDeductions ? '5.00%' : '0.00% (Off)'} <Chip label={enableDeductions ? 'Active' : 'Disabled'} size="small" color={enableDeductions ? 'warning' : 'success'} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: `1px solid ${enableDeductions ? '#FEF08A' : '#BBF7D0'}` }}>
                    <Typography variant="caption" sx={{ color: enableDeductions ? '#92400E' : '#166534', fontWeight: 700, display: 'block' }}>
                      Net Payout Formula
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: enableDeductions ? '#92400E' : '#166534', mt: 0.5 }}>
                      {enableDeductions ? 'Gross Amount - 10.00%' : 'Gross Amount (100% Net)'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Admin Benchmark Amount Controls */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: '#FAF9F6' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6} md={4}>
                  <TextField
                    label="Benchmark Transaction Value (₹)"
                    type="number"
                    size="small"
                    fullWidth
                    value={benchmarkAmount}
                    onChange={(e) => setBenchmarkAmount(e.target.value)}
                    helperText="Type any fee amount to check payouts"
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={8}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, mb: 0.75 }}>
                    Quick Preset Fee Tiers (Click to test):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <Chip
                        key={amt}
                        label={formatINR(amt)}
                        clickable
                        color={parseFloat(benchmarkAmount) === amt ? 'secondary' : 'default'}
                        variant={parseFloat(benchmarkAmount) === amt ? 'filled' : 'outlined'}
                        onClick={() => setBenchmarkAmount(amt)}
                        sx={{ fontWeight: 700 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* 20 Individual Editable Levels Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#FAF9F6' }}>
                  <TableRow>
                    <TableCell><strong>Upline Tier Level</strong></TableCell>
                    <TableCell><strong>Description & Eligibility</strong></TableCell>
                    <TableCell align="center"><strong>Commission Rate (%)</strong></TableCell>
                    <TableCell align="right"><strong>Simulated Payout ({formatINR(benchmarkAmount)})</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
                    const rateVal = currentRules[lvl] !== undefined ? currentRules[lvl] : 0;
                    const simulatedAmt = (parseFloat(benchmarkAmount || 0) * rateVal) / 100;
                    
                    let desc = `Level ${lvl} Direct Upline`;
                    if (lvl === 1) desc = `Level 1 Direct Sponsor`;
                    else if (lvl === 2) desc = `Level 2 Indirect Sponsor`;
                    else if (lvl <= 5) desc = `Level ${lvl} Mid-Tier Upline`;
                    else if (lvl <= 10) desc = `Level ${lvl} Deep Network Upline`;
                    else desc = `Level ${lvl} Extended Unilevel Upline`;

                    return (
                      <TableRow key={lvl} hover>
                        <TableCell>
                          <Chip
                            label={`Level ${lvl}`}
                            color={lvl === 1 ? 'secondary' : lvl === 2 ? 'primary' : 'default'}
                            size="small"
                            sx={{ fontWeight: 700, width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {desc}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Traverses upward to 20-level direct sponsor chain
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={rateVal}
                            onChange={(e) => handleLevelRateChange(lvl, e.target.value)}
                            slotProps={{ htmlInput: { step: '0.05', min: '0', max: '100', style: { textAlign: 'center', fontWeight: 700 } } }}
                            sx={{ width: 110 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: rateVal > 0 ? 'primary.main' : 'text.disabled' }}>
                            {formatINR(simulatedAmt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total 20-Level Payout Summary Box */}
            <Box sx={{ mt: 3, p: 2.5, borderRadius: 2.5, bgcolor: '#0F172A', color: 'white' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total 20-Level Commission Pool
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#38BDF8', mt: 0.25 }}>
                    {totalPoolPercentage.toFixed(1)}% Pool Rate
                  </Typography>
                </Grid>

                <Grid xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Max Total Payout ({formatINR(benchmarkAmount)})
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#A7F3D0', mt: 0.25 }}>
                    {formatINR(totalSimulatedPayout)}
                  </Typography>
                </Grid>

                <Grid xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Admin Retention Margin
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#FDE047', mt: 0.25 }}>
                    {formatINR(Math.max(0, (parseFloat(benchmarkAmount || 0) - totalSimulatedPayout)))} ({ (100 - totalPoolPercentage).toFixed(1) }%)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ================= TAB 1: TRAVERSAL SIMULATOR ================= */}
      {activeTab === 1 && (
        <Grid container spacing={3.5}>
          {/* Simulator Controls Form */}
          <Grid xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayArrowIcon color="secondary" /> Engine Test & Simulator Console
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Simulate registering a new member under any sponsor to test 20-level hierarchy traversal, percentage calculations, idempotency duplicate blocking, and fault rollback.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="New Member Name"
                  value={simMemberName}
                  onChange={(e) => setSimMemberName(e.target.value)}
                  fullWidth
                  size="small"
                />

                <TextField
                  select
                  label="Direct Sponsor / Referrer"
                  value={simSponsorId}
                  onChange={(e) => setSimSponsorId(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ select: { native: true } }}
                >
                  {sponsorOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ID: {m.id}) {m.sponsorId ? `[Sponsor: ${m.sponsorId}]` : '[Root Member]'}
                    </option>
                  ))}
                </TextField>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label="Membership Tx ID (Idempotency Hash)"
                    value={simTxId}
                    onChange={(e) => setSimTxId(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <IconButton color="secondary" onClick={handleRefreshTxId} title="Generate New Tx ID">
                    <ReplayIcon />
                  </IconButton>
                </Box>

                <TextField
                  label="Membership Amount (₹)"
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  fullWidth
                  size="small"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={simPaymentConfirmed}
                      onChange={(e) => setSimPaymentConfirmed(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Payment Status Confirmed ({simPaymentConfirmed ? 'Confirmed' : 'Unconfirmed'})
                    </Typography>
                  }
                />

                <Divider sx={{ my: 1 }} />

                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleRunSimulation(false)}
                  sx={{ py: 1.2, fontWeight: 700 }}
                >
                  Run 20-Level Engine Traversal
                </Button>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<ShieldIcon />}
                    onClick={() => handleRunSimulation(false)}
                    fullWidth
                    sx={{ fontWeight: 700 }}
                  >
                    Test Duplicate (Idempotency)
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<BugReportIcon />}
                    onClick={() => handleRunSimulation(true)}
                    fullWidth
                    sx={{ fontWeight: 700 }}
                  >
                    Test Fault Rollback
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Traversal Results Display */}
          <Grid xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, minHeight: 450 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon color="primary" /> Traversal & Payout Execution Results
              </Typography>

              {!simulationResult ? (
                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                  <PlayArrowIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    No simulation executed yet.
                  </Typography>
                  <Typography variant="caption">
                    Fill out the test form on the left and click "Run 20-Level Engine Traversal".
                  </Typography>
                </Box>
              ) : !simulationResult.success ? (
                /* Failure / Rollback View */
                <Box>
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {simulationResult.rolledBack ? 'Transactional Rollback Triggered!' : 'Validation Failure'}
                    </Typography>
                    <Typography variant="body2">
                      {simulationResult.error}
                    </Typography>
                  </Alert>

                  {simulationResult.auditLog && (
                    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#FEF2F2', borderColor: '#FECACA', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#991B1B', fontWeight: 800, mb: 1 }}>
                        Audit Log Details:
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#7F1D1D', display: 'block' }}>
                        Status: {simulationResult.auditLog.status}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#7F1D1D', display: 'block' }}>
                        Validations Passed: {simulationResult.auditLog.validationsPassed?.join(', ')}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#7F1D1D', display: 'block', mt: 1 }}>
                        Failure Reason: {simulationResult.auditLog.failureReason}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              ) : (
                /* Success View with Traversal Nodes */
                <Box>
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Engine Traversal Completed Successfully!
                    </Typography>
                    <Typography variant="body2">
                      Generated <strong>{simulationResult.commissionRecords.length}</strong> individual commission records across direct upline chain.
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Upward Upline Hierarchy Traversal Nodes:
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    {simulationResult.commissionRecords.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No commission records generated (Member has no upline sponsor).
                      </Typography>
                    ) : (
                      simulationResult.commissionRecords.map((rec, idx) => (
                        <Paper
                          key={idx}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#FAF9F6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1.5,
                            borderLeft: '4px solid #0284C7'
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={`Level ${rec.level}`} size="small" color="primary" sx={{ fontWeight: 800, height: 22 }} />
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {rec.beneficiaryName}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              Relationship: {rec.referrerRelationship}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                              {formatINR(rec.amount)} ({rec.commissionPercentage}%)
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              color="secondary"
                              onClick={() => setSelectedAuditRecord(rec)}
                              sx={{ p: 0, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              View Audit Trail
                            </Button>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ================= TAB 2: AUDIT LOGS LEDGER ================= */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {engineMode === 'MEMBERSHIP' ? 'Membership Commission Engine Audit Logs' : 'Repurchase Commission Engine Audit Logs'}
            </Typography>
            <Button 
              size="small" 
              variant="outlined" 
              color="primary" 
              onClick={() => engineMode === 'MEMBERSHIP' ? dispatch(clearCommissionEngineLogs()) : dispatch(clearRepurchaseEngineLogs())}
            >
              Clear {engineMode === 'MEMBERSHIP' ? 'Membership' : 'Repurchase'} Audit Logs
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: '#FAF9F6' }}>
                <TableRow>
                  <TableCell><strong>Timestamp</strong></TableCell>
                  <TableCell><strong>Transaction Ref ID</strong></TableCell>
                  <TableCell><strong>Purchaser / Member</strong></TableCell>
                  <TableCell><strong>Validations Passed</strong></TableCell>
                  <TableCell align="center"><strong>Generated Records</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                        No {engineMode.toLowerCase()} commission engine audit logs logged yet. Run a simulation to populate logs.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeLogs.map((log, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.membershipTxId || log.repurchaseTxId} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <strong>{log.newMemberName || log.purchaserName}</strong> (ID: {log.newMemberId || log.purchaserMemberId})
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {log.validationsPassed?.map((v, i) => (
                            <Chip key={i} label={v} size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <strong>{log.generatedRecordsCount}</strong> records
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={log.status.includes('COMPLETED') || log.status.includes('SUCCESS') ? 'success' : log.status.includes('FAIL') ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Commission Audit Detail Modal */}
      <CommissionAuditModal
        open={Boolean(selectedAuditRecord)}
        onClose={() => setSelectedAuditRecord(null)}
        commission={selectedAuditRecord}
      />
    </Box>
  );
};

export default CommissionEngineConsole;
