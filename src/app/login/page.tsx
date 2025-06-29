'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Fade,
  Slide,
  useTheme,
} from '@mui/material';
import {
  AccountCircle,
  Lock,
  Visibility,
  VisibilityOff,
  LightMode,
  DarkMode,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '@/app/components/ThemeProvider';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0F1419 0%, #1F2937 50%, #374151 100%)'
          : 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%234DA2FF" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'float 20s infinite linear',
        },
      }}
    >
      <Container maxWidth="sm">
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={800}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: isDarkMode 
                ? 'rgba(31, 41, 55, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                py: 4,
                px: 3,
                position: 'relative',
                textAlign: 'center',
              }}
            >
              <IconButton
                sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}
                onClick={toggleTheme}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
              
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '2rem',
                }}
              >
                <LoginIcon sx={{ fontSize: '2rem' }} />
              </Avatar>
              
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Sui RPC Monitor
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Real-time blockchain node monitoring
              </Typography>
            </Box>

            {/* Content */}
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  textAlign="center" 
                  fontWeight="600"
                  sx={{ mb: 3 }}
                >
                  Welcome Back
                </Typography>

                <Fade in={!!error} timeout={300}>
                  <Box sx={{ mb: 2 }}>
                    {error && (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </Box>
                </Fade>

                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <AccountCircle sx={{ color: 'action.active', mr: 1 }} />
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: (
                      <Lock sx={{ color: 'action.active', mr: 1 }} />
                    ),
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    mb: 3,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2,
                    background: isDarkMode 
                      ? 'rgba(55, 65, 81, 0.5)' 
                      : 'rgba(243, 244, 246, 0.5)',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center" gutterBottom>
                      Default Credentials
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        <strong>Username:</strong> admin
                      </Typography>
                      <Typography variant="body2">
                        <strong>Password:</strong> admin123
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </CardContent>
          </Paper>
        </Slide>
      </Container>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}