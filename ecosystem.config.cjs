module.exports = {
  apps: [{
    name: 'onenotesystem.erinskidds.com',
    cwd: '/var/www/onenotesystem.erinskidds.com',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    env: { NODE_ENV: 'production' },
    instances: 1,
    autorestart: true,
    watch: false,
  }],
};
