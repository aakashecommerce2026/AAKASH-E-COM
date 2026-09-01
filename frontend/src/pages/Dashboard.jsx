import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Tooltip from '@mui/material/Tooltip';

import { 
  fetchMembersRequest, 
  fetchCommissionsRequest, 
  fetchRepurchasesRequest, 
  fetchPayoutsRequest 
} from '../store/actions';
import { AdminPerformanceChart, MemberPerformanceChart } from '../components/DashboardCharts';
import { ProfileModal } from '../components/ProfileModal';
import { PromotionProgressCard } from '../components/PromotionProgressCard';
import { DashboardCard } from '../components/DashboardCard';
import { SystemAuditLogConsole } from '../components/SystemAuditLogConsole';
import { hierarchyApi } from '../services/api';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { members, loading: membersLoading } = useSelector((state) => state.membership);
  const { commissions, loading: commissionsLoading } = useSelector((state) => state.commission);
  const { repurchases = [] } = useSelector((state) => state.repurchase || {});
  const { payouts = [] } = useSelector((state) => state.payout || {});

  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMembersRequest());
    dispatch(fetchCommissionsRequest());
    dispatch(fetchRepurchasesRequest());
    dispatch(fetchPayoutsRequest());
  }, [dispatch]);

  const isAdmin = user?.role === 'Admin';
  const referralCode = user?.referralCode || 'AK100';

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Admin Metrics
  const adminTotalMembers = members.length;
  const adminMembershipSales = members.length * 10000;
  const adminRepurchaseSales = (repurchases || []).reduce((sum, item) => sum + (item.totalAmount || item.unitPrice || 0), 0);
  const adminTotalSalesRevenue = adminMembershipSales + adminRepurchaseSales;

  const adminTotalCommissions = (commissions || []).reduce((sum, item) => sum + (item.amount || item.calculatedAmount || 0), 0);
  
  const adminPaidPayouts = (payouts || [])
    .filter((p) => p.status === 'Processed' || p.status === 'Paid')
    .reduce((sum, item) => sum + (item.netPayable || item.netAmount || item.grossAmount || 0), 0);

  const adminPendingPayouts = (payouts || [])
    .filter((p) => p.status === 'Pending')
    .reduce((sum, item) => sum + (item.netPayable || item.netAmount || item.grossAmount || 0), 0);

  const adminTdsDeductions = (payouts || [])
    .reduce((sum, item) => sum + ((item.tdsDeduction || 0) + (item.adminFee || 0)), 0);

  // Member Relevant Commissions
  const relevantCommissions = useMemo(() => {
    if (isAdmin) return commissions || [];
    const userIdStr = String(user?.id);
    const userCode = (user?.referralCode || user?.memberCode || '').toLowerCase();
    const userName = user?.name?.toLowerCase();

    return (commissions || []).filter(
      (c) =>
        String(c.beneficiaryMemberId || c.beneficiaryId || c.memberId) === userIdStr ||
        (c.memberCode && userCode && c.memberCode.toLowerCase() === userCode) ||
        (c.memberName && userName && c.memberName.toLowerCase() === userName) ||
        (c.beneficiaryName && userName && c.beneficiaryName.toLowerCase() === userName)
    );
  }, [commissions, isAdmin, user]);

  const [memberSummary, setMemberSummary] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!isAdmin && user?.id && token) {
      hierarchyApi
        .getMemberSummary()
        .then((res) => {
          if (res && res.totalDownline !== undefined) {
            setMemberSummary(res);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, user?.id]);

  // Downline members calculation
  const downlineMembers = useMemo(() => {
    if (isAdmin) return members || [];
    const loggedInId = user?.id || 1;
    const downlineSet = new Set([loggedInId]);
    let added = true;
    while (added) {
      added = false;
      (members || []).forEach((m) => {
        if (m.sponsorId && downlineSet.has(m.sponsorId) && !downlineSet.has(m.id)) {
          downlineSet.add(m.id);
          added = true;
        }
      });
    }
    downlineSet.delete(loggedInId);
    return (members || []).filter((m) => downlineSet.has(m.id));
  }, [members, isAdmin, user]);

  // Member KPI Metrics
  const totalCommission = useMemo(() => {
    return relevantCommissions.reduce((acc, curr) => acc + (curr.amount || curr.calculatedAmount || 0), 0);
  }, [relevantCommissions]);

  const totalDownlineCount = memberSummary?.totalDownline !== undefined ? memberSummary.totalDownline : downlineMembers.length;

  const monthlyEarnings = useMemo(() => {
    return relevantCommissions
      .filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, curr) => acc + (curr.amount || curr.calculatedAmount || 0), 0);
  }, [relevantCommissions, currentYear, currentMonth]);

  const weeklyEarnings = useMemo(() => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return relevantCommissions
      .filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d >= sevenDaysAgo;
      })
      .reduce((acc, curr) => acc + (curr.amount || curr.calculatedAmount || 0), 0);
  }, [relevantCommissions, now]);

  const paidCommissionTotal = useMemo(() => {
    return relevantCommissions
      .filter((c) => c.status === 'Paid' || c.status === 'Distributed' || c.status === 'Processed')
      .reduce((acc, curr) => acc + (curr.amount || curr.calculatedAmount || 0), 0);
  }, [relevantCommissions]);

  const unpaidCommissionTotal = useMemo(() => {
    return relevantCommissions
      .filter((c) => c.status === 'Pending' || c.status === 'Unpaid')
      .reduce((acc, curr) => acc + (curr.amount || curr.calculatedAmount || 0), 0);
  }, [relevantCommissions]);

  // Copy Referral Code Handler
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setSnackbarOpen(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color Theme Configurations
  const themes = {
    cyan: {
      mainColor: '#06B6D4',
      iconGradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
    },
    emerald: {
      mainColor: '#10B981',
      iconGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    violet: {
      mainColor: '#8B5CF6',
      iconGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    blue: {
      mainColor: '#3B82F6',
      iconGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
    },
    purple: {
      mainColor: '#A855F7',
      iconGradient: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)'
    },
    green: {
      mainColor: '#22C55E',
      iconGradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
    },
    amber: {
      mainColor: '#F59E0B',
      iconGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    orange: {
      mainColor: '#F97316',
      iconGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
    }
  };

  return (
    <Box>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.main' }}>
            {isAdmin ? 'System Administrator Command Portal' : `Welcome back, ${user?.name || 'Partner'}!`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin 
              ? 'Complete overview of network membership counts, sales turnover, payouts, and statutory tax deductions.'
              : 'Here is your live Unilevel MLM network & earnings dashboard performance.'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<EditIcon />}
          onClick={() => setProfileOpen(true)}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          Edit Profile & UPI
        </Button>
      </Box>

      {/* ================= STRICT FIXED-WIDTH (275px) & FIXED-HEIGHT (200px) CARD GRID ================= */}
      {isAdmin ? (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, 275px)' }, 
            gap: 3, 
            mb: 4 
          }}
        >
          {/* Card 1: Total Network Members Count */}
          <DashboardCard
            title="Total Network Members"
            value={`${adminTotalMembers} Members`}
            subtitle="Active network tree"
            chipLabel="+14.2% Growth"
            icon={<PeopleIcon />}
            onClick={() => navigate('/members?tab=tree', { state: { tab: 1 } })}
            actionText="View Tree"
            loading={membersLoading}
            themeConfig={themes.cyan}
          />

          {/* Card 2: Membership Package Sales */}
          <DashboardCard
            title="Membership Package Sales"
            value={formatINR(adminMembershipSales)}
            subtitle="Direct Joining Revenue"
            chipLabel="₹10k Package"
            icon={<ReceiptIcon />}
            onClick={() => navigate('/members?tab=list', { state: { tab: 0 } })}
            actionText="View Directory"
            loading={membersLoading}
            themeConfig={themes.emerald}
          />

          {/* Card 3: Repurchase Sales Volume */}
          <DashboardCard
            title="Repurchase Sales Volume"
            value={formatINR(adminRepurchaseSales)}
            subtitle="Household repurchases"
            chipLabel="Grocery & Mart"
            icon={<ShoppingCartIcon />}
            onClick={() => navigate('/repurchase')}
            actionText="View Purchases"
            themeConfig={themes.violet}
          />

          {/* Card 4: Total Sales Turnover */}
          <DashboardCard
            title="Total Sales Turnover"
            value={formatINR(adminTotalSalesRevenue)}
            subtitle="Package + Repurchase"
            chipLabel="Gross System"
            icon={<MonetizationOnIcon />}
            actionText="Live Revenue"
            themeConfig={themes.blue}
          />

          {/* Card 5: Total Commissions Generated */}
          <DashboardCard
            title="Commissions Generated"
            value={formatINR(adminTotalCommissions)}
            subtitle="Level & Repurchase"
            chipLabel="20-Level Tree"
            icon={<AccountBalanceIcon />}
            onClick={() => navigate('/commissions')}
            actionText="View Ledger"
            loading={commissionsLoading}
            themeConfig={themes.purple}
          />

          {/* Card 6: Paid Bank Payouts Released */}
          <DashboardCard
            title="Paid Bank Payouts"
            value={formatINR(adminPaidPayouts)}
            subtitle="Transferred to bank"
            chipLabel="100% Settled"
            icon={<CheckCircleIcon />}
            onClick={() => navigate('/payouts')}
            actionText="View Payouts"
            themeConfig={themes.green}
          />

          {/* Card 7: Pending Payout Review */}
          <DashboardCard
            title="Pending Payout Review"
            value={formatINR(adminPendingPayouts)}
            subtitle="Awaiting admin release"
            chipLabel="Action Needed"
            icon={<PendingActionsIcon />}
            onClick={() => navigate('/payouts')}
            actionText="Review Payouts"
            themeConfig={themes.amber}
          />

          {/* Card 8: Statutory TDS & Admin Fees Collected */}
          <DashboardCard
            title="TDS & Admin Fees"
            value={formatINR(adminTdsDeductions)}
            subtitle="Statutory deductions"
            chipLabel="5% TDS + 5% Admin"
            icon={<AccountBalanceIcon />}
            actionText="Compliant"
            themeConfig={themes.orange}
          />
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, 275px)' }, 
            gap: 3, 
            mb: 4 
          }}
        >
          {/* Card 1: Total Commission */}
          <DashboardCard
            title="Total Commissions"
            value={formatINR(totalCommission)}
            subtitle="All-time MLM earnings"
            chipLabel="Gross Earnings"
            icon={<MonetizationOnIcon />}
            onClick={() => navigate('/commissions')}
            actionText="My Earnings"
            loading={commissionsLoading}
            themeConfig={themes.emerald}
          />

          {/* Card 2: Members in Downline */}
          <DashboardCard
            title="Members in Downline"
            value={`${totalDownlineCount} Members`}
            subtitle="Active team network"
            chipLabel="Downline Tree"
            icon={<PeopleIcon />}
            onClick={() => navigate('/members?tab=tree', { state: { tab: 1 } })}
            actionText="My Downline"
            loading={membersLoading}
            themeConfig={themes.cyan}
          />

          {/* Card 3: Monthly Earnings */}
          <DashboardCard
            title="Monthly Earnings"
            value={formatINR(monthlyEarnings)}
            subtitle="This month earnings"
            chipLabel="Current Month"
            icon={<TrendingUpIcon />}
            actionText="Active Run"
            loading={commissionsLoading}
            themeConfig={themes.violet}
          />

          {/* Card 4: Weekly Earnings */}
          <DashboardCard
            title="Weekly Earnings"
            value={formatINR(weeklyEarnings)}
            subtitle="Past 7 days earnings"
            chipLabel="Past 7 Days"
            icon={<DateRangeIcon />}
            actionText="7-Day Run"
            loading={commissionsLoading}
            themeConfig={themes.blue}
          />

          {/* Card 5: Paid Payouts */}
          <DashboardCard
            title="Paid Payouts"
            value={formatINR(paidCommissionTotal)}
            subtitle="Settled to UPI/Bank"
            chipLabel="In Bank"
            icon={<CheckCircleIcon />}
            onClick={() => navigate('/payouts')}
            actionText="My Payouts"
            loading={commissionsLoading}
            themeConfig={themes.green}
          />

          {/* Card 6: Unpaid / Pending Wallet */}
          <DashboardCard
            title="Unpaid / Pending Wallet"
            value={formatINR(unpaidCommissionTotal)}
            subtitle="Next payout release"
            chipLabel="Pending Cycle"
            icon={<PendingActionsIcon />}
            onClick={() => navigate('/payouts')}
            actionText="Wallet Details"
            loading={commissionsLoading}
            themeConfig={themes.amber}
          />
        </Box>
      )}

      {/* Sponsor Referral Code Copy Bar */}
      {!isAdmin && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2.5, 
            mb: 4, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            bgcolor: '#FAF9F6', 
            borderRadius: 3,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Your Personal Sponsor Referral Code
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.5px' }}>
              {referralCode}
            </Typography>
          </Box>
          <Tooltip title={copied ? "Copied!" : "Copy Code"}>
            <Button 
              size="medium" 
              variant="contained" 
              color={copied ? "success" : "secondary"} 
              onClick={handleCopyCode}
              startIcon={<ContentCopyIcon fontSize="small" />}
              sx={{ px: 3, py: 1, fontWeight: 700 }}
            >
              Copy Referral Code
            </Button>
          </Tooltip>
        </Paper>
      )}

      {/* Member Promotion Rank & Milestone Progress */}
      {!isAdmin && (
        <Box sx={{ mb: 4 }}>
          <PromotionProgressCard />
        </Box>
      )}

      {/* Performance Trend Chart */}
      <Box sx={{ mb: 4 }}>
        {isAdmin ? <AdminPerformanceChart /> : <MemberPerformanceChart />}
      </Box>

      {/* Real-Time System Audit Log Console (Admin Only) */}
      {isAdmin && <SystemAuditLogConsole />}

      {/* Secondary Dynamic Summary Tables */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
        {isAdmin ? 'Recent Registrations' : 'My Recent Earnings'}
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ mb: 4, border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', overflowX: 'auto', width: '100%' }}>
        {isAdmin ? (
          membersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress color="secondary" /></Box>
          ) : (
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#FAF9F6' }}>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Joined Date</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.slice(0, 5).map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.id}</TableCell>
                    <TableCell><strong>{member.name}</strong></TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.joinedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          commissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress color="secondary" /></Box>
          ) : (
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#FAF9F6' }}>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relevantCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        No commission payouts found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  relevantCommissions.slice(0, 5).map((comm) => {
                    const gross = comm.amount || comm.calculatedAmount || 0;
                    const commTypeStr = comm.levelTier || comm.commissionType || comm.type || 'Commission';
                    return (
                      <TableRow key={comm.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {comm.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                            {formatINR(gross)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={commTypeStr} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={comm.status || 'Paid'} color={comm.status === 'Paid' || comm.status === 'Distributed' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{comm.date}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )
        )}
      </TableContainer>

      {/* Snackbar notification for copying code */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Referral Sponsor Code Copied!
        </Alert>
      </Snackbar>

      {/* Profile Modal */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </Box>
  );
};

export default Dashboard;
