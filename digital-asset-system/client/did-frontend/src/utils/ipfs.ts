import { create } from 'ipfs-http-client';
import { ipfsConfig } from '@/config/ipfs.config';

export const createIPFSClient = () => {
  return create({
    host: ipfsConfig.local.host,
    port: ipfsConfig.local.port,
    protocol: ipfsConfig.local.protocol,
    timeout: 30000,
    agent: undefined
  });
};

export const getIPFSUrl = (cid: string) => {
  return `${ipfsConfig.gateway}${cid}`;
}; 