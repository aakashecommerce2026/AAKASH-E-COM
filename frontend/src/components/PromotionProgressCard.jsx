import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import StarsIcon from '@mui/icons-material/Stars';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { promotionsApi } from '../services/api';

const RANK_DETAILS = {
  NONE: {
    label: 'Standard Member',
    badgeColor: '#64748B',
    bgColor: '#F8FAFC',
    icon: '👤',
    borderColor: '#E2E8F0',
  },
  BRONZE: {
    label: 'Bronze Member',
    badgeColor: '#B45309',
    bgColor: '#FFFBEB',
    icon: '🥉',
    borderColor: '#FCD34D',
  },
  SILVER: {
    label: 'Silver Member',
    badgeColor: '#475569',
    bgColor: '#F1F5F9',
    icon: '🥈',
    borderColor: '#94A3B8',
  },
  GOLD: {
    label: 'Gold Member',
    badgeColor: '#D97706',
    bgColor: '#FEF3C7',
    icon: '🥇',
    borderColor: '#F59E0B',
  },
  PLATINUM: {
    label: 'Platinum Member',
    badgeColor: '#0284C7',
    bgColor: '#F0F9FF',
    icon: '💎',
    borderColor: '#38BDF8',
  },
};

const ROADMAP_STEPS = [
  { rank: 'BRONZE', title: 'Bronze Level', req: 20, note: 'First 20 direct referrals', icon: '🥉' },
  { rank: 'SILVER', title: 'Silver Level', req: 50, note: 'Next 30 direct referrals (+30)', icon: '🥈' },
  { rank: 'GOLD', title: 'Gold Level', req: 90, note: 'Next 40 direct referrals (+40)', icon: '🥇' },
  { rank: 'PLATINUM', title: 'Platinum Level', req: 130, note: 'Next 40 direct referrals (+40)', icon: '💎' },
];

export const PromotionProgressCard = ({ memberId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchStatus = memberId
      ? promotionsApi.getMemberProgress(memberId)
      : promotionsApi.getMyStatus();

    fetchStatus
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load promotion progress');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [memberId]);

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#FFFFFF' }}>
        <CircularProgress size={28} sx={{ color: '#D97706', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading promotion rank status...
        </Typography>
      </Paper>
    );
  }

  if (error || !data) {
    return null; // Gracefully degrade if endpoint is unavailable
  }

  const currentRank = data.currentRank || 'NONE';
  const currentRankConfig = RANK_DETAILS[currentRank] || RANK_DETAILS.NONE;
  const isMaxRank = data.nextRank === 'MAX';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        borderColor: currentRankConfig.borderColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header Title & Current Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ color: currentRankConfig.badgeColor, fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                Member Promotion Level
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Direct Downline Milestone Rewards
              </Typography>
            </Box>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 0.8,
              borderRadius: 2.5,
              bgcolor: currentRankConfig.bgColor,
              borderColor: currentRankConfig.borderColor,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontSize: '1.2rem' }}>
              {currentRankConfig.icon}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: currentRankConfig.badgeColor }}>
              {currentRankConfig.label}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Direct Referrals Progress Counter */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <GroupAddIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ACTIVE DIRECT DOWNLINE
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A' }}>
                {data.activeDirectCount} <Typography component="span" variant="body2" color="text.secondary">members</Typography>
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: isMaxRank ? '#F0F9FF' : '#FFFBEB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StarsIcon sx={{ color: isMaxRank ? '#0284C7' : '#D97706', fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  NEXT PROMOTION TARGET
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: isMaxRank ? '#0284C7' : '#D97706' }}>
                {isMaxRank ? 'Highest Rank Reached!' : `${data.remainingReferralsNeeded} more referrals`}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Progress Bar towards Next Milestone */}
        {!isMaxRank && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                Progress to {data.nextRank} Level ({data.activeDirectCount} / {data.targetThreshold} Direct Referrals)
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706' }}>
                {data.progressPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={data.progressPercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: '#E2E8F0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                },
              }}
            />
          </Box>
        )}

        {/* 4-Level Promotion Roadmap Grid */}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🏁 Promotion Milestone Levels
        </Typography>

        <Grid container spacing={1.5}>
          {ROADMAP_STEPS.map((step) => {
            const isUnlocked = data.activeDirectCount >= step.req;
            const isCurrent = currentRank === step.rank;

            return (
              <Grid item xs={6} sm={3} key={step.rank}>
                <Tooltip title={step.note} arrow placement="top">
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      textAlign: 'center',
                      bgcolor: isCurrent ? '#FEF3C7' : isUnlocked ? '#F0FDF4' : '#F8FAFC',
                      borderColor: isCurrent ? '#F59E0B' : isUnlocked ? '#86EFAC' : '#E2E8F0',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.4rem' }}>{step.icon}</Typography>
                      {isUnlocked ? (
                        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                      ) : (
                        <LockIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                      )}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
                      {step.title}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: isUnlocked ? '#166534' : '#64748B' }}>
                      {step.req} Directs
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};
