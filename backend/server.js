const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Import CORS module

const app = express();
const PORT = 3001;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

// Path to the user data JSON file
const usersFilePath = path.join(__dirname, "public", "users.json");

// Helper function to read users data from file
const getUsersData = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(usersFilePath, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          // Initialize with empty array if file doesn't exist
          writeUsersData([])
            .then(() => resolve([]))
            .catch(reject);
        } else {
          reject(err);
        }
      } else {
        try {
          resolve(JSON.parse(data));
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
app.get("/users", (req, res) => {
  getUsersData()
    .then((users) => res.json(users))
    .catch((error) => {
      console.error("Error fetching users data:", error); // Log the error
      res.status(500).json({ message: "Error fetching users data", error }); // Send error response
    });
});
// Get user profile
app.get("/users/:id", async (req, res) => {
  console.log("Fetching user with ID:", req.params.id);
  try {
    const users = await getUsersData();
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (user) {
      return res.json(user); // Send response and return
    } else {
      return res.status(404).json({ message: "User not found" }); // Send response and return
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error }); // Send error response
  }
});

// Update following list
app.post("/users/:id/follow", async (req, res) => {
  const { followId } = req.body;
  const userId = parseInt(req.params.id);

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!users[userIndex].following.includes(followId)) {
      users[userIndex].following.push(followId);
      await writeUsersData(users);
    }

    return res.json(users[userIndex]); // Send response and return
  } catch (error) {
    console.error("Error updating following list:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// Update watchlist
app.post("/users/:id/watchlist", async (req, res) => {
  const { movieId } = req.body;
  const userId = parseInt(req.params.id);

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!users[userIndex].watchlist.includes(movieId)) {
      users[userIndex].watchlist.push(movieId);
      await writeUsersData(users);
    }

    return res.json(users[userIndex]); // Send response and return
  } catch (error) {
    console.error("Error updating watchlist:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// Add rating
app.post("/users/:id/ratings", async (req, res) => {
  const { movieId, rating } = req.body;
  const userId = parseInt(req.params.id);

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize ratings array if it doesn't exist
    if (!users[userIndex].ratings) {
      users[userIndex].ratings = [];
    }

    // Update or add new rating
    const ratingIndex = users[userIndex].ratings.findIndex(
      (r) => r.movieId === movieId
    );
    if (ratingIndex !== -1) {
      users[userIndex].ratings[ratingIndex].rating = rating;
    } else {
      users[userIndex].ratings.push({ movieId, rating });
    }

    await writeUsersData(users);
    return res.json(users[userIndex]);
  } catch (error) {
    console.error("Error updating ratings:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// Add comment
app.post("/users/:id/comments", async (req, res) => {
  const { movieId, comment } = req.body;
  const userId = parseInt(req.params.id);

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize comments array if it doesn't exist
    if (!users[userIndex].comments) {
      users[userIndex].comments = [];
    }

    const newComment = {
      id: Date.now(),
      movieId,
      text: comment,
      timestamp: new Date().toISOString(),
    };

    users[userIndex].comments.push(newComment);
    await writeUsersData(users);
    return res.json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get movie comments
app.get("/movies/:id/comments", async (req, res) => {
  const movieId = parseInt(req.params.id);

  try {
    const users = await getUsersData();
    const allComments = users.reduce((comments, user) => {
      const userComments = (user.comments || [])
        .filter((comment) => comment.movieId === movieId)
        .map((comment) => ({
          ...comment,
          userName: user.name,
        }));
      return [...comments, ...userComments];
    }, []);

    return res.json(allComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// Sign In
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await getUsersData();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      res.json({ message: "Sign in successful", user });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Sign up
app.post("/sign-up", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const users = await getUsersData();
    if (users.some((u) => u.email === email)) {
      return res.status(409).json({ message: "Email already exists" });
    }
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
      following: [],
      watchlist: [],
      comments: [],
      ratings: [],
    };
    users.push(newUser);
    await writeUsersData(users);
    res.status(201).json({ message: "Sign up successful", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
