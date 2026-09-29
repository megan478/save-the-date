import { spawn } from 'node:child_process';

const child = spawn(
  'backend/.venv/bin/python',
  ['-m', 'uvicorn', 'backend.app:app', '--host', '127.0.0.1', '--port', process.env.PORT || '3000'],
  { stdio: 'inherit' }
);

child.on('exit', code => { process.exitCode = code || 0; });
process.on('SIGINT', () => child.kill('SIGTERM'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
