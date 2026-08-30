import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';

// Category color mappings & icons
const categoryConfig = {
  REGISTRATION: { label: 'Member Signup', color: '#10B981', bg: '#ECFDF5', icon: <PersonAddIcon sx={{ fontSize: 16 }} /> },
  COMMISSION: { label: 'Commission Upline', color: '#3B82F6', bg: '#EFF6FF', icon: <MonetizationOnIcon sx={{ fontSize: 16 }} /> },
  PAYOUT: { label: 'Bank Payout', color: '#8B5CF6', bg: '#F5F3FF', icon: <AccountBalanceIcon sx={{ fontSize: 16 }} /> },
  REPURCHASE: { label: 'Mart Purchase', color: '#EC4899', bg: '#FDF2F8', icon: <ShoppingCartIcon sx={{ fontSize: 16 }} /> },
  PROFILE: { label: 'Profile & UPI Edit', color: '#06B6D4', bg: '#ECFEFF', icon: <EditIcon sx={{ fontSize: 16 }} /> },
  SECURITY: { label: 'Security & System', color: '#F59E0B', bg: '#FEFCE8', icon: <SecurityIcon sx={{ fontSize: 16 }} /> }
};

// Initial Mock System Activity Logs
const initialLogs = [
  {
    id: 'LOG-1008',
    timestamp: 'Just Now (15:58:12)',
    category: 'REGISTRATION',
    actor: 'System Admin',
    target: 'Vikram Singh (VS804)',
    action: 'Registered new member under sponsor "Aakash Sharma (AK100)". Activated ₹10,000 package.',
    status: 'Success',
    ip: '192.168.1.102'
  },
  {
    id: 'LOG-1007',
    timestamp: '8 mins ago (15:50:00)',
    category: 'COMMISSION',
    actor: 'Commission Engine',
    target: 'Aakash Sharma (AK100)',
    action: 'Calculated and credited 25% Level-1 Direct Sponsor Bonus (₹2,500) for referral VS804.',
    status: 'Processed',
    ip: '10.0.4.12'
  },
  {
    id: 'LOG-1006',
    timestamp: '22 mins ago (15:36:18)',
    category: 'REPURCHASE',
    actor: 'Priya Nair (PN204)',
    target: 'Grocery & Mart Store',
    action: 'Placed household repurchase order #ORD-9842 worth ₹3,450. Generated ₹345 BV points.',
    status: 'Completed',
    ip: '49.207.12.88'
  },
  {
    id: 'LOG-1005',
    timestamp: '45 mins ago (15:13:02)',
    category: 'PAYOUT',
    actor: 'System Admin',
    target: '42 Member Accounts',
    action: 'Approved & released weekly bank payout batch #PAY-8820 totaling ₹1,28,000 net payable.',
    status: 'Disbursed',
    ip: '192.168.1.102'
  },
  {
    id: 'LOG-1004',
    timestamp: '1 hour ago (14:58:40)',
    category: 'SECURITY',
    actor: 'System Admin',
    target: 'Statutory Tax Compliance',
    action: 'Deducted 5% TDS (₹6,400) & 5% Admin Retention Fee (₹6,400) for payout cycle settlement.',
    status: 'Audited',
    ip: '10.0.0.1'
  },
  {
    id: 'LOG-1003',
    timestamp: '2 hours ago (13:45:10)',
    category: 'PROFILE',
    actor: 'Rohan Verma (RV502)',
    target: 'Personal Account',
    action: 'Updated UPI Virtual Payment Address to "rohan@okaxis" and linked verified PAN card.',
    status: 'Verified',
    ip: '157.34.89.21'
  },
  {
    id: 'LOG-1002',
    timestamp: '3 hours ago (12:30:00)',
    category: 'REGISTRATION',
    actor: 'Aakash Sharma (AK100)',
    target: 'Sneha Patel (SP301)',
    action: 'Referred member Sneha Patel via personal sponsor link. Auto-assigned referral code SP301.',
    status: 'Success',
    ip: '106.213.4.15'
  },
  {
    id: 'LOG-1001',
    timestamp: '4 hours ago (11:15:22)',
    category: 'SECURITY',
    actor: 'System Admin',
    target: 'Admin Command Portal',
    action: 'Administrator session initiated. Verified 2FA security credentials.',
    status: 'Authorized',
    ip: '192.168.1.102'
  }
];

export const SystemAuditLogConsole = () => {
  const [logs, setLogs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  // Filter logs based on category and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.id.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [logs, categoryFilter, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      // Prepend a simulated new live log entry
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = {
        id: `LOG-${1009 + logs.length}`,
        timestamp: `Just Now (${nowStr})`,
        category: 'SECURITY',
        actor: 'System Audit',
        target: 'Live Monitor',
        action: 'System health check completed. All unilevel tree nodes and payout ledgers synchronized.',
        status: 'Success',
        ip: '127.0.0.1'
      };
      setLogs((prev) => [newLog, ...prev]);
      setRefreshing(false);
    }, 600);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mt: 4,
        mb: 4,
        bgcolor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 2, display: 'flex' }}>
            <HistoryIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
                Real-Time System Audit & Activity Log Console
              </Typography>
              <Chip
                label="● Live Stream"
                size="small"
                sx={{
                  bgcolor: '#ECFDF5',
                  color: '#059669',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  border: '1px solid #A7F3D0'
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Monitor live moment-by-moment actions, member signups, commission payouts, and security events.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Trigger Manual Activity Refresh">
            <IconButton
              onClick={handleRefresh}
              color="secondary"
              disabled={refreshing}
              sx={{
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                '&:hover': { bgcolor: '#F1F5F9' }
              }}
            >
              <RefreshIcon sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Category Filter Chips & Search Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All Events"
            clickable
            onClick={() => { setCategoryFilter('ALL'); setPage(0); }}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              bgcolor: categoryFilter === 'ALL' ? 'primary.main' : '#F1F5F9',
              color: categoryFilter === 'ALL' ? '#FFFFFF' : '#475569'
            }}
          />
          {Object.keys(categoryConfig).map((catKey) => {
            const cfg = categoryConfig[catKey];
            const isSelected = categoryFilter === catKey;
            return (
              <Chip
                key={catKey}
                icon={cfg.icon}
                label={cfg.label}
                clickable
                onClick={() => { setCategoryFilter(catKey); setPage(0); }}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  bgcolor: isSelected ? cfg.color : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                  '& .MuiChip-icon': { color: isSelected ? '#FFFFFF' : cfg.color }
                }}
              />
            );
          })}
        </Box>

        <TextField
          size="small"
          placeholder="Search by member, ID, action..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: { xs: '100%', sm: 260 }, bgcolor: '#F8FAFC' }}
        />
      </Box>

      {/* Log Data Table */}
      <TableContainer component={Box} sx={{ border: '1px solid #F1F5F9', borderRadius: 3, overflow: 'hidden', overflowX: 'auto', width: '100%' }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead sx={{ bgcolor: '#FAF9F6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#475569', py: 1.5 }}>Log ID & Time</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Performer (Actor)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Activity & Details</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary" variant="body2">
                    No activity logs match your filter query.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => {
                  const cfg = categoryConfig[log.category] || categoryConfig.SECURITY;
                  return (
                    <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: 'primary.dark' }}>
                          {log.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          {log.timestamp}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={cfg.icon}
                          label={cfg.label}
                          size="small"
                          sx={{
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            height: 24,
                            border: `1px solid ${cfg.color}30`
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {log.actor}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.65rem' }}>
                          IP: {log.ip}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: '0.82rem' }}>
                          {log.action}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={log.status === 'Success' || log.status === 'Completed' || log.status === 'Verified' ? 'success' : 'secondary'}
                          sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Bar */}
      <TablePagination
        component="div"
        count={filteredLogs.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: '1px solid #F1F5F9', mt: 1 }}
      />
    </Paper>
  );
};
