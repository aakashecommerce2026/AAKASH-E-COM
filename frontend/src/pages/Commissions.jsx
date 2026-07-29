import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LayersIcon from '@mui/icons-material/Layers';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StarsIcon from '@mui/icons-material/Stars';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import { fetchCommissionsRequest, setCommissionFilters, resetCommissionFilters, toggleCommissionDeductions } from '../store/actions';
import QueryFilterExportBar from '../components/QueryFilterExportBar';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import CommissionAuditModal from '../components/CommissionAuditModal';
import VisibilityIcon from '@mui/icons-material/Visibility';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const Commissions = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { commissions, loading, error, filters, enableDeductions = true } = useSelector((state) => state.commission);

  const [activeTab, setActiveTab] = useState(0); // 0 = Level Earnings, 1 = Repurchase Earnings
  const [selectedAuditCommission, setSelectedAuditCommission] = useState(null);


  const { searchQuery, statusFilter, startDate, endDate } = filters || {};

  useEffect(() => {
    dispatch(fetchCommissionsRequest());
  }, [dispatch]);

  const isAdmin = user?.role === 'Admin';

  // Base list filtered by role: Admin sees all, Member sees only their own
  const userCommissions = useMemo(() => {
    if (isAdmin) return commissions || [];
    const userName = user?.name?.toLowerCase();
    if (!userName) return [];
    return (commissions || []).filter(
      (comm) =>
        (comm.memberName && comm.memberName.toLowerCase() === userName) ||
        (comm.beneficiaryName && comm.beneficiaryName.toLowerCase() === userName)
    );
  }, [commissions, isAdmin, user]);

  // Tab 0: Base Level Earnings List
  const baseLevelEarnings = useMemo(() => {
    return userCommissions.filter(
      (c) =>
        c.category === 'Level' ||
        c.commissionType === 'Membership' ||
        (c.type && (c.type.includes('Referral') || c.type.includes('Indirect')))
    );
  }, [userCommissions]);

  // Tab 1: Base Repurchase Earnings List
  const baseRepurchaseEarnings = useMemo(() => {
    return userCommissions.filter(
      (c) =>
        c.category === 'Repurchase' ||
        c.commissionType === 'Repurchase' ||
        (c.type && (c.type.includes('Repurchase') || c.type.includes('BV')))
    );
  }, [userCommissions]);

  // Filter apply function
  const applyFilters = useCallback((dataList) => {
    return dataList.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchName = item.memberName?.toLowerCase().includes(q);
        const matchSource = item.sourceMember?.toLowerCase().includes(q);
        const matchProduct = item.productName?.toLowerCase().includes(q);
        const matchTier = item.levelTier?.toLowerCase().includes(q);
        const matchOrderRef = item.orderRef?.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchSource && !matchProduct && !matchTier && !matchOrderRef) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter && statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 3. Date Range Filters
      if (startDate && new Date(item.date) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(item.date) > new Date(endDate)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter, startDate, endDate]);

  const levelEarnings = useMemo(() => applyFilters(baseLevelEarnings), [baseLevelEarnings, applyFilters]);
  const repurchaseEarnings = useMemo(() => applyFilters(baseRepurchaseEarnings), [baseRepurchaseEarnings, applyFilters]);

  // KPI Calculations
  const totalLevelAmount = useMemo(() => levelEarnings.reduce((acc, curr) => acc + curr.amount, 0), [levelEarnings]);
  const totalRepurchaseAmount = useMemo(() => repurchaseEarnings.reduce((acc, curr) => acc + curr.amount, 0), [repurchaseEarnings]);
  const paidTotal = useMemo(() => userCommissions.filter(c => c.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0), [userCommissions]);
  const pendingTotal = useMemo(() => userCommissions.filter(c => c.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0), [userCommissions]);

  // Explicit Redux event dispatchers for filters
  const handleSearchChange = (val) => {
    dispatch(setCommissionFilters({ searchQuery: val }));
  };

  const handleStatusFilterChange = (val) => {
    dispatch(setCommissionFilters({ statusFilter: val }));
  };

  const handleStartDateChange = (val) => {
    dispatch(setCommissionFilters({ startDate: val }));
  };

  const handleEndDateChange = (val) => {
    dispatch(setCommissionFilters({ endDate: val }));
  };

  // Quick Preset Change Handler
  const handlePresetChange = (preset) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (preset === 'ALL') {
      dispatch(setCommissionFilters({ startDate: '', endDate: '' }));
    } else if (preset === 'TODAY') {
      dispatch(setCommissionFilters({ startDate: todayStr, endDate: todayStr }));
    } else if (preset === 'THIS_MONTH') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      dispatch(setCommissionFilters({ startDate: firstDay, endDate: todayStr }));
    } else if (preset === 'LAST_30') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10);
      dispatch(setCommissionFilters({ startDate: thirtyDaysAgo, endDate: new Date().toISOString().slice(0, 10) }));
    }
  };

  const handleResetFilters = () => {
    dispatch(resetCommissionFilters());
  };

  // Export handlers
  const handleExportExcel = () => {
    if (activeTab === 0) {
      const cols = [
        { label: 'Transaction ID', key: 'id' },
        { label: 'Beneficiary Member', key: 'memberName' },
        { label: 'Source Referral', key: 'sourceMember' },
        { label: 'Level Tier', key: 'levelTier' },
        { label: 'Gross Earned', key: 'amount', format: (val) => formatINR(val) },
        { label: 'TDS Deduction (5% Sec 194H)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Admin Service Charge (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Net Payable Commission', key: 'amount', format: (val) => formatINR((val || 0) * 0.90) },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'date' },
      ];
      exportToExcel('Level_Earnings_Ledger', cols, levelEarnings);
    } else {
      const cols = [
        { label: 'Log ID', key: 'id' },
        { label: 'Order Ref', key: 'orderRef' },
        { label: 'Beneficiary Member', key: 'memberName' },
        { label: 'Purchaser Source', key: 'sourceMember' },
        { label: 'Product Name', key: 'productName' },
        { label: 'BV Points', key: 'bvPoints' },
        { label: 'Gross Commission', key: 'amount', format: (val) => formatINR(val) },
        { label: 'TDS Deduction (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Admin Charge (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Net Payable', key: 'amount', format: (val) => formatINR((val || 0) * 0.90) },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'date' },
      ];
      exportToExcel('Repurchase_Earnings_Ledger', cols, repurchaseEarnings);
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 0) {
      const cols = [
        { label: 'Transaction ID', key: 'id' },
        { label: 'Beneficiary', key: 'memberName' },
        { label: 'Source Referral', key: 'sourceMember' },
        { label: 'Level Tier', key: 'levelTier' },
        { label: 'Gross Amount', key: 'amount', format: (val) => formatINR(val) },
        { label: 'TDS (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Admin (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Net Amount', key: 'amount', format: (val) => formatINR((val || 0) * 0.90) },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'date' },
      ];
      const metrics = [
        { title: 'Total Gross Level Earnings', value: formatINR(totalLevelAmount) },
        { title: 'Locked TDS Deducted (5%)', value: formatINR(totalLevelAmount * 0.05) },
        { title: 'Net Payable Level Commissions', value: formatINR(totalLevelAmount * 0.90) },
      ];
      exportToPDF('Level Earnings Financial Ledger', cols, levelEarnings, metrics);
    } else {
      const cols = [
        { label: 'Log ID', key: 'id' },
        { label: 'Order Ref', key: 'orderRef' },
        { label: 'Beneficiary', key: 'memberName' },
        { label: 'Purchaser', key: 'sourceMember' },
        { label: 'Product Item', key: 'productName' },
        { label: 'Gross Commission', key: 'amount', format: (val) => formatINR(val) },
        { label: 'TDS (5%)', key: 'amount', format: (val) => formatINR((val || 0) * 0.05) },
        { label: 'Net Amount', key: 'amount', format: (val) => formatINR((val || 0) * 0.90) },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'date' },
      ];
      const metrics = [
        { title: 'Total Gross Repurchase BV', value: formatINR(totalRepurchaseAmount) },
        { title: 'Net Payable Repurchase Earnings', value: formatINR(totalRepurchaseAmount * 0.90) },
      ];
      exportToPDF('Repurchase BV Financial Ledger', cols, repurchaseEarnings, metrics);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
          {isAdmin ? 'Financial Payout & Commission Ledger' : 'My Earnings Console'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isAdmin
            ? 'Track network-wide Direct Referral commission bonuses and Repurchase commission payouts in structured financial ledgers.'
            : 'Detailed ledger of your Direct Referral commission earnings and Repurchase commission payouts.'}
        </Typography>
      </Box>

      {/* Dynamic Statutory Taxation & TDS Details Banner */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3.5, borderRadius: 2.5, bgcolor: enableDeductions ? '#FEFCE8' : '#F0FDF4', borderColor: enableDeductions ? '#FEF08A' : '#BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ color: enableDeductions ? '#B45309' : '#15803D', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: enableDeductions ? '#854D0E' : '#166534' }}>
              Statutory Taxation & TDS Calculations ({enableDeductions ? 'Admin Deductions Active' : 'Admin Deductions Disabled'})
            </Typography>
            <Typography variant="caption" sx={{ color: enableDeductions ? '#78350F' : '#14532D', display: 'block' }}>
              {enableDeductions
                ? '5.00% TDS (Sec 194H) and 5.00% Admin Fee (total 10%) are automatically reduced from gross commission calculations.'
                : 'Admin Tax Deductions are currently Disabled — 0% TDS or Admin Fee deducted from Gross Commissions.'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={enableDeductions}
                  onChange={(e) => dispatch(toggleCommissionDeductions(e.target.checked))}
                  color="warning"
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 800, color: enableDeductions ? '#B45309' : '#15803D' }}>
                  {enableDeductions ? 'Deductions ON' : 'Deductions OFF'}
                </Typography>
              }
            />
          )}
          <Chip icon={<LockIcon sx={{ fontSize: '13px !important' }} />} label={enableDeductions ? '5% TDS + 5% Admin Active' : '0% Deductions'} color={enableDeductions ? 'warning' : 'success'} size="small" sx={{ fontWeight: 800 }} />
        </Box>
      </Paper>

      {/* Error Alert with Retry Dispatch */}
      {error && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => dispatch(fetchCommissionsRequest())}>
              Retry Fetch
            </Button>
          }
          sx={{ mb: 3.5, borderRadius: 2.5 }}
        >
          {error}
        </Alert>
      )}

      {/* Financial KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderColor: '#BBF7D0', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                <LayersIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                  Direct Referral Earnings
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.25 }}>
                  {formatINR(totalLevelAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FEFCE8', borderColor: '#FEF08A', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
                <StarsIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                  Repurchase Earnings
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.dark', mt: 0.25 }}>
                  {formatINR(totalRepurchaseAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#059669', width: 44, height: 44 }}>
                <MonetizationOnIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Paid Out Payouts
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', mt: 0.25 }}>
                  {formatINR(paidTotal)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#D97706', width: 44, height: 44 }}>
                <AccountBalanceWalletIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Pending Review Wallet
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706', mt: 0.25 }}>
                  {formatINR(pendingTotal)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Query Filter & Export Bar bound to Redux state */}
      <QueryFilterExportBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        startDate={startDate}
        onStartDateChange={handleStartDateChange}
        endDate={endDate}
        onEndDateChange={handleEndDateChange}
        typeFilter={statusFilter}
        onTypeFilterChange={handleStatusFilterChange}
        typeOptions={[
          { label: 'Paid Status', value: 'Paid' },
          { label: 'Pending Review', value: 'Pending' }
        ]}
        typeLabel="Status"
        onPresetChange={handlePresetChange}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onReset={handleResetFilters}
      />

      {/* Tabs Selector for Direct Referral vs Repurchase Commission */}
      <Paper sx={{ mb: 3.5 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)} 
          indicatorColor="secondary" 
          textColor="secondary"
          sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}
        >
          <Tab 
            icon={<LayersIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label={`Direct Referral Commission (${levelEarnings.length})`} 
            sx={{ fontWeight: 700, py: 1.5 }} 
          />
          <Tab 
            icon={<ShoppingCartIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label={`Repurchase Commission (${repurchaseEarnings.length})`} 
            sx={{ fontWeight: 700, py: 1.5 }} 
          />
        </Tabs>
      </Paper>

      {/* State View Cycling: Loader -> Populated Grid -> Empty View */}
      {loading ? (
        <Paper variant="outlined" sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 3 }}>
          <CircularProgress color="secondary" size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Executing Redux-Saga fetch flow with active DB latency delay...
          </Typography>
        </Paper>
      ) : activeTab === 0 ? (
        /* ================= TAB 0: LEVEL EARNINGS GRID ================= */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: '#FAF9F6' }}>
              <TableRow>
                <TableCell><strong>Transaction ID</strong></TableCell>
                {isAdmin && <TableCell><strong>Beneficiary Member</strong></TableCell>}
                <TableCell><strong>Source Referral</strong></TableCell>
                <TableCell><strong>Level Tier</strong></TableCell>
                <TableCell align="right"><strong>Gross Earned</strong></TableCell>
                <TableCell align="right"><strong>TDS (5%)</strong></TableCell>
                <TableCell align="right"><strong>Net Commission</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="center"><strong>Audit Trail</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {levelEarnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                      No Level earnings found matching current Redux filters.
                    </Typography>
                    <Button size="small" variant="outlined" color="primary" onClick={handleResetFilters} sx={{ mt: 1.5, fontWeight: 700 }}>
                      Reset Active Filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                levelEarnings.map((comm) => {
                  const gross = comm.amount || 0;
                  const tds = enableDeductions ? (gross * 5) / 100 : 0;
                  const net = enableDeductions ? gross * 0.90 : gross;
                  return (
                    <TableRow key={comm.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}>
                          {comm.id}
                        </Typography>
                      </TableCell>
                      {isAdmin && <TableCell><strong>{comm.memberName}</strong></TableCell>}
                      <TableCell>{comm.sourceMember || comm.memberName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={comm.levelTier || comm.type} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {formatINR(gross)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" sx={{ fontWeight: 700, color: enableDeductions ? '#B45309' : 'text.secondary', display: 'block' }}>
                          {enableDeductions ? `-${formatINR(tds)}` : '₹0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                          {formatINR(net)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={comm.status} 
                          color={comm.status === 'Paid' || comm.status === 'Distributed' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{comm.date}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          onClick={() => setSelectedAuditCommission(comm)}
                          sx={{ py: 0.25, px: 1, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ================= TAB 1: REPURCHASE EARNINGS GRID ================= */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: '#FAF9F6' }}>
              <TableRow>
                <TableCell><strong>Commission ID & Ref</strong></TableCell>
                {isAdmin && <TableCell><strong>Beneficiary Upline</strong></TableCell>}
                <TableCell><strong>Downline Purchaser (Source)</strong></TableCell>
                <TableCell><strong>Upline Level Tier</strong></TableCell>
                <TableCell align="right"><strong>Purchase Amount</strong></TableCell>
                <TableCell align="right"><strong>Gross Commission</strong></TableCell>
                <TableCell align="right"><strong>Net Commission ({enableDeductions ? '10% Deduct Active' : 'No Deductions'})</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="center"><strong>Audit</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repurchaseEarnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                      No Repurchase commission earnings found matching current Redux filters.
                    </Typography>
                    <Button size="small" variant="outlined" color="primary" onClick={handleResetFilters} sx={{ mt: 1.5, fontWeight: 700 }}>
                      Reset Active Filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                repurchaseEarnings.map((comm) => {
                  const gross = comm.calculatedAmount !== undefined ? comm.calculatedAmount : (comm.amount || 0);
                  const tds = comm.tdsDeduction !== undefined ? comm.tdsDeduction : (enableDeductions ? (gross * 5) / 100 : 0);
                  const adminFee = comm.adminFee !== undefined ? comm.adminFee : (enableDeductions ? (gross * 5) / 100 : 0);
                  const net = comm.netPayableAmount !== undefined ? comm.netPayableAmount : (gross - tds - adminFee);
                  const refCode = comm.repurchaseTxId || comm.orderRef || comm.id;
                  const purchaseVal = comm.repurchaseAmount || comm.totalAmount || 0;
                  const tierText = comm.levelTier || (comm.level ? `Level ${comm.level} Repurchase (${comm.commissionPercentage || 1.5}%)` : 'Repurchase Level Commission');

                  return (
                    <TableRow key={comm.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'secondary.dark' }}>
                          {comm.id}
                        </Typography>
                        {refCode && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Ref: {refCode}
                          </Typography>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <strong>{comm.memberName || comm.beneficiaryName}</strong>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {comm.sourceMember || comm.sourceName || comm.memberName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Downline Purchaser
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tierText}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ fontWeight: 700, height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {formatINR(purchaseVal)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                          {formatINR(gross)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.dark' }}>
                          {formatINR(net)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={comm.status || 'Distributed'} 
                          color={comm.status === 'Paid' || comm.status === 'Distributed' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{comm.date}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => setSelectedAuditCommission(comm)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Commission Audit Detail Dialog */}
      <CommissionAuditModal
        open={Boolean(selectedAuditCommission)}
        onClose={() => setSelectedAuditCommission(null)}
        commission={selectedAuditCommission}
      />
    </Box>
  );
};

export default Commissions;
