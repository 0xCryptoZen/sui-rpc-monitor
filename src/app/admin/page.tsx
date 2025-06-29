'use client';

import { useState, useEffect, useCallback } from 'react';
import { DatabaseSuiNode, CreateSuiNodeData, UpdateSuiNodeData } from '@/app/lib/sui-nodes';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  Slide,
  Fade,
  CircularProgress,
  Link,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  Logout as LogoutIcon,
  Dashboard,
  CloudQueue as NodeIcon,
  Brightness4,
  Brightness7,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '@/app/components/ThemeProvider';

interface NodeFormData {
  id: string;
  name: string;
  url: string;
  region: string;
  provider: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function AdminPage() {
  const [nodes, setNodes] = useState<DatabaseSuiNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<DatabaseSuiNode | null>(null);
  const [formData, setFormData] = useState<NodeFormData>({
    id: '',
    name: '',
    url: '',
    region: '',
    provider: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/nodes');
      if (!response.ok) throw new Error('Failed to load nodes');
      const data = await response.json();
      setNodes(data);
    } catch (error) {
      showSnackbar('Failed to load nodes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Generate automatic node ID based on name and provider
  const generateNodeId = (name: string, provider: string): string => {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    
    const cleanProvider = provider.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const randomSuffix = Math.random().toString(36).substr(2, 4); // 4 char random string
    return `${cleanProvider}-${cleanName}-${randomSuffix}`;
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      url: '',
      region: '',
      provider: '',
    });
    setEditingNode(null);
    setShowForm(false);
  };

  const handleEdit = (node: DatabaseSuiNode) => {
    setEditingNode(node);
    setFormData({
      id: node.id,
      name: node.name,
      url: node.url,
      region: node.region,
      provider: node.provider,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingNode) {
        const updateData: UpdateSuiNodeData = {
          name: formData.name,
          url: formData.url,
          region: formData.region,
          provider: formData.provider,
        };

        const response = await fetch(`/api/nodes/${editingNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update node');
        }

        showSnackbar('Node updated successfully', 'success');
      } else {
        // Auto-generate ID for new nodes
        const autoId = generateNodeId(formData.name, formData.provider);
        const createData: CreateSuiNodeData = {
          id: autoId,
          name: formData.name,
          url: formData.url,
          region: formData.region,
          provider: formData.provider,
        };

        const response = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create node');
        }

        showSnackbar('Node created successfully', 'success');
      }

      resetForm();
      loadNodes();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete node');
      }

      showSnackbar('Node deleted successfully', 'success');
      loadNodes();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete node', 'error');
    }
  };

  const handleToggleActive = async (node: DatabaseSuiNode) => {
    try {
      const response = await fetch(`/api/nodes/${node.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !node.is_active }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update node status');
      }

      showSnackbar(`Node ${node.is_active ? 'deactivated' : 'activated'} successfully`, 'success');
      loadNodes();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Failed to update node status', 'error');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.id} • {params.row.provider}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'url',
      headerName: 'URL',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Link 
          href={params.value} 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          <LinkIcon sx={{ mr: 1, fontSize: '1rem' }} />
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Link>
      ),
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'error'}
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          key="toggle"
          icon={<PowerIcon />}
          label={params.row.is_active ? 'Deactivate' : 'Activate'}
          onClick={() => handleToggleActive(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
          showInMenu
        />,
      ],
    },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading nodes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <NodeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Node Administration
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            href="/"
            sx={{ mr: 2 }}
          >
            Monitor
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h4" color="primary">
                {nodes.length}
              </Typography>
              <Typography color="text.secondary">Total Nodes</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {nodes.filter(n => n.is_active).length}
              </Typography>
              <Typography color="text.secondary">Active Nodes</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {nodes.filter(n => !n.is_active).length}
              </Typography>
              <Typography color="text.secondary">Inactive Nodes</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Data Grid */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="600">
              RPC Nodes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {nodes.length === 0 && (
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/sync-nodes', { method: 'POST' });
                      const result = await response.json();
                      if (result.success) {
                        showSnackbar(`Added ${result.addedNodes} default nodes`, 'success');
                        loadNodes();
                      } else {
                        showSnackbar(result.error || 'Failed to add default nodes', 'error');
                      }
                    } catch (error) {
                      showSnackbar('Failed to add default nodes', 'error');
                    }
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Add Default Nodes
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                sx={{ borderRadius: 2 }}
              >
                Add Node
              </Button>
            </Box>
          </Box>

          {nodes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No RPC Nodes Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first node manually or import the default Sui RPC nodes to get started.
              </Typography>
            </Box>
          ) : (
            <DataGrid
            rows={nodes}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.grey[50],
                borderBottom: `2px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
            />
          )}
        </Paper>
      </Container>

      {/* Add/Edit Node FAB */}
      <Tooltip title="Add New Node">
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setShowForm(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Add/Edit Node Dialog */}
      <Dialog 
        open={showForm} 
        onClose={resetForm} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          {editingNode ? 'Edit Node' : 'Add New Node'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {editingNode && (
              <TextField
                fullWidth
                label="Node ID"
                value={formData.id}
                disabled
                margin="normal"
                helperText="Node ID cannot be changed"
              />
            )}
            {!editingNode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Node ID will be automatically generated based on name and provider
              </Alert>
            )}
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={formLoading}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              disabled={formLoading}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              disabled={formLoading}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              disabled={formLoading}
              required
              margin="normal"
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={resetForm} disabled={formLoading} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={formLoading}
              startIcon={formLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {editingNode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}