"use client";
import React from 'react';
import { Box, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter, usePathname } from 'next/navigation';
import { PRIMARY_COLOR, SECONDARY_COLOR } from './colors';
import ScienceIcon from '@mui/icons-material/Science';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SecurityIcon from '@mui/icons-material/Security';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface NavbarProps {
  handleLogout?: () => void;
  activePage?: string;
}

type NavItem = {
  label: string;
  path: string;
  id: string;
};

const navItems: NavItem[] = [
  { label: 'Home', path: '/homepage', id: 'home' },
  { label: 'Github Insights', path: '/github-insights', id: 'github-insights' },
  { label: 'Health & Quality', path: '/health-quality', id: 'health-quality' },
  { label: 'Security & Threats', path: '/security-threats', id: 'security-threats' },
  // FAQ will be rendered after Testing Tools
];

const navIcons: Record<string, React.ReactNode> = {
  home: <HomeIcon fontSize="small" />,
  'github-insights': <BarChartIcon fontSize="small" />,
  'health-quality': <FavoriteIcon fontSize="small" />,
  'security-threats': <SecurityIcon fontSize="small" />,
  faq: <HelpOutlineIcon fontSize="small" />,
};

export default function Navbar({ handleLogout }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: 48,
        py: 0,
        px: { xs: 3, sm: 8 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Box
              key={item.id}
              sx={{
                height: 32,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 16,
                background: isActive 
                  ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
                  : 'transparent',
                boxShadow: isActive 
                  ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.1)'
                  : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: isActive 
                    ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
                    : 'rgba(30, 41, 59, 0.08)',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  boxShadow: isActive 
                    ? '0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.15)'
                    : 'none',
                },
              }}
            >
              <Button
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: isActive ? 'white' : 'rgba(30, 41, 59, 0.85)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  px: 2.5,
                  height: '100%',
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  opacity: 1,
                  '&:hover': {
                    opacity: 1,
                  },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: isActive ? 0.5 : 0 }}>
                  {navIcons[item.id]}
                </Box>
                {isActive && (
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.label}</span>
                )}
              </Button>
            </Box>
          );
        })}
        <Box
          sx={{
            height: 32,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 16,
            background: pathname === '/testing-tools'
              ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
              : 'transparent',
            boxShadow: pathname === '/testing-tools'
              ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.1)'
              : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: pathname === '/testing-tools'
                ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
                : 'rgba(30, 41, 59, 0.08)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Button
            onClick={() => handleNavigation('/testing-tools')}
            sx={{
              color: pathname === '/testing-tools' ? 'white' : 'rgba(30, 41, 59, 0.85)',
              fontWeight: 500,
              fontSize: '0.95rem',
              textTransform: 'none',
              px: 2.5,
              height: '100%',
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
              opacity: 1,
              '&:hover': {
                opacity: 1,
              },
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: pathname === '/testing-tools' ? 0.5 : 0 }}>
              <ScienceIcon fontSize="small" />
            </Box>
            {pathname === '/testing-tools' && (
              <span style={{ display: 'flex', alignItems: 'center' }}>Testing Tools</span>
            )}
          </Button>
        </Box>
        {/* Render FAQ after Testing Tools */}
        <Box
          key="faq"
          sx={{
            height: 32,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 16,
            background: pathname === '/faq'
              ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
              : 'transparent',
            boxShadow: pathname === '/faq'
              ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.1)'
              : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: pathname === '/faq'
                ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`
                : 'rgba(30, 41, 59, 0.08)',
              transform: pathname === '/faq' ? 'translateY(-1px)' : 'none',
              boxShadow: pathname === '/faq'
                ? '0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.15)'
                : 'none',
            },
          }}
        >
          <Button
            onClick={() => handleNavigation('/faq')}
            sx={{
              color: pathname === '/faq' ? 'white' : 'rgba(30, 41, 59, 0.85)',
              fontWeight: 500,
              fontSize: '0.95rem',
              textTransform: 'none',
              px: 2.5,
              height: '100%',
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
              opacity: 1,
              '&:hover': {
                opacity: 1,
              },
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: pathname === '/faq' ? 0.5 : 0 }}>
              {navIcons['faq']}
            </Box>
            {pathname === '/faq' && (
              <span style={{ display: 'flex', alignItems: 'center' }}>FAQ</span>
            )}
          </Button>
        </Box>
      </Box>
      <Button 
        sx={{ 
          color: 'rgba(30, 41, 59, 0.85)', 
          fontWeight: 500,
          fontSize: '0.95rem',
          textTransform: 'none',
          height: 32,
          borderRadius: 16,
          px: 2.5,
          opacity: 1,
          background: 'transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%) !important`,
            color: 'white !important',
            '& .MuiSvgIcon-root': {
              color: 'white !important',
            },
            opacity: 1,
            transform: 'translateY(-1px)',
          },
        }} 
        endIcon={<LogoutIcon sx={{ fontSize: '1.1rem', color: 'inherit', transition: 'color 0.2s' }} />} 
        onClick={handleLogout}
      >
        Log Out
      </Button>
    </Box>
  );
} 