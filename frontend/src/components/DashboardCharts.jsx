import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// Format INR Utility
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Admin Performance Mock Dataset
const adminMonthlyPerformance = [
  { month: 'Jan', earnings: 180000, payouts: 45000, newMembers: 12, tds: 4500, repurchase: 30000 },
  { month: 'Feb', earnings: 220000, payouts: 55000, newMembers: 18, tds: 5500, repurchase: 45000 },
  { month: 'Mar', earnings: 300000, payouts: 75000, newMembers: 25, tds: 7500, repurchase: 70000 },
  { month: 'Apr', earnings: 280000, payouts: 68000, newMembers: 20, tds: 6800, repurchase: 60000 },
  { month: 'May', earnings: 410000, payouts: 102000, newMembers: 32, tds: 10200, repurchase: 95000 },
  { month: 'Jun', earnings: 520000, payouts: 128000, newMembers: 42, tds: 12800, repurchase: 130000 },
];

// Member Performance Mock Dataset
const memberMonthlyPerformance = [
  { month: 'Jan', directCommissions: 15000, indirectCommissions: 5000, referrals: 2 },
  { month: 'Feb', directCommissions: 22000, indirectCommissions: 8000, referrals: 3 },
  { month: 'Mar', directCommissions: 18000, indirectCommissions: 6000, referrals: 1 },
  { month: 'Apr', directCommissions: 30000, indirectCommissions: 12000, referrals: 4 },
  { month: 'May', directCommissions: 45000, indirectCommissions: 18000, referrals: 6 },
  { month: 'Jun', directCommissions: 50000, indirectCommissions: 22000, referrals: 8 },
];

// 20-Level Tree Commission Allocation Data
const levelDistributionData = [
  { level: 'L1 Direct', rate: '25%', amount: 125000, beneficiaries: 42, color: '#10B981' },
  { level: 'L2 Core', rate: '10%', amount: 68000, beneficiaries: 88, color: '#06B6D4' },
  { level: 'L3 Team', rate: '5%', amount: 42000, beneficiaries: 145, color: '#3B82F6' },
  { level: 'L4 Growth', rate: '3%', amount: 28000, beneficiaries: 210, color: '#8B5CF6' },
  { level: 'L5 Depth', rate: '2%', amount: 18000, beneficiaries: 320, color: '#EC4899' },
  { level: 'L6-L20 Tree', rate: '1% ea', amount: 35000, beneficiaries: 850, color: '#F59E0B' },
];

// Smooth Bezier Curve Path Generator
const getSplinePath = (points) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }
  return path;
};

/**
 * Enhanced Admin Performance Chart Component
 * Clean, sleek interactive views:
 * 1. Spline Area Trend (Curved Lines + Neon Area Glow)
 * 2. Radial Donut Allocation (System Revenue Split)
 * 3. 20-Level Tree Tier Payout Breakdown
 */
export const AdminPerformanceChart = () => {
  const [chartMode, setChartMode] = useState('spline');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const data = adminMonthlyPerformance;

  // Layout Dimensions
  const width = 680;
  const height = 260;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 35;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index) => paddingLeft + index * (chartWidth / (data.length - 1));
  const getY = (val, maxVal) => height - paddingBottom - (val / (maxVal || 1)) * chartHeight;

  // Render Mode 1: Smooth Spline Area Trend
  const renderSplineChart = () => {
    const maxVal = Math.max(...data.map(d => Math.max(d.earnings, d.payouts))) * 1.15;
    const gridTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

    const earningsPts = data.map((d, i) => ({ x: getX(i), y: getY(d.earnings, maxVal) }));
    const payoutsPts = data.map((d, i) => ({ x: getX(i), y: getY(d.payouts, maxVal) }));

    const earningsSpline = getSplinePath(earningsPts);
    const payoutsSpline = getSplinePath(payoutsPts);

    const earningsArea = `${earningsSpline} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;
    const payoutsArea = `${payoutsSpline} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

    return (
      <Box sx={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="adminEarnGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="adminPayoutGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {gridTicks.map((tick, idx) => {
            const y = getY(tick, maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10px"
                  fontWeight="600"
                  fill="#64748B"
                >
                  {formatINR(tick)}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              fontSize="11px"
              fontWeight="700"
              fill="#475569"
            >
              {d.month}
            </text>
          ))}

          {/* Spline Area Fills */}
          <path d={earningsArea} fill="url(#adminEarnGlow)" />
          <path d={payoutsArea} fill="url(#adminPayoutGlow)" />

          {/* Curved Spline Lines */}
          <path d={earningsSpline} fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
          <path d={payoutsSpline} fill="none" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />

          {/* Hover Crosshair Vertical Line */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={height - paddingBottom}
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Point Markers */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cyEarn = getY(d.earnings, maxVal);
            const cyPayout = getY(d.payouts, maxVal);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cyEarn}
                  r={isHovered ? 7 : 4.5}
                  fill="#FFFFFF"
                  stroke="#3B82F6"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <circle
                  cx={cx}
                  cy={cyPayout}
                  r={isHovered ? 7 : 4.5}
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Interactive Hover Hitbox */}
                <rect
                  x={cx - chartWidth / (data.length - 1) / 2}
                  y={paddingTop}
                  width={chartWidth / (data.length - 1)}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  // Render Mode 2: Radial Donut Revenue Allocation
  const renderDonutChart = () => {
    const slices = [
      { name: 'Membership Packages', value: 1200000, color: '#10B981', percentage: '62.8%' },
      { name: 'Repurchase Volume', value: 430000, color: '#8B5CF6', percentage: '22.5%' },
      { name: 'Commission Payouts', value: 473000, color: '#3B82F6', percentage: '24.7%' },
      { name: 'TDS & Admin Retention', value: 94600, color: '#F59E0B', percentage: '5.0%' },
    ];

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 3, py: 2 }}>
        {/* SVG Donut */}
        <Box sx={{ position: 'relative', width: 200, height: 200 }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="16" strokeDasharray="150 240" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="55 240" strokeDashoffset="-150" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="16" strokeDasharray="60 240" strokeDashoffset="-205" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="16" strokeDasharray="12 240" strokeDashoffset="-265" transform="rotate(-90 50 50)" />
          </svg>
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Gross Revenue
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              ₹19.1L
            </Typography>
          </Box>
        </Box>

        {/* Donut Legend */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 260 }}>
          {slices.map((slice, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${slice.color}`, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: slice.color }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  {slice.name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {formatINR(slice.value)}
                </Typography>
                <Typography variant="caption" sx={{ color: slice.color, fontWeight: 700 }}>
                  {slice.percentage}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  // Render Mode 3: 20-Level Tree Commission Distribution Breakdown
  const renderLevelChart = () => {
    return (
      <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Unilevel Tier Payout Distribution (20-Level Deep Tree)
        </Typography>

        {levelDistributionData.map((item, idx) => (
          <Box key={idx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={item.level} size="small" sx={{ bgcolor: `${item.color}15`, color: item.color, fontWeight: 800, fontSize: '0.7rem', height: 22 }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                  ({item.rate} rate | {item.beneficiaries} members)
                </Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {formatINR(item.amount)}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', bgcolor: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ width: `${(item.amount / 125000) * 100}%`, bgcolor: item.color, height: '100%', borderRadius: 4 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card sx={{ mt: 3, p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
      <CardContent sx={{ p: 1 }}>
        {/* Header Controls Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={800} color="primary.main">
                Network Financial Analytics & Growth Trend
              </Typography>
              <Chip icon={<ArrowUpwardIcon sx={{ fontSize: '12px !important' }} />} label="+24.5% MoM" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Live real-time system turnover, unilevel commission payouts, and 20-tier member distribution.
            </Typography>
          </Box>

          {/* Interactive Visual Chart Preset Switcher */}
          <ToggleButtonGroup
            value={chartMode}
            exclusive
            onChange={(e, val) => val && setChartMode(val)}
            size="small"
            sx={{
              bgcolor: '#F8FAFC',
              p: 0.5,
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1.5,
                px: 1.75,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'none',
                color: '#64748B',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(30, 41, 59, 0.25)'
                }
              }
            }}
          >
            <ToggleButton value="spline">
              <Tooltip title="Smooth Curved Spline & Neon Area Glow">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShowChartIcon sx={{ fontSize: 16 }} /> Spline Curve
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="donut">
              <Tooltip title="System Revenue Allocation Donut">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PieChartIcon sx={{ fontSize: 16 }} /> Radial Donut
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="level">
              <Tooltip title="20-Level Tree Commission Tier Payouts">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountTreeIcon sx={{ fontSize: 16 }} /> 20-Level Tier
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Selected Chart View */}
        {chartMode === 'spline' && renderSplineChart()}
        {chartMode === 'donut' && renderDonutChart()}
        {chartMode === 'level' && renderLevelChart()}

        {/* Hover Glassmorphism Tooltip for Spline Chart */}
        {hoveredIdx !== null && chartMode === 'spline' && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-around',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Month
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#38BDF8' }}>
                {data[hoveredIdx].month}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Total Sales Turnover
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#3B82F6' }}>
                {formatINR(data[hoveredIdx].earnings)}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Distributed Payouts
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                {formatINR(data[hoveredIdx].payouts)}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Statutory TDS & Admin Fees
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                {formatINR(data[hoveredIdx].tds)}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Net Retained System Margin
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#38BDF8' }}>
                {formatINR(data[hoveredIdx].earnings - data[hoveredIdx].payouts - data[hoveredIdx].tds)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Spline Chart Legend */}
        {chartMode === 'spline' && (
          <Box display="flex" justifyContent="center" gap={4} mt={2.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3B82F6' }} />
              <Typography variant="caption" fontWeight="700" color="#475569">Total Sales Revenue</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
              <Typography variant="caption" fontWeight="700" color="#475569">Distributed Commission Payouts</Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Enhanced Member Performance Chart Component
 */
export const MemberPerformanceChart = () => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const data = memberMonthlyPerformance;

  const width = 680;
  const height = 250;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 35;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index) => paddingLeft + index * (chartWidth / (data.length - 1));
  const getY = (val, maxVal) => height - paddingBottom - (val / (maxVal || 1)) * chartHeight;

  const maxVal = Math.max(...data.map(d => d.directCommissions + d.indirectCommissions)) * 1.18;
  const gridTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const directPts = data.map((d, i) => ({ x: getX(i), y: getY(d.directCommissions, maxVal) }));
  const totalPts = data.map((d, i) => ({ x: getX(i), y: getY(d.directCommissions + d.indirectCommissions, maxVal) }));

  const directSpline = getSplinePath(directPts);
  const totalSpline = getSplinePath(totalPts);

  const directArea = `${directSpline} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;
  const totalArea = `${totalSpline} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

  return (
    <Card sx={{ mt: 3, p: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
      <CardContent sx={{ p: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={800} color="primary.main">
                My MLM Earnings & Downline Signups Trend
              </Typography>
              <Chip icon={<ArrowUpwardIcon sx={{ fontSize: '12px !important' }} />} label="+18.4% Growth" size="small" color="secondary" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Monthly direct referral commissions vs indirect team bonus performance.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="memTotalGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="memDirectGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {gridTicks.map((tick, idx) => {
              const y = getY(tick, maxVal);
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fontSize="10px" fontWeight="600" fill="#64748B">
                    {formatINR(tick)}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => (
              <text key={i} x={getX(i)} y={height - paddingBottom + 20} textAnchor="middle" fontSize="11px" fontWeight="700" fill="#475569">
                {d.month}
              </text>
            ))}

            <path d={totalArea} fill="url(#memTotalGlow)" />
            <path d={directArea} fill="url(#memDirectGlow)" />

            <path d={totalSpline} fill="none" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
            <path d={directSpline} fill="none" stroke="#06B6D4" strokeWidth="3.5" strokeLinecap="round" />

            {hoveredIdx !== null && (
              <line x1={getX(hoveredIdx)} y1={paddingTop} x2={getX(hoveredIdx)} y2={height - paddingBottom} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
            )}

            {data.map((d, i) => {
              const cx = getX(i);
              const cyDirect = getY(d.directCommissions, maxVal);
              const cyTotal = getY(d.directCommissions + d.indirectCommissions, maxVal);
              const isHovered = hoveredIdx === i;

              return (
                <g key={i}>
                  <circle cx={cx} cy={cyDirect} r={isHovered ? 7 : 4.5} fill="#FFFFFF" stroke="#06B6D4" strokeWidth={isHovered ? 3.5 : 2.5} />
                  <circle cx={cx} cy={cyTotal} r={isHovered ? 7 : 4.5} fill="#FFFFFF" stroke="#10B981" strokeWidth={isHovered ? 3.5 : 2.5} />

                  <rect
                    x={cx - chartWidth / (data.length - 1) / 2}
                    y={paddingTop}
                    width={chartWidth / (data.length - 1)}
                    height={chartHeight}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })}
          </svg>
        </Box>

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-around',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Month
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#38BDF8' }}>
                {data[hoveredIdx].month}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Direct Referral Bonus
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#06B6D4' }}>
                {formatINR(data[hoveredIdx].directCommissions)}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Indirect Downline Bonus
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#8B5CF6' }}>
                {formatINR(data[hoveredIdx].indirectCommissions)}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid #334155', pl: 2 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.65rem' }}>
                Total Monthly Earnings
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                {formatINR(data[hoveredIdx].directCommissions + data[hoveredIdx].indirectCommissions)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Spline Chart Legend */}
        <Box display="flex" justifyContent="center" gap={4} mt={2.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#06B6D4' }} />
            <Typography variant="caption" fontWeight="700" color="#475569">Direct Referral Bonus</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="caption" fontWeight="700" color="#475569">Total MLM Earnings</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
