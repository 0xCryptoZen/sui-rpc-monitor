'use client';

import { useEffect, useState } from 'react';
import { MonitoringResult, RPCNode } from '@/app/types';
import { StatusGrid } from '@/app/components/StatusGrid';
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Brightness4,
  Brightness7,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
  TrendingUp,
  Speed,
  NetworkCheck,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '@/app/components/ThemeProvider';

export default function Dashboard() {
  const [nodeResults, setNodeResults] = useState<MonitoringResult[]>([]);
  const [bestNode, setBestNode] = useState<RPCNode | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { isDarkMode, toggleTheme } = useCustomTheme();

  useEffect(() => {
    const eventSource = new EventSource('/api/monitor');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const results = data.results as MonitoringResult[];
        
        setNodeResults(results);
        setLastUpdate(new Date());

        // Find best node
        const best = results.find(r => r.isBest);
        setBestNode(best?.node || null);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const activeNodes = nodeResults.filter(r => r.metrics?.responseTime !== undefined).length;
  const avgResponseTime = nodeResults.length > 0 
    ? Math.round(nodeResults.reduce((sum, r) => sum + (r.metrics?.responseTime || 0), 0) / nodeResults.length)
    : 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <NetworkCheck sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sui RPC Monitor
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <Button
            color="inherit"
            startIcon={<AdminIcon />}
            href="/admin"
            sx={{ mr: 1 }}
          >
            Admin
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={async () => {
              try {
                await fetch('/api/auth/login', { method: 'DELETE' });
                window.location.href = '/login';
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                Real-time Node Monitoring
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Live monitoring of Sui blockchain RPC nodes for performance and reliability
              </Typography>
            </Box>
          </Box>

          {/* Connection Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircleIcon 
                sx={{ 
                  fontSize: 12, 
                  color: isConnected ? 'success.main' : 'error.main',
                  animation: 'pulse 2s infinite'
                }} 
              />
              <Typography variant="body2" color="text.secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
            
            {lastUpdate && (
              <Typography variant="body2" color="text.secondary">
                Last update: {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
            
            {bestNode && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Best node:
                </Typography>
                <Chip 
                  label={bestNode.name} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              </Box>
            )}
          </Box>

          {!isConnected && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Real-time connection lost. Attempting to reconnect...
            </Alert>
          )}
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <NetworkCheck color="primary" />
                  <Box>
                    <Typography variant="h4" color="primary">
                      {nodeResults.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Nodes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp color="success" />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {activeNodes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Nodes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Speed color="info" />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {avgResponseTime}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RefreshIcon color="warning" />
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      500ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update Interval
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Loading Progress */}
        {nodeResults.length === 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Loading node data...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Paper>
        )}

        {/* Main Content */}
        <StatusGrid results={nodeResults} bestNode={bestNode} />

        {/* Footer */}
        <Divider sx={{ my: 4 }} />
        <Typography 
          variant="body2" 
          color="text.secondary" 
          textAlign="center"
          sx={{ py: 2 }}
        >
          Monitoring {nodeResults.length} RPC nodes • Real-time updates every 500ms
        </Typography>
      </Container>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Box>
  );
}