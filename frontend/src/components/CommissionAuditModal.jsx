import React from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Paper,
  IconButton
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const CommissionAuditModal = ({ open, onClose, commission }) => {
  const { enableDeductions } = useSelector((state) => state.commission);

  if (!commission) return null;

  const isRepurchase = 
    commission.category === 'Repurchase' || 
    commission.commissionType === 'Repurchase' || 
    Boolean(commission.repurchaseTxId);

  const auditInfo = commission.auditInfo || {};
  const grossAmount = commission.amount || commission.calculatedAmount || 0;
  const tdsAmount = enableDeductions ? (grossAmount * 5) / 100 : 0;
  const adminFeeAmount = enableDeductions ? (grossAmount * 5) / 100 : 0;
  const netAmount = grossAmount - tdsAmount - adminFeeAmount;

  const baseTransactionAmount = isRepurchase
    ? (commission.repurchaseAmount || commission.totalAmount || 0)
    : (commission.membershipAmount || 10000);

  const referenceTxId = isRepurchase
    ? (commission.repurchaseTxId || commission.orderRef || 'REF-UNSPECIFIED')
    : (commission.membershipTxId || 'MTX-UNSPECIFIED');

  return (
    <Dialog open={Boolean(open && commission)} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptLongIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
              {isRepurchase ? 'Repurchase Commission Audit & Traceability Matrix' : 'Direct Referral Commission Audit & Traceability Matrix'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isRepurchase
                ? 'Full audit log of generated Unilevel 20-level Repurchase commission record'
                : 'Full audit log of generated Unilevel 20-level Direct Referral commission record'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {/* Top Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Gross Commission
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                {formatINR(grossAmount)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Level & Tier
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={commission.levelTier || `Level ${commission.level || 1} (${commission.commissionPercentage || (isRepurchase ? 1.5 : 10)}%)`}
                  color={isRepurchase ? 'secondary' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {isRepurchase ? 'Repurchase Amount' : 'Membership Fee'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                {formatINR(baseTransactionAmount)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Payout Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={commission.status || 'Distributed'}
                  color={commission.status === 'Paid' || commission.status === 'Distributed' ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Dynamic Statutory Taxation & TDS Status Card */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: enableDeductions ? '#FEFCE8' : '#F0FDF4', borderColor: enableDeductions ? '#FEF08A' : '#BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon sx={{ color: enableDeductions ? '#B45309' : '#15803D', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: enableDeductions ? '#854D0E' : '#166534' }}>
                Statutory Taxation & TDS Breakdown ({enableDeductions ? 'Admin Deductions Active' : 'Admin Deductions Disabled'})
              </Typography>
              <Typography variant="caption" sx={{ color: enableDeductions ? '#78350F' : '#14532D' }}>
                {enableDeductions 
                  ? `Gross Amount: ${formatINR(grossAmount)} | TDS (5% Sec 194H): -${formatINR(tdsAmount)} | Admin Fee (5%): -${formatINR(adminFeeAmount)}`
                  : `Admin Tax Deductions Disabled — 0% TDS / Admin Fee deducted from Gross ${formatINR(grossAmount)}`}
              </Typography>
            </Box>
          </Box>
          <Chip icon={<LockIcon sx={{ fontSize: '12px !important' }} />} label={`Net Payable: ${formatINR(netAmount)}`} color={enableDeductions ? 'warning' : 'success'} size="small" sx={{ fontWeight: 800 }} />
        </Paper>

        {/* Section 1: Transaction & Relationship Metadata */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTreeIcon fontSize="small" /> Upline Hierarchy Traversal Relationship
        </Typography>

        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: '#FAF9F6' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Beneficiary Member (Upline Receiver)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {commission.memberName || commission.beneficiaryName} (ID: {commission.beneficiaryMemberId || commission.memberId})
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                {isRepurchase ? 'Source Member (Downline Purchaser)' : 'Source Member (New Enrolled Referral)'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'secondary.dark' }}>
                {commission.sourceMember || commission.sourceName} (ID: {commission.sourceMemberId || 'N/A'})
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Sponsor Relationship Line
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {commission.referrerRelationship || `Direct Upline Level ${commission.level}`}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Traversed Hierarchy Depth
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Level {commission.level || 1} of 20 (Max Upline Limit)
              </Typography>
            </Grid>

            {isRepurchase && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Product Category
                </Typography>
                <Chip label="Groceries/Household" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#E6F4EA', color: '#137333' }} />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Section 2: Technical & Idempotency Audit Details */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUserIcon fontSize="small" /> Idempotency & Audit Hash Metadata
        </Typography>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#0F172A', color: '#F8FAFC' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }} display="block">
                Record Transaction ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8' }}>
                {commission.id || commission.transactionId}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }} display="block">
                {isRepurchase ? 'Repurchase Order Ref ID' : 'Membership Payment Tx ID'}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#A7F3D0' }}>
                {referenceTxId}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }} display="block">
                Idempotency Verification Hash
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#FDE047' }}>
                {auditInfo.idempotencyHash || `${referenceTxId}_L${commission.level || 1}_B${commission.beneficiaryMemberId || commission.memberId}`}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }} display="block">
                Applied Calculation Formula
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#E2E8F0' }}>
                {auditInfo.formula || (isRepurchase
                  ? `Repurchase (${formatINR(baseTransactionAmount)}) * ${commission.commissionPercentage || 1.5}% = Gross (${formatINR(grossAmount)})`
                  : `Membership (${formatINR(baseTransactionAmount)}) * ${commission.commissionPercentage || 10}% = Gross (${formatINR(grossAmount)})`)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: '#334155' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Rules Version: <strong>{auditInfo.rulesVersion || (isRepurchase ? '1.0.0-Unilevel-Repurchase-20L' : '1.0.0-Unilevel-20L')}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Validated At: <strong>{auditInfo.validatedAt || commission.createdAt || commission.date}</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close Audit Window
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommissionAuditModal;
