# sui-rpc-monitor

This is a Sui RPC Node Monitor project - a real-time web-based monitoring tool that continuously tests and evaluates Sui blockchain RPC nodes for stability, response time, and performance.

## Features

- 🔐 **Authentication System** - Secure login with password protection
- 🗄️ **PostgreSQL Database** - Dynamic node management with CRUD operations
- 📊 **Real-time Monitoring** - Live status updates every 500ms
- ⚙️ **Admin Dashboard** - Web interface for managing RPC nodes
- 📈 **Historical Metrics** - Store and analyze node performance over time
- 🌐 **RESTful API** - Complete API for node management

## Authentication

Default login credentials:
- **Username**: `admin`
- **Password**: `admin123`

## Development

```bash
# Install dependencies
bun install

# Setup PostgreSQL database
createdb sui_monitor
bun run db:init

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

## Ubuntu Deployment Guide

### For Production Deployment

Use `bun start` with proper build process. For development mode, see the "Development Mode on Server" section below.

### Prerequisites

1. Ubuntu server (20.04 or later)
2. Node.js 23.3.0 installed (via nvm)
3. Bun installed globally
4. PostgreSQL installed and running

### Installation Steps

1. **Clone the repository**
```bash
cd /home/ubuntu
git clone <your-repo-url> rpc-space
cd rpc-space
```

2. **Install dependencies and setup database**
```bash
# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install dependencies
bun install

# Setup PostgreSQL database
sudo -u postgres createdb sui_monitor
sudo -u postgres psql -c "CREATE USER agg WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sui_monitor TO agg;"

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database schema
bun run db:init

# Build the application (REQUIRED before starting)
bun run build
```

3. **Create systemd service file**

Create `/etc/systemd/system/sui-rpc-monitor.service`:

```ini
[Unit]
Description=Sui RPC Monitor Next.js App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/rpc-space
ExecStart=/home/ubuntu/.bun/bin/bun dev
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sui-rpc-monitor
Environment="NODE_ENV=development"
Environment="PORT=3000"
Environment="NEXT_TELEMETRY_DISABLED=1"

[Install]
WantedBy=multi-user.target
```

4. **Enable and start the service**
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable sui-rpc-monitor

# Start the service
sudo systemctl start sui-rpc-monitor

# Check service status
sudo systemctl status sui-rpc-monitor
```

5. **View logs**
```bash
# View recent logs
sudo journalctl -u sui-rpc-monitor -n 50

# Follow logs in real-time
sudo journalctl -u sui-rpc-monitor -f
```

### Accessing the Application

Once started, the application will be available at:
```
http://your-server-ip:3000
```

### Service Management Commands

```bash
# Stop the service
sudo systemctl stop sui-rpc-monitor

# Restart the service
sudo systemctl restart sui-rpc-monitor

# View full logs
sudo journalctl -u sui-rpc-monitor

# Disable service from starting on boot
sudo systemctl disable sui-rpc-monitor
```

### Firewall Configuration

If using UFW firewall:
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Development Mode on Server

If you need to run in development mode (NOT recommended for production):

1. **Create development systemd service**

Create `/etc/systemd/system/sui-rpc-monitor-dev.service`:

```ini
[Unit]
Description=Sui RPC Monitor Next.js App (Dev Mode)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/rpc-space
ExecStart=/home/ubuntu/.bun/bin/bun dev
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sui-rpc-monitor-dev
Environment="NODE_ENV=development"
Environment="PORT=3000"
Environment="NEXT_TELEMETRY_DISABLED=1"

[Install]
WantedBy=multi-user.target
```

2. **Start development service**
```bash
sudo systemctl daemon-reload
sudo systemctl start sui-rpc-monitor-dev
sudo systemctl status sui-rpc-monitor-dev
```

### Alternative: Using PM2

If you prefer PM2 over systemd:

```bash
# Install PM2 globally
bun install -g pm2

# Start the application
pm2 start "bun start" --name sui-rpc-monitor

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `DELETE /api/auth/login` - Logout

### Node Management
- `GET /api/nodes` - Get all nodes
- `POST /api/nodes` - Create new node
- `GET /api/nodes/[id]` - Get specific node
- `PUT /api/nodes/[id]` - Update node
- `DELETE /api/nodes/[id]` - Delete node
- `GET /api/nodes/[id]/metrics` - Get historical metrics

### Monitoring
- `GET /api/monitor` - Real-time monitoring stream (SSE)
- `GET /api/health` - Health check endpoint

## Database Schema

### Tables
- `users` - Authentication users
- `sui_nodes` - RPC node configurations
- `node_metrics` - Historical monitoring data

### Environment Variables

Required:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - Authentication secret

Optional:
- `MONITORING_INTERVAL` - Monitoring frequency (default: 500ms)
- `RPC_REQUEST_TIMEOUT` - Request timeout (default: 5000ms)
- `USE_CUSTOM_RPC_NODES` - Use env nodes as fallback (default: false)
