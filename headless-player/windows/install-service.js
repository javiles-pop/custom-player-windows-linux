const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Poppulo Headless Player',
  description: 'Poppulo digital signage headless player service',
  script: path.join(__dirname, '..', 'src', 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'ENVIRONMENT', 
      value: 'prod'
    },
    {
      name: 'VERSION',
      value: '2.0.0'
    },
    {
      name: 'BUILD_NUMBER',
      value: '1'
    }
  ]
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('Poppulo Headless Player service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', function() {
  console.log('Poppulo Headless Player service started successfully!');
  console.log('Service will auto-start on system boot.');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

console.log('Installing Poppulo Headless Player as Windows service...');
svc.install();