import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SecurityIcon from '@mui/icons-material/Security';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';

export const UnilevelTree = ({ members }) => {
  const [expandedNodes, setExpandedNodes] = useState(() => {
    const initialMap = {};
    if (members) {
      members.forEach((m) => { initialMap[m.id] = true; });
    }
    return initialMap;
  });

  // Sync expanded state when new members join
  React.useEffect(() => {
    if (members && members.length > 0) {
      setExpandedNodes((prev) => {
        const updated = { ...prev };
        members.forEach((m) => {
          if (updated[m.id] === undefined) {
            updated[m.id] = true;
          }
        });
        return updated;
      });
    }
  }, [members]);

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [blockadeAlert, setBlockadeAlert] = useState({ open: false, targetId: '', reason: '' });

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Find root nodes (members with no sponsors, or sponsors who are not in the list)
  const memberIds = useMemo(() => members.map((m) => m.id), [members]);
  const rootMembers = useMemo(() => {
    return members.filter(
      (m) => m.sponsorId === null || m.sponsorId === undefined || !memberIds.includes(m.sponsorId)
    );
  }, [members, memberIds]);

  // Build children lookup map
  const childrenMap = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      if (m.sponsorId) {
        if (!map[m.sponsorId]) map[m.sponsorId] = [];
        map[m.sponsorId].push(m);
      }
    });
    return map;
  }, [members]);

  // Tree Node Search & Security Blockade Verification Engine
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const queryNum = Number(searchQuery.trim());
    const matchedMember = members.find(
      (m) => m.id === queryNum || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.referralCode && m.referralCode.toLowerCase() === searchQuery.toLowerCase())
    );

    if (matchedMember) {
      // Valid Downline Node Access
      setHighlightedId(matchedMember.id);
      // Auto-expand parents
      setExpandedNodes((prev) => ({ ...prev, [matchedMember.id]: true, [matchedMember.sponsorId]: true }));
    } else {
      // Access Denied: Query target is outside authorized downline branch (Upline or Cross-Branch)
      setHighlightedId(null);
      setBlockadeAlert({
        open: true,
        targetId: searchQuery,
        reason: `Node ID/Term "${searchQuery}" is outside your authorized downline branch. Upline sponsors and cross-branch nodes are blocked under strict MLM network isolation policy.`
      });
    }
  };

  // ORG CHART LAYOUT CALCULATOR: Depth-first X placement, vertical Y generation levels
  const layoutData = useMemo(() => {
    if (rootMembers.length === 0) return null;

    const coords = {};
    let leafCount = 0;

    const traverse = (node, level) => {
      const children = childrenMap[node.id] || [];
      const isExpanded = expandedNodes[node.id];
      const visibleChildren = isExpanded ? children : [];

      const nodeLayout = {
        id: node.id,
        member: node,
        level: level,
        y: 40 + level * 185,
        x: 0,
        hasChildren: children.length > 0,
        isExpanded: isExpanded,
        children: []
      };

      coords[node.id] = nodeLayout;

      if (visibleChildren.length === 0) {
        nodeLayout.x = 40 + leafCount * 350;
        leafCount++;
      } else {
        const childLayouts = visibleChildren.map((c) => traverse(c, level + 1));
        nodeLayout.children = childLayouts;
        const firstX = childLayouts[0].x;
        const lastX = childLayouts[childLayouts.length - 1].x;
        nodeLayout.x = (firstX + lastX) / 2;
      }

      return nodeLayout;
    };

    const treeRoots = rootMembers.map((r) => traverse(r, 0));

    let maxLevel = 0;
    Object.values(coords).forEach((c) => {
      if (c.level > maxLevel) maxLevel = c.level;
    });

    return {
      roots: treeRoots,
      coords: coords,
      canvasWidth: Math.max(leafCount * 350 + 60, 800),
      canvasHeight: (maxLevel + 1) * 185 + 60
    };
  }, [rootMembers, childrenMap, expandedNodes]);

  // Compute SVG bezier curve connection paths
  const connectors = useMemo(() => {
    if (!layoutData) return [];

    const list = [];
    Object.values(layoutData.coords).forEach((parentLayout) => {
      const children = parentLayout.children || [];
      children.forEach((childLayout) => {
        const startX = parentLayout.x + 160;
        const startY = parentLayout.y + 80;
        const endX = childLayout.x + 160;
        const endY = childLayout.y;

        const cp1X = startX;
        const cp1Y = startY + 50;
        const cp2X = endX;
        const cp2Y = endY - 50;

        const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        list.push({
          id: `${parentLayout.id}-${childLayout.id}`,
          d: pathD
        });
      });
    });
    return list;
  }, [layoutData]);

  return (
    <Paper sx={{ p: 4, bgcolor: '#FAF9F6', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {/* Top Header Bar & Tree Search Form */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountTreeIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                Unilevel Network Structure
              </Typography>
              <Chip 
                label="Upline & Cross-Branch Blockade Active" 
                color="success" 
                size="small" 
                icon={<SecurityIcon />}
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Strict downline hierarchy visualization. Upline sponsors and collateral cross-branches are blockaded.
            </Typography>
          </Box>
        </Box>

        {/* Tree Node Search Box */}
        <form onSubmit={handleSearchNode} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search Member ID / Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5, width: 220 }}
          />
          <Button type="submit" variant="contained" color="secondary" size="small" sx={{ height: 38, fontWeight: 700 }}>
            Inspect
          </Button>
        </form>
      </Box>

      {rootMembers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
          No downline network hierarchy found. Register referrals to build your tree.
        </Typography>
      ) : (
        /* ================= VERTICAL SVG BEZIER ORG CHART CANVAS ================= */
        <Box 
          sx={{ 
            width: '100%', 
            overflowX: 'auto', 
            overflowY: 'auto', 
            maxHeight: 620, 
            bgcolor: '#FFFFFF', 
            border: '1px solid #F1F5F9',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          {layoutData && (
            <Box 
              sx={{ 
                width: layoutData.canvasWidth, 
                height: layoutData.canvasHeight, 
                position: 'relative',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {/* SVG Connector Lines Canvas */}
              <svg 
                width={layoutData.canvasWidth} 
                height={layoutData.canvasHeight} 
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              >
                {connectors.map((c) => (
                  <path
                    key={c.id}
                    d={c.d}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    style={{ transition: 'all 0.3s ease-in-out' }}
                  />
                ))}
              </svg>

              {/* Absolute Positioned Member Node Cards */}
              {Object.values(layoutData.coords).map((node) => {
                const member = node.member;
                const isHighlighted = highlightedId === member.id;

                return (
                  <Box
                    key={node.id}
                    sx={{
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: 320,
                      height: 80,
                      zIndex: 3,
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        bgcolor: isHighlighted ? '#FEF3C7' : 'background.paper',
                        borderColor: isHighlighted ? '#D97706' : (node.hasChildren ? 'primary.light' : '#E2E8F0'),
                        borderLeft: `4px solid ${isHighlighted ? '#D97706' : (node.hasChildren ? '#064E3B' : '#CA8A04')}`,
                        boxShadow: isHighlighted ? '0 0 12px rgba(217, 119, 6, 0.4)' : '0 2px 4px rgba(0,0,0,0.02)',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 6px 12px rgba(6,78,59,0.08)',
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Avatar sx={{ bgcolor: node.hasChildren ? 'primary.main' : 'secondary.main', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
                        {member.name ? member.name.charAt(0) : <PersonIcon />}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <EmailIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {member.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                            Joined: {member.joinedDate}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0 }}>
                        <Chip 
                          label={`ID: ${member.id}`} 
                          size="small" 
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#F1F5F9' }} 
                        />
                        {member.referralCode && (
                          <Chip 
                            label={member.referralCode} 
                            size="small" 
                            variant="outlined"
                            color="secondary"
                            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} 
                          />
                        )}
                      </Box>
                    </Paper>

                    {/* Expand/Collapse Chevron Button */}
                    {node.hasChildren && (
                      <IconButton
                        size="small"
                        onClick={() => toggleNode(member.id)}
                        sx={{
                          position: 'absolute',
                          bottom: -13,
                          left: 147,
                          bgcolor: 'background.paper',
                          border: '1px solid #CBD5E1',
                          width: 26,
                          height: 26,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          zIndex: 5,
                          '&:hover': { bgcolor: '#F8FAFC' }
                        }}
                      >
                        {node.isExpanded ? <KeyboardArrowDownIcon sx={{ fontSize: 16 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Security Blockade Enforced Alert Dialog */}
      <Dialog open={blockadeAlert.open} onClose={() => setBlockadeAlert({ open: false, targetId: '', reason: '' })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ bgcolor: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <BlockIcon sx={{ fontSize: 26, color: '#DC2626' }} />
          <Typography variant="subtitle1" fontWeight={800}>
            Access Denied: Tree Blockade
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="error" icon={<SecurityIcon />} sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Upline & Cross-Branch Isolation Enforced</strong>
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            {blockadeAlert.reason}
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#FAF9F6', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Network Security Rule:
            </Typography>
            <Typography variant="caption" fontWeight={700} color="error.main">
              Members can only view downlines originating from their own branch. Upline sponsors and collateral branches are strictly blockaded.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button 
            onClick={() => setBlockadeAlert({ open: false, targetId: '', reason: '' })} 
            variant="contained" 
            color="error" 
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            Acknowledge Security Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
