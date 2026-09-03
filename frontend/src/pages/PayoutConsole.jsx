import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SavingsIcon from '@mui/icons-material/Savings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LockIcon from '@mui/icons-material/Lock';
import {
  fetchPayoutsRequest,
  processPayoutRequest,
  batchProcessPayoutsRequest,
  toggleCommissionDeductions,
  fetchTdsStatusRequest,
  saveTdsStatusRequest,
} from '../store/actions';
import QueryFilterExportBar from '../components/QueryFilterExportBar';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const PAYOUT_TYPES = [
  'Direct Referral Commission',
  'Repurchase Commission',
];

const PayoutConsole = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { payouts, loading, processing, error } = useSelector((state) => state.payout);
  const { enableDeductions = true } = useSelector((state) => state.commission);

  const isAdmin = user?.role === 'Admin';
  const isInactive = user?.status === 'INACTIVE' || user?.status === 'Inactive';

  // Tab State: 0 = All, 1 = Pending, 2 = Processed
  const [activeTab, setActiveTab] = useState(0);

  // Query Pickers State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [prevProcessing, setPrevProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchPayoutsRequest());
    dispatch(fetchTdsStatusRequest());
  }, [dispatch]);

  // Handle toast alert when background processing completes
  useEffect(() => {
    if (prevProcessing && !processing) {
      if (error) {
        setToast({
          open: true,
          message: error,
          severity: 'error',
        });
      } else {
        setToast({
          open: true,
          message: 'Payout disbursement processed successfully!',
          severity: 'success',
        });
      }
    }
    setPrevProcessing(processing);
  }, [processing, error, prevProcessing]);

  // Handle Single Payout Release
  const handleProcessSingle = (row) => {
    const targetMemberId = row.memberId || row.id;
    dispatch(processPayoutRequest(targetMemberId));
  };

  // Handle Batch Payout Release
  const handleBatchProcess = () => {
    const pendingIds = payouts
      .filter((p) => p.status === 'Pending')
      .map((p) => p.memberId || p.id);
    if (pendingIds.length === 0) return;

    dispatch(batchProcessPayoutsRequest(pendingIds));
  };

  // Preset Date Filter Handler
  const handlePresetChange = (preset) => {
    const today = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const formatted = today.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = today.toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_30') {
      const prior30 = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
      const nowFormatted = new Date().toISOString().split('T')[0];
      setStartDate(prior30);
      setEndDate(nowFormatted);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setTypeFilter('ALL');
  };

  // Role Base List
  const basePayouts = useMemo(() => {
    if (isAdmin) return payouts;
    if (isInactive) return [];
    return payouts.filter(
      (p) => p.memberName.toLowerCase() === user?.name?.toLowerCase()
    );
  }, [payouts, isAdmin, isInactive, user]);

  // Filtered Ledger Payouts
  const filteredPayouts = useMemo(() => {
    return basePayouts.filter((item) => {
      // Tab Status Filter
      if (activeTab === 1 && item.status !== 'Pending') return false;
      if (activeTab === 2 && item.status !== 'Processed') return false;

      // Type Filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;

      // Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.memberName.toLowerCase().includes(query);
        const matchesCode = item.memberCode.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesRef = item.transactionRef ? item.transactionRef.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesCode && !matchesId && !matchesRef) return false;
      }

      // Date Filters
      if (startDate && new Date(item.createdDate) < new Date(startDate)) return false;
      if (endDate && new Date(item.createdDate) > new Date(endDate)) return false;

      return true;
    });
  }, [basePayouts, activeTab, typeFilter, searchQuery, startDate, endDate]);

  // Overall & Filtered Financial Metrics
  const metrics = useMemo(() => {
    const totalGross = basePayouts.reduce((acc, curr) => acc + (curr.grossAmount || curr.amount || 0), 0);
    const totalNet = basePayouts.reduce((acc, curr) => acc + (curr.netAmount !== undefined ? curr.netAmount : (curr.netPayable || curr.grossAmount || 0)), 0);

    const pendingList = basePayouts.filter((p) => p.status === 'Pending');
    const processedList = basePayouts.filter((p) => p.status === 'Processed');

    const pendingNet = pendingList.reduce((acc, curr) => acc + (curr.netAmount !== undefined ? curr.netAmount : (curr.netPayable || curr.grossAmount || 0)), 0);
    const processedNet = processedList.reduce((acc, curr) => acc + (curr.netAmount !== undefined ? curr.netAmount : (curr.netPayable || curr.grossAmount || 0)), 0);
    const totalDeductions = basePayouts.reduce(
      (acc, curr) => acc + ((curr.tdsDeduction || 0) + (curr.adminFee || 0)),
      0
    );

    return {
      totalGross,
      totalNet,
      pendingCount: pendingList.length,
      pendingNet,
      processedCount: processedList.length,
      processedNet,
      totalDeductions,
    };
  }, [basePayouts]);

  // Export Handlers
  const handleExportPDF = () => {
    const columns = [
      { label: 'Payout ID', key: 'id' },
      { label: 'Member', key: 'memberName', format: (val, row) => `${val} (${row.memberCode})` },
      { label: 'Payout Type', key: 'type' },
      { label: 'Gross (₹)', key: 'grossAmount', format: (val) => formatINR(val) },
      { label: 'TDS (5%)', key: 'tdsDeduction', format: (val) => formatINR(val) },
      { label: 'Admin Fee (5%)', key: 'adminFee', format: (val) => formatINR(val) },
      { label: 'Net Payable (₹)', key: 'netPayable', format: (val) => formatINR(val) },
      { label: 'Status', key: 'status' },
      { label: 'Created', key: 'createdDate' },
      { label: 'Processed / Ref', key: 'transactionRef' },
    ];
    const summary = [
      { title: 'Total Processed Payouts', value: formatINR(metrics.processedNet) },
      { title: 'Total Pending Payouts', value: formatINR(metrics.pendingNet) },
      { title: 'Total Deductions (TDS/Admin)', value: formatINR(metrics.totalDeductions) },
    ];
    const tabName = activeTab === 1 ? 'Pending' : activeTab === 2 ? 'Processed' : 'All';
    exportToPDF(`Payout Ledger Statement (${tabName})`, columns, filteredPayouts, summary);
  };

  const handleExportExcel = () => {
    const columns = [
      { label: 'Payout ID', key: 'id' },
      { label: 'Member Code', key: 'memberCode' },
      { label: 'Member Name', key: 'memberName' },
      { label: 'Payout Type', key: 'type' },
      { label: 'Gross Amount', key: 'grossAmount' },
      { label: 'TDS Deduction (5%)', key: 'tdsDeduction' },
      { label: 'Admin Fee (5%)', key: 'adminFee' },
      { label: 'Net Payable Amount', key: 'netPayable' },
      { label: 'Status', key: 'status' },
      { label: 'Bank Account', key: 'bankAccount' },
      { label: 'Created Date', key: 'createdDate' },
      { label: 'Processed Date', key: 'processedDate' },
      { label: 'Transaction Reference', key: 'transactionRef' },
    ];
    exportToExcel('Payout_Ledger_Report', columns, filteredPayouts);
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Title */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            {isAdmin ? 'Payout Console & Ledger' : 'My Payout Ledger & Earnings'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin
              ? 'Manage commission distributions, track Pending vs Processed statuses, and calculate net bank releases.'
              : 'View your personal commission payout history, deductions, net payable amounts, and payment references.'}
          </Typography>
        </Box>

        {isAdmin && metrics.pendingCount > 0 && (
          <Button
            variant="contained"
            color="secondary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <DoneAllIcon />}
            onClick={handleBatchProcess}
            sx={{ fontWeight: 700, px: 3, py: 1.2 }}
          >
            Process All Pending ({metrics.pendingCount})
          </Button>
        )}
      </Box>

      {/* Inactive Member Freeze Notice */}
      {!isAdmin && isInactive && (
        <Alert severity="warning" variant="filled" sx={{ mb: 3.5, borderRadius: 3, fontWeight: 700 }}>
          🔒 Account Status: INACTIVE & UNDER FREEZE. Payout ledger and earnings are locked until your account is activated by Admin.
        </Alert>
      )}

      {/* Dynamic Statutory Taxation & TDS Details Banner */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3.5, borderRadius: 2.5, bgcolor: enableDeductions ? '#FEFCE8' : '#F0FDF4', borderColor: enableDeductions ? '#FEF08A' : '#BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ color: enableDeductions ? '#B45309' : '#15803D', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: enableDeductions ? '#854D0E' : '#166534' }}>
              Statutory Taxation & TDS Calculations ({enableDeductions ? 'Active Deductions' : 'Deductions Disabled'})
            </Typography>
            <Typography variant="caption" sx={{ color: enableDeductions ? '#78350F' : '#14532D', display: 'block' }}>
              {enableDeductions 
                ? 'Compliant with Indian Income Tax Sec 194H — Fixed 5.00% TDS Deduction + 5.00% Admin Fee applied automatically to gross earnings.' 
                : 'Admin Tax Deductions Disabled — Gross commissions are released 100% without any TDS or Admin fee reductions.'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={enableDeductions}
                  onChange={(e) => dispatch(saveTdsStatusRequest(e.target.checked))}
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
          <Chip icon={<LockIcon sx={{ fontSize: '13px !important' }} />} label={enableDeductions ? 'TDS 5% + Admin 5% Active' : '0% Deducted'} color={enableDeductions ? 'warning' : 'success'} size="small" sx={{ fontWeight: 800 }} />
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FEF2F2', borderColor: '#FCA5A5' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#EF4444', borderRadius: 2, color: 'white' }}>
                <PendingActionsIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Pending Release ({metrics.pendingCount})
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#991B1B', mt: 0.5 }}>
                  {formatINR(metrics.pendingNet)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                <CheckCircleIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Processed ({metrics.processedCount})
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                  {formatINR(metrics.processedNet)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#0EA5E9', borderRadius: 2, color: 'white' }}>
                <SavingsIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Gross Earnings
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatINR(metrics.totalGross)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#854D0E', borderRadius: 2, color: 'white' }}>
                <AccountBalanceIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  TDS & Admin Deductions
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatINR(metrics.totalDeductions)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Bar */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="All Ledger Payouts" sx={{ fontWeight: 700 }} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Pending Payouts</span>
                {metrics.pendingCount > 0 && (
                  <Chip label={metrics.pendingCount} size="small" color="error" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 800 }} />
                )}
              </Box>
            }
            sx={{ fontWeight: 700 }}
          />
          <Tab label={`Processed Payouts (${metrics.processedCount})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {/* Query Pickers & Export Bar */}
      <QueryFilterExportBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        typeLabel="Payout Bonus Type"
        typeOptions={PAYOUT_TYPES.map((t) => ({ label: t, value: t }))}
        onPresetChange={handlePresetChange}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onReset={handleResetFilters}
      />

      {/* Ledger Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#FAF9F6' }}>
              <TableRow>
                <TableCell><strong>Payout ID</strong></TableCell>
                <TableCell><strong>Member Details</strong></TableCell>
                <TableCell><strong>Commission Type</strong></TableCell>
                <TableCell align="right"><strong>Gross Amt</strong></TableCell>
                <TableCell align="right"><strong>Deductions (10%)</strong></TableCell>
                <TableCell align="right"><strong>Net Payable</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Created / Processed Date</strong></TableCell>
                <TableCell align="center"><strong>Action / Ref</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No payout records match the current filter selection.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}>
                        {row.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.memberName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Code: {row.memberCode} | {row.bankAccount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.type} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right">{formatINR(row.grossAmount)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={`TDS 5%: ${formatINR(row.tdsDeduction)} | Admin Fee 5%: ${formatINR(row.adminFee)}`}>
                        <Typography variant="body2" color="error.main" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                          -{formatINR((row.tdsDeduction || 0) + (row.adminFee || 0))}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatINR(row.netAmount !== undefined ? row.netAmount : row.netPayable)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={row.status === 'Processed' ? 'success' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.createdDate}</Typography>
                      {row.processedDate && (
                        <Typography variant="caption" color="success.main" display="block">
                          Processed: {row.processedDate}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.status === 'Pending' ? (
                        isAdmin ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={processing}
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleProcessSingle(row)}
                            sx={{ py: 0.5, fontWeight: 700 }}
                          >
                            Process
                          </Button>
                        ) : (
                          <Chip
                            label="Pending Admin Release"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        )
                      ) : (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>
                          {row.transactionRef}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Snackbar Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PayoutConsole;
