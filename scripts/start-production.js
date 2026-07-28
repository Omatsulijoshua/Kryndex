const { fork } = require('child_process');
const path = require('path');

const services = [
  { name: 'auth-service', path: '../services/auth-service/dist/main.js' },
  { name: 'trade-service', path: '../services/trade-service/dist/main.js' },
  { name: 'wallet-service', path: '../services/wallet-service/dist/main.js' },
  { name: 'websocket-service', path: '../services/websocket-service/dist/main.js' },
  { name: 'api-gateway', path: '../services/api-gateway/dist/main.js' },
];

console.log('================================================================');
console.log('--- STARTING ALL KRYNDEX BACKEND SERVICES IN A SINGLE CONTAINER ---');
console.log('================================================================');

console.log('--- DIAGNOSTIC RUNTIME ENVIRONMENT CHECK ---');
console.log('Available Env Keys:', Object.keys(process.env).sort());
console.log('DATABASE_URL status:', process.env.DATABASE_URL ? `FOUND (length: ${process.env.DATABASE_URL.length})` : 'NOT FOUND');
console.log('REDIS_HOST status:', process.env.REDIS_HOST ? `FOUND (${process.env.REDIS_HOST})` : 'NOT FOUND');
console.log('REDIS_PORT status:', process.env.REDIS_PORT ? `FOUND (${process.env.REDIS_PORT})` : 'NOT FOUND');
console.log('PORT (exposed):', process.env.PORT || 'not defined');
console.log('================================================================');

const processes = [];
let shuttingDown = false;

function terminateAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nShutting down all microservices...');
  for (const proc of processes) {
    try {
      proc.kill('SIGTERM');
    } catch (err) {
      // Ignored
    }
  }
  process.exit(0);
}

process.on('SIGTERM', terminateAll);
process.on('SIGINT', terminateAll);

// Run the services
for (const svc of services) {
  console.log(`Starting process for ${svc.name}...`);
  const fullPath = path.resolve(__dirname, svc.path);
  
  const proc = fork(fullPath, [], {
    env: {
      ...process.env,
      AUTH_SERVICE_URL: 'http://localhost:3001',
      TRADE_SERVICE_URL: 'http://localhost:3002',
      WALLET_SERVICE_URL: 'http://localhost:3003',
      WEBSOCKET_SERVICE_URL: 'http://localhost:3004',
      // Override API Gateway port using PORT injected by Render
      GATEWAY_PORT: process.env.PORT || 3000,
    }
  });

  processes.push(proc);

  proc.on('exit', (code) => {
    if (!shuttingDown) {
      console.warn(`[Runner] ${svc.name} exited with code ${code}. Initiating teardown.`);
      terminateAll();
    }
  });
}
