const fs = require('fs');


fs.readFile('../public/users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user data:', err);
    } else {
      console.log('User data:', JSON.parse(data));
    }
  });
  