module.exports = {
  apps: [
    {
      name: 'aakash-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '500M',
      kill_timeout: 4000,
      listen_timeout: 4000,
      restart_delay: 1000,
      autorestart: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
