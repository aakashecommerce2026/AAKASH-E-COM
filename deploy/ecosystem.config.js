module.exports = {
  apps: [
    {
      name: 'aakash-backend',
      script: './backend/dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      autorestart: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
