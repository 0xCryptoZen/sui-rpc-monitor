-- Database schema for Sui RPC Monitor
-- PostgreSQL schema definition

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sui nodes table for dynamic node management
CREATE TABLE IF NOT EXISTS sui_nodes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    region VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Node metrics table for historical monitoring data
CREATE TABLE IF NOT EXISTS node_metrics (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(50) REFERENCES sui_nodes(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER NOT NULL,
    is_healthy BOOLEAN NOT NULL,
    error_rate DECIMAL(5,2) DEFAULT 0,
    stability_score DECIMAL(5,2) DEFAULT 0,
    last_error TEXT,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_node_metrics_node_id ON node_metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_node_metrics_timestamp ON node_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_sui_nodes_active ON sui_nodes(is_active);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (username, password_hash) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Insert default nodes from the original configuration
INSERT INTO sui_nodes (id, name, url, region, provider) VALUES
('mainnet-1', 'Sui Mainnet Official', 'https://fullnode.mainnet.sui.io:443', 'Global', 'Mysten Labs'),
('mainnet-2', 'Sui Mainnet US', 'https://sui-mainnet-us-1.cosmostation.io', 'US', 'Cosmostation'),
('mainnet-3', 'Sui Mainnet EU', 'https://sui-mainnet-eu-1.cosmostation.io', 'EU', 'Cosmostation'),
('mainnet-4', 'Sui Mainnet Asia', 'https://sui-mainnet-asia-1.cosmostation.io', 'Asia', 'Cosmostation'),
('mainnet-5', 'Sui Public RPC', 'https://sui-rpc.publicnode.com', 'Global', 'PublicNode'),
('mainnet-6', 'Blast API Sui', 'https://sui-mainnet.public.blastapi.io', 'Global', 'Blast API')
ON CONFLICT (id) DO NOTHING;