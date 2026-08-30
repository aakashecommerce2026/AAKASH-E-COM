import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Divider,
  Avatar,
  Autocomplete,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StarsIcon from '@mui/icons-material/Stars';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import NotesIcon from '@mui/icons-material/Notes';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchRepurchasesRequest, addRepurchaseRequest, fetchMembersRequest } from '../store/actions';
import QueryFilterExportBar from '../components/QueryFilterExportBar';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Cash', 'Wallet'];

const RepurchasePanel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { repurchases, loading, submitting } = useSelector((state) => state.repurchase);
  const { members } = useSelector((state) => state.membership);

  const isAdmin = user?.role === 'Admin';

  // Form State reframed to: memberId, memberCode, memberName, purchaseAmount, category (Groceries/Household), businessVolume, paymentMethod, orderRef, remarks
  const [formData, setFormData] = useState({
    memberId: '',
    memberCode: '',
    memberName: '',
    purchaseAmount: '',
    category: 'Groceries/Household',
    businessVolume: '',
    paymentMethod: 'UPI',
    purchaseDate: new Date().toISOString().split('T')[0],
    orderRef: '',
    remarks: '',
  });

  // Validation Error State
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Query Pickers State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    dispatch(fetchRepurchasesRequest());
    dispatch(fetchMembersRequest());
  }, [dispatch]);

  // Form Input Handler with Auto-Calculation of BV Points from Amount of Purchase (2.5%)
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'memberId') {
        const selectedMember = members.find((m) => String(m.id) === String(value));
        updated.memberName = selectedMember ? selectedMember.name : '';
        updated.memberCode = selectedMember ? (selectedMember.referralCode || `MEM-${selectedMember.id}`) : '';
      }

      // Auto-calculate BV Points automatically from the amount of purchase
      if (field === 'purchaseAmount') {
        const amt = Number(value) || 0;
        updated.businessVolume = amt > 0 ? (amt * 0.025).toFixed(2) : '';
      }

      return updated;
    });

    // Clear specific error on edit
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Form Validator
  const validateForm = () => {
    const newErrors = {};
    if (!formData.memberId) newErrors.memberId = 'Please select a member';
    if (!formData.purchaseAmount || isNaN(formData.purchaseAmount) || Number(formData.purchaseAmount) <= 0) {
      newErrors.purchaseAmount = 'Enter a valid purchase amount (> 0)';
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Select a purchase date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const purchaseAmt = Number(formData.purchaseAmount);
    const autoBV = formData.businessVolume !== '' ? Number(formData.businessVolume) : Number((purchaseAmt * 0.025).toFixed(2));
    const refCode = formData.orderRef.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      memberId: formData.memberId,
      memberCode: formData.memberCode || `MEM-${formData.memberId}`,
      memberName: formData.memberName || 'Unknown Member',
      productName: 'Groceries & Household Essentials',
      category: 'Groceries/Household', // Always Groceries/Household
      quantity: 1,
      unitPrice: purchaseAmt,
      totalAmount: purchaseAmt,
      businessVolume: Number(autoBV.toFixed(2)),
      paymentMethod: formData.paymentMethod,
      date: formData.purchaseDate,
      orderRef: refCode,
      remarks: formData.remarks.trim() || 'Groceries purchase record',
      status: 'Completed',
    };

    dispatch(addRepurchaseRequest(payload));
    setToast({
      open: true,
      message: `Groceries purchase order recorded for ${payload.memberName} (${payload.memberCode})!`,
      severity: 'success',
    });

    // Reset Form
    setFormData({
      memberId: '',
      memberCode: '',
      memberName: '',
      purchaseAmount: '',
      category: 'Groceries/Household',
      businessVolume: '',
      paymentMethod: 'UPI',
      purchaseDate: new Date().toISOString().split('T')[0],
      orderRef: '',
      remarks: '',
    });
    setErrors({});
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
    setCategoryFilter('ALL');
  };

  // Filtered Repurchase Logs
  const filteredLogs = useMemo(() => {
    const baseList = repurchases;

    return baseList.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.memberCode && item.memberCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.orderRef && item.orderRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || (item.category || 'Groceries/Household') === categoryFilter;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(item.date) >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && new Date(item.date) <= new Date(endDate);
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [repurchases, searchQuery, categoryFilter, startDate, endDate, isAdmin, user]);

  // Key Statistics
  const stats = useMemo(() => {
    const totalSales = filteredLogs.reduce((acc, curr) => acc + (curr.totalAmount || curr.amount || 0), 0);
    const totalBV = filteredLogs.reduce((acc, curr) => acc + (curr.businessVolume || 0), 0);
    const totalOrders = filteredLogs.length;
    const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    return { totalSales, totalBV, totalOrders, avgOrder };
  }, [filteredLogs]);

  // PDF Export Trigger
  const handleExportPDF = () => {
    const columns = [
      { label: 'Order Ref / ID', key: 'id', format: (val, row) => row.orderRef || val },
      { label: 'Member ID', key: 'memberCode', format: (val, row) => val || `MEM-${row.memberId}` },
      { label: 'Member Name', key: 'memberName' },
      { label: 'Amount of Purchase', key: 'totalAmount', format: (val, row) => formatINR(val || row.amount) },
      { label: 'Product Category', key: 'category', format: () => 'Groceries/Household' },
      { label: 'BV Points (2.5%)', key: 'businessVolume', format: (val) => `${val} BV` },
      { label: 'Payment Method', key: 'paymentMethod' },
      { label: 'Order Remark / Ref', key: 'orderRef', format: (val, row) => val || row.remarks || '-' },
      { label: 'Date', key: 'date' },
      { label: 'Status', key: 'status' },
    ];
    const summary = [
      { title: 'Total Groceries Purchase Volume', value: formatINR(stats.totalSales) },
      { title: 'Total BV Points (2.5%)', value: `${stats.totalBV.toFixed(2)} BV` },
      { title: 'Order Count', value: `${stats.totalOrders} Orders` },
    ];
    exportToPDF('Repurchase Transaction Log Report (Groceries/Household)', columns, filteredLogs, summary);
  };

  // Excel Export Trigger
  const handleExportExcel = () => {
    const columns = [
      { label: 'Order Ref ID', key: 'orderRef' },
      { label: 'Member ID', key: 'memberCode' },
      { label: 'Member Name', key: 'memberName' },
      { label: 'Amount of Purchase', key: 'totalAmount' },
      { label: 'Product Category', key: 'category' },
      { label: 'BV Points (2.5%)', key: 'businessVolume' },
      { label: 'Payment Method', key: 'paymentMethod' },
      { label: 'Order Remark / Ref', key: 'remarks' },
      { label: 'Date', key: 'date' },
      { label: 'Status', key: 'status' },
    ];
    exportToExcel('Repurchase_Groceries_Logs', columns, filteredLogs);
  };

  const currentAmt = Number(formData.purchaseAmount) || 0;
  const autoBVPoints = (currentAmt * 0.025).toFixed(2);

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
          {isAdmin ? 'Repurchase Management Panel' : 'My Purchase History'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isAdmin
            ? 'Record manual repurchase orders with real-time 2.5% BV calculation and monitor live sales across the network.'
            : 'View your personal product purchase records, invoice details, and accumulated Business Volume (2.5% BV rate).'}
        </Typography>
      </Box>

      {!isAdmin && (
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3.5, borderRadius: 2.5 }}>
          Showing personal product purchase logs for <strong>{user?.name || 'Member'}</strong>. Every product repurchase earns **2.5% Business Volume (BV)** points toward your team volume overrides.
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4, alignItems: 'stretch' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#F0FDF4', borderColor: '#BBF7D0', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, borderRadius: 2 }}>
                <LocalAtmIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  {isAdmin ? 'Total Repurchase Volume' : 'My Total Purchases'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                  {formatINR(stats.totalSales)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#FEFCE8', borderColor: '#FEF08A', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, borderRadius: 2 }}>
                <StarsIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  {isAdmin ? 'Total BV Generated' : 'My BV Points (2.5%)'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.dark', mt: 0.5 }}>
                  {stats.totalBV.toFixed(2)} BV
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Avatar sx={{ bgcolor: '#0EA5E9', width: 48, height: 48, borderRadius: 2 }}>
                <ReceiptLongIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  {isAdmin ? 'Total Orders Logged' : 'My Orders Count'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {stats.totalOrders}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Avatar sx={{ bgcolor: '#8B5CF6', width: 48, height: 48, borderRadius: 2 }}>
                <ShoppingBagIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  Average Order Size
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatINR(stats.avgOrder)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Manual Entry Form - Admin Only */}
      {isAdmin && (
        <Paper 
          component="form" 
          onSubmit={handleSubmit} 
          elevation={0} 
          sx={{ 
            mb: 4, 
            borderRadius: 3, 
            border: '1px solid #E2E8F0', 
            bgcolor: '#FFFFFF',
            overflow: 'hidden'
          }}
        >
          {/* Header Bar */}
          <Box sx={{ 
            bgcolor: '#F0FDF4', 
            borderBottom: '1px solid #BBF7D0', 
            px: 3, 
            py: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'space-between',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <ShoppingCartIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark', lineHeight: 1.2 }}>
                  Record Repurchase Order (Groceries/Household)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Log member product purchases with dynamic 2.5% BV calculation
                </Typography>
              </Box>
            </Box>

            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
              label="System Policy: 2.5% BV Auto-Calculated"
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 800, bgcolor: '#FFFFFF' }}
            />
          </Box>

          {/* Form Content */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              {/* Member Selection (Searchable Member ID & Name Dropdown) */}
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  size="small"
                  options={members || []}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    if (typeof option === 'string') return option;
                    const code = option.referralCode || `MEM-${option.id}`;
                    return `${code} — ${option.name}`;
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return false;
                    const valId = typeof value === 'object' ? value.id : value;
                    return String(option.id) === String(valId);
                  }}
                  filterOptions={(options, state) => {
                    const query = (state.inputValue || '').trim().toLowerCase();
                    if (!query) return options;
                    return options.filter((m) => {
                      const code = (m.referralCode || `MEM-${m.id}`).toLowerCase();
                      const name = (m.name || '').toLowerCase();
                      const idStr = String(m.id).toLowerCase();
                      const mobile = (m.mobile || '').toLowerCase();
                      return (
                        code.includes(query) ||
                        name.includes(query) ||
                        idStr.includes(query) ||
                        mobile.includes(query)
                      );
                    });
                  }}
                  value={members.find((m) => String(m.id) === String(formData.memberId)) || null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleInputChange('memberId', newValue.id);
                    } else {
                      handleInputChange('memberId', '');
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key: _key, ...optionProps } = props;
                    const code = option.referralCode || `MEM-${option.id}`;
                    return (
                      <Box
                        component="li"
                        key={option.id}
                        {...optionProps}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          py: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                            {code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.name}
                          </Typography>
                        </Box>
                        {option.mobile && (
                          <Chip
                            label={option.mobile}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem' }}
                          />
                        )}
                      </Box>
                    );
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...restParams } = params || {};
                    const { startAdornment, ...restInputProps } = InputProps || {};
                    return (
                      <TextField
                        {...restParams}
                        label="Select / Search Member (ID or Name) *"
                        placeholder="Type Member ID or Name..."
                        error={Boolean(errors.memberId)}
                        helperText={errors.memberId || 'Search by Member ID or Name'}
                        InputProps={{
                          ...restInputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <PersonIcon color="action" fontSize="small" />
                              </InputAdornment>
                              {startAdornment}
                            </>
                          ),
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* Amount of Purchase */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Amount of Purchase (₹) *"
                  value={formData.purchaseAmount}
                  onChange={(e) => handleInputChange('purchaseAmount', e.target.value)}
                  error={Boolean(errors.purchaseAmount)}
                  helperText={errors.purchaseAmount || 'Auto-computes 2.5% BV Points'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupeeIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Product Category (Always Groceries/Household) */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  disabled
                  size="small"
                  label="Product Category"
                  value="Groceries/Household"
                  helperText="Category locked to Groceries/Household"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon color="success" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* BV Points (Calculated Automatically) */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  disabled
                  size="small"
                  label="BV Points (Calculated Automatically)"
                  value={`${autoBVPoints} BV`}
                  helperText="Auto-computed: 2.5% of purchase value"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <StarsIcon color="secondary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-input': { fontWeight: 800, color: 'secondary.dark' }
                  }}
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PaymentIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <MenuItem key={pm} value={pm}>
                      {pm}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Order Remark / Ref */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Order Remark / Ref"
                  value={formData.orderRef}
                  onChange={(e) => handleInputChange('orderRef', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Purchase Date */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                    Purchase Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    error={Boolean(errors.purchaseDate)}
                    helperText={errors.purchaseDate}
                    sx={{
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: '#FAF9F6', 
                        borderRadius: 2,
                      },
                      '& .MuiInputBase-input': { 
                        py: '6px', 
                        px: 1.5, 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        color: '#0F172A',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Live Order Summary & Submit Panel */}
            <Paper 
              variant="outlined" 
              sx={{ 
                mt: 3, 
                p: 2, 
                borderRadius: 2.5, 
                bgcolor: '#FEFCE8', 
                borderColor: '#FEF08A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#854D0E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Beneficiary Member
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#78350F' }}>
                    {formData.memberName ? `${formData.memberName} (${formData.memberCode})` : 'No Member Selected'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#FEF08A' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#854D0E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Purchase Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#78350F' }}>
                    {formatINR(currentAmt)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#FEF08A' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#854D0E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    Auto BV Earned (2.5%)
                  </Typography>
                  <Chip
                    icon={<StarsIcon sx={{ fontSize: '13px !important' }} />}
                    label={`${autoBVPoints} BV`}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 800, height: 22 }}
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddShoppingCartIcon />}
                sx={{ px: 4, py: 1.2, fontWeight: 800, borderRadius: 2 }}
              >
                {submitting ? 'Recording...' : 'Record Groceries Purchase'}
              </Button>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* Query Pickers & Export Triggers Bar */}
      <QueryFilterExportBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        typeFilter={categoryFilter}
        onTypeFilterChange={setCategoryFilter}
        typeLabel="Product Category"
        typeOptions={[{ label: 'All Categories', value: 'ALL' }, { label: 'Groceries/Household', value: 'Groceries/Household' }]}
        onPresetChange={handlePresetChange}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onReset={handleResetFilters}
      />

      {/* Repurchase Transaction Log Table (Reframed) */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: '#FAF9F6' }}>
              <TableRow>
                <TableCell><strong>Order Ref ID</strong></TableCell>
                <TableCell><strong>Member ID</strong></TableCell>
                <TableCell><strong>Member Name</strong></TableCell>
                <TableCell align="right"><strong>Amount of Purchase</strong></TableCell>
                <TableCell align="center"><strong>Product Category</strong></TableCell>
                <TableCell align="right"><strong>BV Points (2.5%)</strong></TableCell>
                <TableCell><strong>Payment</strong></TableCell>
                <TableCell><strong>Order Remark / Ref</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No purchase records found matching your query filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const mCode = log.memberCode || `MEM-${log.memberId}`;
                  const orderReference = log.orderRef || log.id;
                  const amt = log.totalAmount || log.amount || 0;
                  const bv = log.businessVolume !== undefined ? log.businessVolume : (amt * 0.025).toFixed(2);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Chip
                          label={orderReference}
                          size="small"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace', bgcolor: '#F1F5F9', color: 'primary.main' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'secondary.dark' }}>
                        {mCode}
                      </TableCell>
                      <TableCell>
                        <strong>{log.memberName}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                          {formatINR(amt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label="Groceries/Household"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#E6F4EA', color: '#137333' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={<StarsIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${Number(bv).toFixed(2)} BV`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{log.paymentMethod || 'UPI'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                        {log.orderRef || log.remarks || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status || 'Completed'}
                          size="small"
                          color={log.status === 'Completed' ? 'success' : 'warning'}
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{log.date}</TableCell>
                    </TableRow>
                  );
                })
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

export default RepurchasePanel;
