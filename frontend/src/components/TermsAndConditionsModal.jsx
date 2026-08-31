import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import UndoIcon from '@mui/icons-material/Undo';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';

export const TERMS_POINTS = [
  {
    id: 1,
    title: 'Product Dispatch Timeline',
    category: 'Dispatch & Shipping',
    icon: <LocalShippingIcon fontSize="small" />,
    text: 'Product dispatch will take between 7 to 15 days from the date of payment receipt.',
  },
  {
    id: 2,
    title: 'Product Quantity & Pricing Adjustments',
    category: 'Dispatch & Shipping',
    icon: <LocalShippingIcon fontSize="small" />,
    text: 'According to market product pricing changes, product quantity and package compositions are subject to minor adjustments.',
  },
  {
    id: 3,
    title: 'Weekly Commission Settlement Cycle',
    category: 'Commissions & Payouts',
    icon: <MonetizationOnIcon fontSize="small" />,
    text: 'Commission earnings operate on a 1-week settlement cycle. (For example, if a member joins on a Monday, their generated commission will be eligible after 1 week).',
  },
  {
    id: 4,
    title: 'Scheduled Payout Day',
    category: 'Commissions & Payouts',
    icon: <MonetizationOnIcon fontSize="small" />,
    text: 'All verified commissions will be released and dispatched every Wednesday.',
  },
  {
    id: 5,
    title: 'Pre-Dispatch Refund Policy',
    category: 'Cancellation & Refunds',
    icon: <UndoIcon fontSize="small" />,
    text: 'If an order cancellation is requested BEFORE product dispatch, a 10% administrative fee will be deducted and the remaining amount will take 1 week to refund. Once a product is dispatched or delivered, no refund will be issued under any circumstances.',
  },
  {
    id: 6,
    title: 'Repurchase Damaged Product Exchange',
    category: 'Cancellation & Refunds',
    icon: <UndoIcon fontSize="small" />,
    text: 'For repurchases, products received in damaged condition will be considered for exchange only (not refunded), provided the issue is reported within 5 days of receipt with valid proof.',
  },
  {
    id: 7,
    title: 'Dispatched Repurchase Non-Refundability',
    category: 'Cancellation & Refunds',
    icon: <UndoIcon fontSize="small" />,
    text: 'In the case of repurchase products being dispatched, the paid amount will not be refunded.',
  },
  {
    id: 8,
    title: 'Flexible Repurchase Channels',
    category: 'Repurchase & Delivery',
    icon: <StorefrontIcon fontSize="small" />,
    text: 'Repurchases can be made at any time in-store or conveniently through official WhatsApp order channels.',
  },
  {
    id: 9,
    title: 'Free Local Delivery Radius',
    category: 'Repurchase & Delivery',
    icon: <LocalShippingIcon fontSize="small" />,
    text: 'Product delivery is FREE within Paramathi Velur and up to a 5 KM radius.',
  },
  {
    id: 10,
    title: 'Extended Delivery Charges & Address Accuracy',
    category: 'Repurchase & Delivery',
    icon: <LocalShippingIcon fontSize="small" />,
    text: 'Apart from the 5 KM radius, the member must pay standard delivery charges. Shipping will be done safely; members must ensure the address given is correct for shipment and door delivery.',
  },
  {
    id: 11,
    title: 'Repurchase BV & Quarterly Awards',
    category: 'MLM Network & Rewards',
    icon: <AccountBalanceWalletIcon fontSize="small" />,
    text: 'BV (Business Volume) points earned from repurchases cannot be redeemed or used directly for purchasing products. Instead, accumulated BV points and rank promotions qualify members for special company gifts, awards, and recognition presented at the end of every quarter.',
  },
  {
    id: 12,
    title: 'Network Membership & Verification',
    category: 'MLM Network & Rewards',
    icon: <SecurityIcon fontSize="small" />,
    text: 'Membership activation requires valid member verification details and a valid sponsor referral code. Self-referrals or fake duplicate accounts are strictly prohibited.',
  },
  {
    id: 13,
    title: 'Commission Calculations',
    category: 'MLM Network & Rewards',
    icon: <MonetizationOnIcon fontSize="small" />,
    text: 'Referral bonuses and level earnings are calculated strictly based on active member status and official compensation plan rules.',
  },
  {
    id: 14,
    title: 'Genuine Product Sales Policy',
    category: 'MLM Network & Rewards',
    icon: <StorefrontIcon fontSize="small" />,
    text: 'AAKASH E-COM operates strictly as a product-driven direct sales network. Member earnings are generated through genuine product purchases and repurchases.',
  },
  {
    id: 15,
    title: 'Account & Downline Non-Transferability',
    category: 'MLM Network & Rewards',
    icon: <SecurityIcon fontSize="small" />,
    text: 'Member accounts, sponsor placements, and downline structures cannot be transferred to third parties without prior written management approval.',
  },
  {
    id: 16,
    title: 'Payout Processing & Accurate UPI Details',
    category: 'Commissions & Payouts',
    icon: <MonetizationOnIcon fontSize="small" />,
    text: 'Commission payouts are processed directly into the member\'s registered UPI ID or bank account. Members must ensure their UPI ID and bank details are entered accurately in their profile; AAKASH E-COM is not responsible for payout delays or failed transfers caused by incorrect UPI or bank information.',
  },
  {
    id: 17,
    title: 'Ethical Business Representation',
    category: 'MLM Network & Rewards',
    icon: <SecurityIcon fontSize="small" />,
    text: 'Members must represent AAKASH E-COM products, pricing, and compensation structures transparently without making exaggerated or misleading income claims.',
  },
  {
    id: 18,
    title: 'Account Compliance & Suspension',
    category: 'MLM Network & Rewards',
    icon: <SecurityIcon fontSize="small" />,
    text: 'AAKASH E-COM reserves the right to suspend or terminate any member account found engaging in fraud, cross-sponsoring, or policy violations.',
  },
  {
    id: 19,
    title: 'Force Majeure & Logistics Delays',
    category: 'Dispatch & Shipping',
    icon: <LocalShippingIcon fontSize="small" />,
    text: 'AAKASH E-COM is not liable for shipping delays caused by natural disasters, strikes, or third-party courier disruptions.',
  },
  {
    id: 20,
    title: 'Plan Modifications & Legal Jurisdiction',
    category: 'Legal & Jurisdiction',
    icon: <GavelIcon fontSize="small" />,
    text: 'AAKASH E-COM reserves the right to update product packages, terms, or promotion policies with prior notice. All legal matters are subject to the exclusive jurisdiction of local courts (Paramathi Velur / Namakkal District, Tamil Nadu).',
  },
];

const TermsAndConditionsModal = ({ open, onAccept, onClose, mandatory = false }) => {
  return (
    <Dialog
      open={open}
      onClose={mandatory ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          boxShadow: '0 20px 40px rgba(2, 44, 34, 0.25)',
        },
      }}
    >
      {/* Title Header */}
      <DialogTitle
        sx={{
          bgcolor: '#022C22',
          color: '#FFFFFF',
          py: 2.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: '#FBBF24',
              color: '#022C22',
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GavelIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '0.3px', lineHeight: 1.2 }}>
              AAKASH E-COM Terms & Conditions
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
              Official Member Rules & Platform Policy (20 Points)
            </Typography>
          </Box>
        </Box>

        {!mandatory && onClose && (
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      {/* Main Points List */}
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mandatory && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              borderRadius: 2.5,
              color: '#92400E',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              ⚠️ Mandatory Terms & Conditions Agreement Required
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
              To access your Member Portal Dashboard, please review and accept the official AAKASH E-COM Terms & Conditions below.
            </Typography>
          </Paper>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Please carefully review all 20 terms and conditions below governing orders, deliveries, refunds, commission releases, and network participation.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {TERMS_POINTS.map((point) => (
            <Paper
              key={point.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderColor: '#E2E8F0',
                bgcolor: '#FFFFFF',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#FBBF24',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Chip
                  label={`Point #${point.id}`}
                  size="small"
                  sx={{
                    bgcolor: '#022C22',
                    color: '#FBBF24',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    height: 24,
                    mt: 0.2,
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {point.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, lineHeight: 1.5, fontSize: '0.88rem' }}>
                    {point.text}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </DialogContent>

      <Divider />

      {/* Footer Action */}
      <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
        {!mandatory && onClose && (
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<CheckCircleIcon />}
          onClick={onAccept}
          sx={{
            ml: 'auto',
            px: 4,
            py: 1.2,
            fontWeight: 800,
            bgcolor: '#022C22',
            color: '#FBBF24',
            '&:hover': {
              bgcolor: '#064E3B',
            },
          }}
        >
          I Agree & Accept Terms & Conditions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndConditionsModal;
