import { spawn } from 'node:child_process';
const children=[spawn('backend/.venv/bin/python',['-m','uvicorn','backend.app:app','--host','127.0.0.1','--port','8000','--reload'],{stdio:'inherit'}),spawn('npm',['run','dev','--workspace','frontend'],{stdio:'inherit'})];
const stop=()=>children.forEach(child=>child.kill('SIGTERM'));
children.forEach(child=>child.on('exit',stop));process.on('SIGINT',stop);process.on('SIGTERM',stop);
