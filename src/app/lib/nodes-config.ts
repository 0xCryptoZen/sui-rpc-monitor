import { RPCNode } from '@/app/types';

export const DEFAULT_RPC_NODES: RPCNode[] = [
  {
    id: 'mainnet-1',
    name: 'Sui Mainnet Official',
    url: 'https://fullnode.mainnet.sui.io:443',
    region: 'Global',
    provider: 'Mysten Labs',
  },
  {
    id: 'mainnet-2',
    name: 'Sui Mainnet US',
    url: 'https://sui-mainnet-us-1.cosmostation.io',
    region: 'US',
    provider: 'Cosmostation',
  },
  {
    id: 'mainnet-3',
    name: 'Sui Mainnet EU',
    url: 'https://sui-mainnet-eu-1.cosmostation.io',
    region: 'EU',
    provider: 'Cosmostation',
  },
  {
    id: 'mainnet-4',
    name: 'Sui Mainnet Asia',
    url: 'https://sui-mainnet-asia-1.cosmostation.io',
    region: 'Asia',
    provider: 'Cosmostation',
  },
  {
    id: 'mainnet-5',
    name: 'Sui Public RPC',
    url: 'https://sui-rpc.publicnode.com',
    region: 'Global',
    provider: 'PublicNode',
  },
  {
    id: 'mainnet-6',
    name: 'Blast API Sui',
    url: 'https://sui-mainnet.public.blastapi.io',
    region: 'Global',
    provider: 'Blast API',
  },
];