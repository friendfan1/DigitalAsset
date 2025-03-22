export const ipfsConfig = {
  local: {
    host: 'localhost',
    port: 5001,
    protocol: 'http',
    timeout: 60000 // 60秒超时
  },
  // 基本网关
  gateway: 'http://localhost:8081/ipfs/',
  
  // 备用网关 (按优先级排序)
  alternativeGateways: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ]
}; 