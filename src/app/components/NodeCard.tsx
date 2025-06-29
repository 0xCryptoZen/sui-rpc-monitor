'use client';

import { MonitoringResult } from '@/app/types';
import { BestNodeBadge } from './BestNodeBadge';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Speed,
  TrendingUp,
  LocationOn,
  Business,
} from '@mui/icons-material';

interface NodeCardProps {
  result: MonitoringResult;
  isBest: boolean;
}

export function NodeCard({ result, isBest }: NodeCardProps) {
  const { node, metrics } = result;
  const theme = useTheme();
  
  const getStatusConfig = () => {
    if (!metrics.isHealthy) {
      return {
        color: 'error' as const,
        text: 'Offline',
        icon: <Error />,
        borderColor: theme.palette.error.main,
      };
    }
    if (metrics.errorRate > 10) {
      return {
        color: 'warning' as const,
        text: 'Degraded',
        icon: <Warning />,
        borderColor: theme.palette.warning.main,
      };
    }
    return {
      color: 'success' as const,
      text: 'Healthy',
      icon: <CheckCircle />,
      borderColor: theme.palette.success.main,
    };
  };

  const statusConfig = getStatusConfig();
  const stabilityPercentage = Math.min(100, Math.max(0, metrics.stabilityScore));

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        borderLeft: `4px solid ${statusConfig.borderColor}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        ...(isBest && {
          background: `linear-gradient(135deg, ${theme.palette.success.light}08 0%, ${theme.palette.success.main}15 100%)`,
          borderLeft: `4px solid ${theme.palette.success.main}`,
        }),
      }}
    >
      {isBest && <BestNodeBadge />}
      
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
            {node.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Business fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {node.provider}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {node.region}
            </Typography>
          </Box>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.text}
            color={statusConfig.color}
            variant="filled"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Metrics */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Response Time */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Response Time
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="500">
              {metrics.responseTime}ms
            </Typography>
          </Box>

          {/* Stability */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Stability
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="500">
                {metrics.stabilityScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stabilityPercentage}
              color={stabilityPercentage > 80 ? 'success' : stabilityPercentage > 60 ? 'warning' : 'error'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Error Rate */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Error Rate
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight="500"
              color={metrics.errorRate > 10 ? 'error.main' : 'text.primary'}
            >
              {metrics.errorRate.toFixed(1)}%
            </Typography>
          </Box>

          {/* Success/Error Count */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Success/Error
            </Typography>
            <Typography variant="body2" fontWeight="500">
              <span style={{ color: theme.palette.success.main }}>{metrics.successCount}</span>
              /
              <span style={{ color: theme.palette.error.main }}>{metrics.errorCount}</span>
            </Typography>
          </Box>
        </Box>

        {/* Last Error */}
        {metrics.lastError && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              <Typography variant="caption" component="div">
                <strong>Last error:</strong> {metrics.lastError}
              </Typography>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}