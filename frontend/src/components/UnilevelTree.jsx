import React, { useState, useMemo, useEffect } from 'react';
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
  InputAdornment,
  Tooltip,
  ButtonGroup,
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
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import GroupsIcon from '@mui/icons-material/Groups';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

// Helper to normalize string IDs across String vs Number mismatches
const getNormId = (val) => (val !== undefined && val !== null && val !== '' ? String(val) : null);

export const UnilevelTree = ({ members = [] }) => {
  const [expandedNodes, setExpandedNodes] = useState(() => {
    const initialMap = {};
    if (members) {
      members.forEach((m) => {
        const idStr = getNormId(m.id);
        if (idStr) initialMap[idStr] = true;
      });
    }
    return initialMap;
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [blockadeAlert, setBlockadeAlert] = useState({ open: false, targetId: '', reason: '' });

  // Sync expanded state when members change
  useEffect(() => {
    if (members && members.length > 0) {
      setExpandedNodes((prev) => {
        const updated = { ...prev };
        members.forEach((m) => {
          const idStr = getNormId(m.id);
          if (idStr && updated[idStr] === undefined) {
            updated[idStr] = true;
          }
        });
        return updated;
      });
    }
  }, [members]);

  const toggleNode = (id) => {
    const idStr = getNormId(id);
    if (!idStr) return;
    setExpandedNodes((prev) => ({
      ...prev,
      [idStr]: !prev[idStr],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    members.forEach((m) => {
      const idStr = getNormId(m.id);
      if (idStr) allExpanded[idStr] = true;
    });
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    const rootIdSet = new Set(rootMembers.map((r) => getNormId(r.id)).filter(Boolean));
    const collapsed = {};
    members.forEach((m) => {
      const idStr = getNormId(m.id);
      if (idStr) collapsed[idStr] = rootIdSet.has(idStr);
    });
    setExpandedNodes(collapsed);
  };

  // Build member ID set for root lookup
  const memberIdSet = useMemo(() => {
    const set = new Set();
    members.forEach((m) => {
      const idStr = getNormId(m.id);
      if (idStr) set.add(idStr);
    });
    return set;
  }, [members]);

  // Find root nodes (no parent sponsor or sponsor not in active downline view)
  const rootMembers = useMemo(() => {
    return members.filter((m) => {
      const parentId =
        getNormId(m.sponsorId) ||
        getNormId(m.referrerId) ||
        getNormId(m.referrer_id) ||
        getNormId(m.sponsor_id);
      return !parentId || !memberIdSet.has(parentId);
    });
  }, [members, memberIdSet]);

  // Build robust children lookup map supporting string & number IDs + sponsorId & referrerId
  const childrenMap = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      const parentId =
        getNormId(m.sponsorId) ||
        getNormId(m.referrerId) ||
        getNormId(m.referrer_id) ||
        getNormId(m.sponsor_id);

      if (parentId) {
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(m);
      }
    });
    return map;
  }, [members]);

  // Search Node
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const matchedMember = members.find(
      (m) =>
        getNormId(m.id) === query ||
        (m.name && m.name.toLowerCase().includes(query)) ||
        (m.username && m.username.toLowerCase().includes(query)) ||
        (m.referralCode && m.referralCode.toLowerCase() === query)
    );

    if (matchedMember) {
      const targetIdStr = getNormId(matchedMember.id);
      setHighlightedId(targetIdStr);
      // Expand path to target node
      setExpandedNodes((prev) => {
        const updated = { ...prev };
        let curr = matchedMember;
        while (curr) {
          const currIdStr = getNormId(curr.id);
          if (currIdStr) updated[currIdStr] = true;
          const pId =
            getNormId(curr.sponsorId) ||
            getNormId(curr.referrerId) ||
            getNormId(curr.referrer_id) ||
            getNormId(curr.sponsor_id);
          curr = members.find((m) => getNormId(m.id) === pId);
        }
        return updated;
      });
    } else {
      setHighlightedId(null);
      setBlockadeAlert({
        open: true,
        targetId: searchQuery,
        reason: `Node "${searchQuery}" was not found in your authorized downline network branch. Upline sponsors and cross-branch nodes are strictly blockaded.`,
      });
    }
  };

  // ORG CHART LAYOUT CALCULATOR: Depth-first X placement, vertical Y generation levels
  const layoutData = useMemo(() => {
    if (rootMembers.length === 0) return null;

    const coords = {};
    let leafCount = 0;
    const CARD_WIDTH = 340;
    const CARD_HEIGHT = 104;
    const LEVEL_HEIGHT = 210;
    const LEFT_RAIL_WIDTH = 250; // Fixed width of sticky left level summary sidebar rail

    const traverse = (node, level) => {
      const nodeIdStr = getNormId(node.id);
      const children = childrenMap[nodeIdStr] || [];
      const isExpanded = expandedNodes[nodeIdStr] !== false; // default true
      const visibleChildren = isExpanded ? children : [];

      const nodeLayout = {
        id: nodeIdStr,
        member: node,
        level: level,
        y: 40 + level * LEVEL_HEIGHT,
        x: 0,
        hasChildren: children.length > 0,
        directCount: children.length,
        isExpanded: isExpanded,
        children: [],
      };

      coords[nodeIdStr] = nodeLayout;

      if (visibleChildren.length === 0) {
        nodeLayout.x = LEFT_RAIL_WIDTH + 30 + leafCount * (CARD_WIDTH + 30);
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
      maxLevel: maxLevel,
      cardWidth: CARD_WIDTH,
      cardHeight: CARD_HEIGHT,
      levelHeight: LEVEL_HEIGHT,
      leftRailWidth: LEFT_RAIL_WIDTH,
      canvasWidth: Math.max(LEFT_RAIL_WIDTH + 30 + leafCount * (CARD_WIDTH + 30) + 60, 1100),
      canvasHeight: (maxLevel + 1) * LEVEL_HEIGHT + 80,
    };
  }, [rootMembers, childrenMap, expandedNodes]);

  // Aggregate stats per level depth for Left Level Sidebar Cards
  const levelStatsMap = useMemo(() => {
    if (!layoutData || !layoutData.coords) return {};
    const map = {};
    Object.values(layoutData.coords).forEach((node) => {
      const lvl = node.level;
      if (!map[lvl]) {
        map[lvl] = { count: 0, directCountSum: 0 };
      }
      map[lvl].count += 1;
      map[lvl].directCountSum += node.directCount;
    });
    return map;
  }, [layoutData]);

  // Compute SVG Bezier connectors between all parents and visible children
  const connectors = useMemo(() => {
    if (!layoutData) return [];

    const list = [];
    const { cardWidth, cardHeight } = layoutData;

    Object.values(layoutData.coords).forEach((parentLayout) => {
      const children = parentLayout.children || [];
      children.forEach((childLayout) => {
        const startX = parentLayout.x + cardWidth / 2;
        const startY = parentLayout.y + cardHeight;
        const endX = childLayout.x + cardWidth / 2;
        const endY = childLayout.y;

        const cp1X = startX;
        const cp1Y = startY + 55;
        const cp2X = endX;
        const cp2Y = endY - 55;

        const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        list.push({
          id: `${parentLayout.id}-${childLayout.id}`,
          startX,
          startY,
          endX,
          endY,
          d: pathD,
        });
      });
    });
    return list;
  }, [layoutData]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 3.5 },
        bgcolor: '#F8FAFC',
        borderRadius: 3.5,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Header Bar & Control Panel */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
          pb: 2.5,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#064E3B', color: '#FBBF24', width: 44, height: 44 }}>
            <AccountTreeIcon />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#022C22', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                Unilevel Member Hierarchy
              </Typography>
              <Chip
                label="Interactive Tree"
                color="success"
                size="small"
                icon={<SecurityIcon />}
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, borderRadius: 1.5 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Neatly structured multi-level sponsor hierarchy with active downline connecting lines
            </Typography>
          </Box>
        </Box>

        {/* Toolbar & Search Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: '#FFFFFF' }}>
            <Tooltip title="Expand All Nodes">
              <Button onClick={expandAll} color="secondary">
                <UnfoldMoreIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Collapse All Nodes">
              <Button onClick={collapseAll} color="secondary">
                <UnfoldLessIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                disabled={zoomLevel <= 0.6}
              >
                <ZoomOutIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Zoom In">
              <Button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                disabled={zoomLevel >= 1.4}
              >
                <ZoomInIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Reset View Scale">
              <Button onClick={() => setZoomLevel(1)}>
                <RestartAltIcon fontSize="small" />
              </Button>
            </Tooltip>
          </ButtonGroup>

          <form onSubmit={handleSearchNode} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search Username / Name / Code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="small"
              sx={{ px: 2, height: 40, fontWeight: 700 }}
            >
              Search
            </Button>
          </form>
        </Box>
      </Box>

      {rootMembers.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            borderColor: '#E2E8F0',
          }}
        >
          <AccountTreeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
            No Downline Members Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register new referrals to build and visualize your Unilevel network tree structure.
          </Typography>
        </Paper>
      ) : (
        /* ================= ORG CHART CANVAS ================= */
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 650,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 3,
            position: 'relative',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          {layoutData && (
            <Box
              sx={{
                width: layoutData.canvasWidth * zoomLevel,
                height: layoutData.canvasHeight * zoomLevel,
                position: 'relative',
                transformOrigin: '0 0',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
                p: 2,
              }}
            >
              {/* Horizontal Swimlane Row Bands per Level */}
              {Array.from({ length: layoutData.maxLevel + 1 }).map((_, levelIdx) => (
                <Box
                  key={`level-band-${levelIdx}`}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 40 + levelIdx * layoutData.levelHeight - 12,
                    width: layoutData.canvasWidth,
                    height: layoutData.cardHeight + 24,
                    bgcolor: levelIdx % 2 === 0 ? 'rgba(248, 250, 252, 0.75)' : 'rgba(240, 253, 244, 0.45)',
                    borderTop: '1px dashed #E2E8F0',
                    borderBottom: '1px dashed #E2E8F0',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              ))}

              {/* Left Level Summary Sidebar Rail */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 12,
                  top: 0,
                  width: layoutData.leftRailWidth - 12,
                  height: layoutData.canvasHeight,
                  zIndex: 10,
                  pointerEvents: 'auto',
                }}
              >
                {/* Level Cards Anchored Vertically to Each Generation Depth */}
                {Array.from({ length: layoutData.maxLevel + 1 }).map((_, levelIdx) => {
                  const stats = levelStatsMap[levelIdx] || { count: 0, directCountSum: 0 };
                  const isRoot = levelIdx === 0;

                  return (
                    <Box
                      key={`level-card-${levelIdx}`}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 40 + levelIdx * layoutData.levelHeight,
                        width: '100%',
                        height: layoutData.cardHeight,
                        bgcolor: '#FFFFFF',
                        borderRadius: 2.5,
                        border: '1px solid #E2E8F0',
                        borderLeft: `6px solid ${isRoot ? '#064E3B' : '#059669'}`,
                        boxShadow: '0 4px 14px rgba(6,78,59,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        p: 1.5,
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(6,78,59,0.14)',
                          borderColor: '#059669',
                        },
                      }}
                    >
                      {/* Top Header Tag */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={isRoot ? 'LEVEL 0 • ROOT' : levelIdx === 1 ? 'LEVEL 1 • DIRECTS' : `LEVEL ${levelIdx} • GEN ${levelIdx}`}
                          size="small"
                          sx={{
                            bgcolor: isRoot ? '#064E3B' : '#047857',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            height: 20,
                            borderRadius: 1,
                          }}
                        />
                        <Chip
                          icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                          label={`${stats.count} Member${stats.count > 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            bgcolor: '#ECFDF5',
                            color: '#065F46',
                            fontWeight: 800,
                            fontSize: '0.66rem',
                            height: 20,
                            border: '1px solid #A7F3D0',
                          }}
                        />
                      </Box>

                      {/* Middle Description */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A', lineHeight: 1.2 }}>
                          {isRoot ? 'Root Sponsor Node' : levelIdx === 1 ? 'Direct Referrals' : `Generation ${levelIdx} Branch`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                          {isRoot ? 'Network Upline Root' : `${stats.count} downline member${stats.count > 1 ? 's' : ''} in level`}
                        </Typography>
                      </Box>

                      {/* Bottom Footer Ribbon */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          pt: 0.5,
                          borderTop: '1px dashed #F1F5F9',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.64rem', color: '#059669', fontWeight: 700 }}>
                          {isRoot ? 'Level Active' : `Downline Tier ${levelIdx}`}
                        </Typography>
                        <Chip
                          label={`Tier ${levelIdx}`}
                          size="small"
                          sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569' }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* SVG Connector Lines Canvas for Downline Connections */}
              <svg
                width={layoutData.canvasWidth}
                height={layoutData.canvasHeight}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 2 }}
              >
                {connectors.map((c) => (
                  <g key={c.id}>
                    {/* Solid Emerald Downline Connector Line */}
                    <path
                      d={c.d}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{ transition: 'all 0.3s ease-in-out' }}
                    />
                    {/* Anchor Circle at Parent Bottom */}
                    <circle cx={c.startX} cy={c.startY} r="4.5" fill="#064E3B" stroke="#FFFFFF" strokeWidth="1.5" />
                    {/* Anchor Circle at Child Top */}
                    <circle cx={c.endX} cy={c.endY} r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>
                ))}
              </svg>

              {/* Absolute Positioned Member Node Cards */}
              {Object.values(layoutData.coords).map((node) => {
                const member = node.member;
                const memberIdStr = getNormId(member.id);
                const isHighlighted = highlightedId === memberIdStr;

                // Username formatting
                const rawUsername = member.username || member.user_name;
                const displayUsername = rawUsername
                  ? `@${rawUsername.replace(/^@/, '')}`
                  : `@${(member.referralCode || member.name || 'member').toLowerCase().replace(/\s+/g, '')}`;

                return (
                  <Box
                    key={node.id}
                    sx={{
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: layoutData.cardWidth,
                      height: layoutData.cardHeight,
                      zIndex: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Paper
                      elevation={isHighlighted ? 6 : 1}
                      sx={{
                        p: 1.5,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        bgcolor: isHighlighted ? '#FEF3C7' : '#FFFFFF',
                        borderColor: isHighlighted
                          ? '#D97706'
                          : node.hasChildren
                          ? '#059669'
                          : '#E2E8F0',
                        borderWidth: isHighlighted ? 2 : 1,
                        borderStyle: 'solid',
                        borderLeft: `5px solid ${
                          isHighlighted
                            ? '#D97706'
                            : node.level === 0
                            ? '#064E3B'
                            : node.hasChildren
                            ? '#059669'
                            : '#D97706'
                        }`,
                        borderRadius: 2.5,
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 8px 20px rgba(6,78,59,0.12)',
                          transform: 'translateY(-3px)',
                          borderColor: '#059669',
                        },
                      }}
                    >
                      {/* Top Header: Avatar + Full Name & @username handle */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar
                          src={member.profilePhoto || member.profile_photo || member.avatarUrl || member.avatar || null}
                          sx={{
                            bgcolor: node.level === 0 ? '#064E3B' : node.hasChildren ? '#047857' : '#D97706',
                            color: '#FFFFFF',
                            width: 40,
                            height: 40,
                            fontWeight: 800,
                            fontSize: '1rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          }}
                        >
                          {member.name ? member.name.charAt(0).toUpperCase() : <PersonIcon />}
                        </Avatar>

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          {/* Full Name Display */}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              color: '#0F172A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.2,
                            }}
                            title={member.name}
                          >
                            {member.name}
                          </Typography>

                          {/* Username Handle Display */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                            <AlternateEmailIcon sx={{ fontSize: 12, color: '#059669' }} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                color: '#059669',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={displayUsername}
                            >
                              {displayUsername}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Direct Downlines Count Badge */}
                        {node.hasChildren && (
                          <Tooltip title={`${node.directCount} Direct Downline Referrals`}>
                            <Chip
                              icon={<GroupsIcon sx={{ fontSize: '13px !important' }} />}
                              label={`${node.directCount}`}
                              size="small"
                              sx={{
                                bgcolor: '#ECFDF5',
                                color: '#065F46',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                height: 22,
                                borderColor: '#A7F3D0',
                                border: '1px solid #A7F3D0',
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>

                      {/* Bottom Footer Metadata: Member Code, Email, Joined Date */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          pt: 0.75,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Chip
                            label={member.referralCode || `ID:${member.id}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              bgcolor: '#F1F5F9',
                              color: '#334155',
                            }}
                          />
                          <Tooltip title={member.email || 'No email attached'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 0 }}>
                              <EmailIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.66rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 110,
                                }}
                              >
                                {member.email}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                          <CalendarTodayIcon sx={{ fontSize: 10, color: '#94A3B8' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.64rem' }}>
                            {member.joinedDate || 'Active'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Expand/Collapse Chevron Button */}
                    {node.hasChildren && (
                      <IconButton
                        size="small"
                        onClick={() => toggleNode(member.id)}
                        sx={{
                          position: 'absolute',
                          bottom: -14,
                          left: layoutData.cardWidth / 2 - 14,
                          bgcolor: '#FFFFFF',
                          border: '1.5px solid #059669',
                          color: '#059669',
                          width: 28,
                          height: 28,
                          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                          zIndex: 5,
                          '&:hover': { bgcolor: '#ECFDF5', transform: 'scale(1.1)' },
                          transition: 'all 0.2s',
                        }}
                      >
                        {node.isExpanded ? (
                          <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Security Blockade Alert Dialog */}
      <Dialog
        open={blockadeAlert.open}
        onClose={() => setBlockadeAlert({ open: false, targetId: '', reason: '' })}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#FEF2F2',
            borderBottom: '1px solid #FCA5A5',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2,
          }}
        >
          <BlockIcon sx={{ fontSize: 26, color: '#DC2626' }} />
          <Typography variant="subtitle1" fontWeight={800}>
            Access Blockade Enforced
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="error" icon={<SecurityIcon />} sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Network Isolation Policy Active</strong>
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            {blockadeAlert.reason}
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 1.5, bgcolor: '#FAF9F6', borderRadius: 2, border: '1px dashed #CBD5E1' }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Security Policy:
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
            Acknowledge Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UnilevelTree;
