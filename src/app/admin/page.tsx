'use client';

import { useState, useEffect } from 'react';
import { DatabaseSuiNode, CreateSuiNodeData, UpdateSuiNodeData } from '@/app/lib/sui-nodes';

interface NodeFormData {
  id: string;
  name: string;
  url: string;
  region: string;
  provider: string;
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Failed to load nodes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
    setError('');
    setSuccess('');
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
    setError('');
    setSuccess('');

    try {
      if (editingNode) {
        // Update existing node
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

        setSuccess('Node updated successfully');
      } else {
        // Create new node
        const createData: CreateSuiNodeData = {
          id: formData.id,
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

        setSuccess('Node created successfully');
      }

      resetForm();
      loadNodes();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this node?')) return;

    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete node');
      }

      setSuccess('Node deleted successfully');
      loadNodes();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete node');
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

      setSuccess(`Node ${node.is_active ? 'deactivated' : 'activated'} successfully`);
      loadNodes();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update node status');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage Sui RPC nodes
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Monitor
            </a>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {showForm ? 'Cancel' : 'Add New Node'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingNode ? 'Edit Node' : 'Add New Node'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Node ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingNode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provider
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingNode ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Node
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {node.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {node.id} • {node.provider}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <a
                      href={node.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {node.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {node.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        node.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {node.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(node)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(node)}
                      className={
                        node.is_active
                          ? 'text-yellow-600 hover:text-yellow-900'
                          : 'text-green-600 hover:text-green-900'
                      }
                    >
                      {node.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nodes.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No nodes found. Add a new node to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}