const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Poppulo Headless Player',
  script: path.join(__dirname, '..', 'src', 'server.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
  console.log('Poppulo Headless Player service uninstalled successfully!');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

console.log('Uninstalling Poppulo Headless Player Windows service...');
svc.uninstall();