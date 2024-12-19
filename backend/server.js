const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import CORS module

const app = express();
const PORT = 3001;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

// Path to the user data JSON file
const usersFilePath = path.join(__dirname, 'public', 'users.json');

// Helper function to read users data from file
const getUsersData = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // File does not exist, resolve with empty array
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        try {
          resolve(JSON.parse(data || '[]')); // Default to empty array if file is empty
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
};

// Helper function to write users data to file
const writeUsersData = (data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(usersFilePath, JSON.stringify(data, null, 2), (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

// Serve users.json
app.get('/users', (req, res) => {
  getUsersData()
    .then(users => res.json(users))
    .catch(error => res.status(500).json({ message: 'Error fetching users data', error }));
});

// Sign In
app.post('/sign-up', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Sign-Up Data:', req.body); // Debugging
  try {
    const users = await getUsersData();
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const newUser = { name, email, password };
    users.push(newUser);
    await writeUsersData(users);
    res.status(201).json({ message: 'Sign up successful', user: newUser });
  } catch (error) {
    console.error('Sign-Up Error:', error); // Debugging
    res.status(500).json({ message: 'Server error', error });
  }
});

// Sign Up
app.post('/sign-up', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const users = await getUsersData();
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const newUser = { name, email, password };
    users.push(newUser);
    await writeUsersData(users);
    res.status(201).json({ message: 'Sign up successful', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
