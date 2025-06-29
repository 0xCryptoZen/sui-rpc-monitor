'use client';

import { MonitoringResult, RPCNode } from '@/app/types';
import { NodeCard } from './NodeCard';
import { Grid, Box, CircularProgress, Typography, Paper } from '@mui/material';

interface StatusGridProps {
  results: MonitoringResult[];
  bestNode: RPCNode | null;
}

export function StatusGrid({ results, bestNode }: StatusGridProps) {
  if (results.length === 0) {
    return (
      <Paper 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 300,
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Active Nodes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No RPC nodes are currently being monitored.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add nodes in the <strong>Admin Panel</strong> to start monitoring.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {results.map(result => (
        <Grid item xs={12} sm={6} lg={4} key={result.node.id}>
          <NodeCard 
            result={result} 
            isBest={result.node.id === bestNode?.id}
          />
        </Grid>
      ))}
    </Grid>
  );
}