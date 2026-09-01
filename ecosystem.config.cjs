module.exports = {
  apps: [{
    name: 'onenotequeue.erinskidds.com',
    cwd: '/var/www/onenotequeue.erinskidds.com',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    env: { NODE_ENV: 'production' },
    instances: 1,
    autorestart: true,
    watch: false,
  }],
};
