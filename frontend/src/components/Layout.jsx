import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import { logout } from '../store/actions';
import { ProfileModal } from './ProfileModal';
import TermsAndConditionsModal from './TermsAndConditionsModal';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Check if member has accepted terms
  const [mandatoryTermsOpen, setMandatoryTermsOpen] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      const accepted = localStorage.getItem(`terms_accepted_${user.id}`);
      if (!accepted) {
        setMandatoryTermsOpen(true);
      } else {
        setMandatoryTermsOpen(false);
      }
    }
  }, [user]);

  const handleAcceptMandatoryTerms = () => {
    if (user && user.id) {
      localStorage.setItem(`terms_accepted_${user.id}`, 'true');
    }
    setMandatoryTermsOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const isAdmin = user?.role === 'Admin';

  // Menu items configured with authorized roles
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['Admin', 'Member'] },
    { text: isAdmin ? 'Member Directory' : 'My Downline', icon: <PeopleIcon />, path: '/members', roles: ['Admin', 'Member'] },
    { text: 'Commission Engine', icon: <SettingsSuggestIcon />, path: '/commission-engine', roles: ['Admin'] },
    { text: isAdmin ? 'Repurchase Panel' : 'My Purchases', icon: <ShoppingCartIcon />, path: '/repurchase', roles: ['Admin', 'Member'] },
    { text: isAdmin ? 'Payout Console' : 'My Payouts', icon: <AccountBalanceIcon />, path: '/payouts', roles: ['Admin', 'Member'] },
    { text: isAdmin ? 'Commission Ledger' : 'My Earnings', icon: <MonetizationOnIcon />, path: '/commissions', roles: ['Admin', 'Member'] },
  ];

  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.dark', color: 'white' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/favicon.svg" alt="AAKASH E MART Logo" sx={{ width: 32, height: 32, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, color: 'secondary.light', letterSpacing: '0.5px', fontSize: '1.05rem' }}>
            AAKASH E MART
          </Typography>
        </Box>
        <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'white', display: { sm: 'none' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'secondary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive ? 'secondary.main' : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} slotProps={{ primary: { fontSize: '0.92rem', fontWeight: isActive ? 600 : 500 } }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Policy Links at Sidebar Bottom */}
      <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <List disablePadding>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate('/privacy-policy');
                setMobileOpen(false);
              }}
              sx={{ py: 0.5, px: 1, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              <ListItemIcon sx={{ color: '#FBBF24', minWidth: 32 }}>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Privacy Policy"
                slotProps={{ primary: { fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' } }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate('/terms-and-conditions');
                setMobileOpen(false);
              }}
              sx={{ py: 0.5, px: 1, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              <ListItemIcon sx={{ color: '#FBBF24', minWidth: 32 }}>
                <GavelIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Terms & Conditions"
                slotProps={{ primary: { fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Profile Footer Info & Edit Trigger */}
      <Box 
        onClick={() => setProfileOpen(true)}
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Avatar
            src={
              user?.profilePhoto
                ? user.profilePhoto.startsWith('http')
                  ? user.profilePhoto
                  : `http://localhost:3000${user.profilePhoto}`
                : undefined
            }
            sx={{
              bgcolor: 'secondary.main',
              width: 38,
              height: 38,
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
              border: user?.profilePhoto ? '1.5px solid #FBBF24' : 'none',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Edit Profile & UPI Settings">
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Header AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {location.pathname === '/' ? 'Dashboard' : location.pathname === '/profile' ? 'Profile & UPI Settings' : menuItems.find(item => item.path === location.pathname)?.text || 'Portal'}
          </Typography>

          {/* Top Right Corner Controls: Logout & Access Badge */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
              <Chip
                label={user.role === 'Admin' ? 'Admin Access' : 'Member Access'}
                color={user.role === 'Admin' ? 'primary' : 'secondary'}
                size="small"
                sx={{ fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
              />

              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ fontWeight: 700, px: { xs: 1.2, sm: 2 }, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawers */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #E2E8F0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Core Main Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100vw',
          overflowX: 'hidden',
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: { xs: 9, sm: 11 },
        }}
      >
        {children}
      </Box>

      {/* Profile & UPI Modal */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Mandatory Terms & Conditions Modal upon Login */}
      <TermsAndConditionsModal
        open={mandatoryTermsOpen}
        mandatory={true}
        onAccept={handleAcceptMandatoryTerms}
      />
    </Box>
  );
};

export default Layout;
