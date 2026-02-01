// frontend/src/app/App.tsx
import React, { useEffect, useState } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Button, IconButton, 
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  useMediaQuery, useTheme, Container, Alert
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, 
  School as SchoolIcon, Assignment as AssignmentIcon,
  Assessment as AssessmentIcon, QuestionAnswer as QAICon,
  ExitToApp as LogoutIcon, Person as ProfileIcon,
  Notifications as NotificationsIcon, MenuBook as LecturesIcon
} from '@mui/icons-material';
import { api, getToken, clearToken, getCurrentUser } from '../api/client';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Lectures from '../pages/Lectures';
import Assignments from '../pages/Assignments';
import Homework from '../pages/Homework';
import Progress from '../pages/Progress';
import QA from '../pages/QA';
import Pronunciation from '../pages/Pronunciation';
import Footer from '../components/Footer';

// ==================== PROTECTED ROUTE ====================

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  const token = getToken();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          Bạn không có quyền truy cập trang này
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.href = '/dashboard'}
        >
          Về trang chủ
        </Button>
      </Box>
    );
  }
  
  return children;
};

// ==================== NAVIGATION DRAWER ====================

const NavigationDrawer: React.FC<{ 
  open: boolean; 
  onClose: () => void; 
  user: any;
}> = ({ open, onClose, user }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      roles: ['teacher', 'student']
    },
    { 
      text: 'Bài giảng', 
      icon: <SchoolIcon />, 
      path: '/lectures',
      roles: ['teacher', 'student']
    },
    { 
      text: 'Bài tập', 
      icon: <AssignmentIcon />, 
      path: '/assignments',
      roles: ['teacher', 'student']
    },
    { 
      text: 'Đề thi', 
      icon: <AssessmentIcon />, 
      path: '/exams',
      roles: ['teacher', 'student']
    },
    { 
      text: 'Bài tập về nhà', 
      icon: <LecturesIcon />, 
      path: '/homework',
      roles: ['student']
    },
    { 
      text: 'Tiến độ học tập', 
      icon: <AssessmentIcon />, 
      path: '/progress',
      roles: ['student']
    },
    { 
      text: 'Quản lý học viên', 
      icon: <PersonIcon />, 
      path: '/students',
      roles: ['teacher']
    },
    { 
      text: 'Hỏi đáp', 
      icon: <QAICon />, 
      path: '/qa',
      roles: ['teacher', 'student']
    },
    { 
      text: 'Phát âm', 
      icon: <VolumeUp />, 
      path: '/pronunciation',
      roles: ['teacher', 'student']
    },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{ 
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': { 
          width: 280,
          boxSizing: 'border-box',
          bgcolor: 'primary.main',
          color: 'white'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          English E-Learning
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
          Xin chào, {user?.username}
        </Typography>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />
      
      <List>
        {menuItems
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose();
              }}
              sx={{ 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            clearToken();
            window.location.href = '/login';
          }}
          startIcon={<LogoutIcon />}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.5)',
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.1)',
              borderColor: 'white'
            }
          }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Drawer>
  );
};

// ==================== MAIN APP ====================

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const token = getToken();
    const userData = getCurrentUser();
    
    if (token && userData) {
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="sticky" 
        sx={{ 
          bgcolor: 'primary.main',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            📚 English E-Learning System
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton color="inherit" size="small">
                <NotificationsIcon />
              </IconButton>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {user.username}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    clearToken();
                    window.location.href = '/login';
                  }}
                  startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': { borderColor: 'white' }
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      {user && (
        <NavigationDrawer 
          open={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          user={user} 
        />
      )}

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: isMobile ? 2 : 4, 
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/lectures" 
            element={
              <ProtectedRoute>
                <Lectures />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/assignments" 
            element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/homework" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Homework />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Progress />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/qa" 
            element={
              <ProtectedRoute>
                <QA />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/pronunciation" 
            element={
              <ProtectedRoute>
                <Pronunciation />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route 
            path="*" 
            element={
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="error" gutterBottom>
                  404 - Page Not Found
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Về trang chủ
                </Button>
              </Box>
            } 
          />
        </Routes>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}

// ==================== APP WRAPPER ====================

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}