const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt"); // Add for password hashing
const { v4: uuidv4 } = require("uuid"); // Add for generating unique IDs

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

const initializeUsersFile = async () => {
  const usersFilePath = path.join(__dirname, "public", "users.json");
  try {
    await fs.promises.access(usersFilePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, create it with empty array
      await fs.promises.writeFile(usersFilePath, "[]");
      console.log("Created new users.json file");
    }
  }
};
const migrateUserIds = async () => {
  try {
    const users = await getUsersData();
    const migratedUsers = users.map((user) => {
      if (typeof user.id === "number") {
        return {
          ...user,
          id: uuidv4(),
        };
      }
      return user;
    });
    await writeUsersData(migratedUsers);
    console.log("User IDs migrated successfully");
  } catch (error) {
    console.error("Error migrating user IDs:", error);
  }
};

app.get("/users", async (req, res) => {
  try {
    const data = await fs.promises.readFile(
      path.join(__dirname, "public", "users.json"),
      "utf8"
    );
    const users = JSON.parse(data);
    const sanitizedUsers = users.map((user) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users data:", error);
    res
      .status(500)
      .json({ message: "Error fetching users data", error: error.message });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const data = await fs.promises.readFile(
      path.join(__dirname, "public", "users.json"),
      "utf8"
    );
    const users = JSON.parse(data);
    // Convert ID to string for comparison to handle both number and string IDs
    const user = users.find((u) => String(u.id) === String(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

const usersFilePath = path.join(__dirname, "public", "users.json");

// Enhanced user data structure
class UserGraph {
  constructor() {
    this.users = new Map(); // Using Map for O(1) user lookups
    this.followGraph = new Map(); // Adjacency list for following relationships
  }

  addUser(user) {
    this.users.set(user.id, user);
    this.followGraph.set(user.id, new Set()); // Initialize empty followers set
  }

  addFollower(userId, followId) {
    if (this.followGraph.has(userId)) {
      this.followGraph.get(userId).add(followId);
      return true;
    }
    return false;
  }

  getFollowers(userId) {
    return Array.from(this.followGraph.get(userId) || []);
  }
}

let userGraph = new UserGraph();

// Helper function to read users data from file and initialize graph
const getUsersData = async () => {
  try {
    const data = await fs.promises.readFile(usersFilePath, "utf8");
    const users = JSON.parse(data);
    userGraph = new UserGraph();
    users.forEach((user) => {
      userGraph.addUser(user);
      user.following.forEach((followId) => {
        userGraph.addFollower(user.id, followId);
      });
    });
    return users;
  } catch (err) {
    if (err.code === "ENOENT") {
      await writeUsersData([]);
      return [];
    }
    throw err;
  }
};

const writeUsersData = async (data) => {
  await fs.promises.writeFile(usersFilePath, JSON.stringify(data, null, 2));
};

class UserProfile {
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.passwordHash = userData.passwordHash;
    this.watchlist = new Set(userData.watchlist || []); // Using Set for O(1) lookup
    this.ratings = new Map(
      (userData.ratings || []).map((r) => [r.movieId, r.rating])
    );
    this.comments = userData.comments || [];
    this.following = new Set(userData.following || []); // Using Set for O(1) lookup
    this.followers = new Set(userData.followers || []); // Add followers field
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      passwordHash: this.passwordHash,
      watchlist: Array.from(this.watchlist),
      ratings: Array.from(this.ratings.entries()).map(([movieId, rating]) => ({
        movieId,
        rating,
      })),
      comments: this.comments,
      following: Array.from(this.following),
      followers: Array.from(this.followers),
    };
  }
}

// Enhanced endpoints
app.post("/sign-up", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const users = await getUsersData();
    if (users.some((u) => u.email === email)) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new UserProfile({
      id: uuidv4(), // Using UUID instead of incremental IDs
      name,
      email,
      passwordHash,
      watchlist: [],
      ratings: [],
      comments: [],
      following: [],
    });

    users.push(newUser.toJSON());
    userGraph.addUser(newUser);
    await writeUsersData(users);

    const { passwordHash: _, ...userWithoutPassword } = newUser.toJSON();
    res
      .status(201)
      .json({ message: "Sign up successful", user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    console.log("Sign-in attempt:", { email });

    const users = await getUsersData();
    console.log("Users data loaded:", users.length, "users found");

    const user = users.find((u) => u.email === email);
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Add validation for passwordHash
    if (!user.passwordHash) {
      console.error("User found but has no password hash:", email);
      return res.status(500).json({
        message: "Account configuration error. Please contact support.",
      });
    }

    // Debug log (remove in production)
    console.log("Attempting password comparison for user:", {
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash ? user.passwordHash.length : 0,
    });

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match result:", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ message: "Sign in successful", user: userWithoutPassword });
  } catch (error) {
    console.error("Detailed server error:", {
      message: error.message,
      stack: error.stack,
      email: email,
    });
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
// Add this endpoint to your server.js file
app.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  // Input validation
  if (!email || !newPassword) {
    return res.status(400).json({
      message: "Email and new password are required",
    });
  }

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    users[userIndex] = {
      ...users[userIndex],
      passwordHash,
    };

    // Save updated users data
    await writeUsersData(users);

    console.log(`Password reset successful for user: ${email}`);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Server error during password reset",
      error: error.message,
    });
  }
});

app.post("/users/:id/watchlist", async (req, res) => {
  const { movieId } = req.body;
  const userId = req.params.id;

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = new UserProfile(users[userIndex]);
    userProfile.watchlist.add(movieId); // Set automatically handles duplicates
    users[userIndex] = userProfile.toJSON();

    await writeUsersData(users);
    return res.json(userProfile.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/users/:id/follow", async (req, res) => {
  const { followId } = req.body;
  const userId = req.params.id;

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);
    const followUserIndex = users.findIndex((u) => u.id === followId);

    if (userIndex === -1 || followUserIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = new UserProfile(users[userIndex]);
    const followUserProfile = new UserProfile(users[followUserIndex]);

    // Update following for the user
    if (!userProfile.following.has(followId)) {
      userProfile.following.add(followId);
      userGraph.addFollower(userId, followId);
    }

    // Update followers for the followed user
    if (!followUserProfile.followers.has(userId)) {
      followUserProfile.followers.add(userId);
    }

    users[userIndex] = userProfile.toJSON();
    users[followUserIndex] = followUserProfile.toJSON();

    await writeUsersData(users);

    res.json({
      message: "Follow action successful",
      user: userProfile.toJSON(),
      followedUser: followUserProfile.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
app.delete("/users/:id/follow/:followId", async (req, res) => {
  const userId = req.params.id;
  const followId = req.params.followId;

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);
    const followUserIndex = users.findIndex((u) => u.id === followId);

    if (userIndex === -1 || followUserIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = new UserProfile(users[userIndex]);
    const followUserProfile = new UserProfile(users[followUserIndex]);

    // Remove from following
    userProfile.following.delete(followId);

    // Remove from followers
    followUserProfile.followers.delete(userId);

    users[userIndex] = userProfile.toJSON();
    users[followUserIndex] = followUserProfile.toJSON();

    await writeUsersData(users);

    res.json({
      message: "Unfollow successful",
      user: userProfile.toJSON(),
      unfollowedUser: followUserProfile.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/users/:id/ratings", async (req, res) => {
  const { movieId, rating } = req.body;
  const userId = req.params.id;

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = new UserProfile(users[userIndex]);
    userProfile.ratings.set(movieId, rating);
    users[userIndex] = userProfile.toJSON();

    await writeUsersData(users);
    return res.json(userProfile.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

class CommentQueue {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  getForMovie(movieId, users) {
    // Collect all comments for the specific movie from all users
    const allComments = [];
    users.forEach((user) => {
      const userComments = user.comments
        .filter((comment) => comment.movieId === parseInt(movieId))
        .map((comment) => ({
          ...comment,
          userName: user.name,
        }));
      allComments.push(...userComments);
    });

    // Sort comments by timestamp in descending order (newest first)
    return allComments
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, this.maxSize);
  }
}

const commentQueue = new CommentQueue();

app.post("/users/:id/comments", async (req, res) => {
  const { movieId, comment } = req.body;
  const userId = req.params.id;

  try {
    const users = await getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const newComment = {
      id: uuidv4(),
      movieId: parseInt(movieId),
      text: comment,
      timestamp: new Date().toISOString(),
      userId,
    };

    // Add comment to user's comments array
    users[userIndex].comments.push(newComment);
    await writeUsersData(users);

    // Return the comment with the user's name
    return res.json({
      ...newComment,
      userName: users[userIndex].name,
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/movies/:id/comments", async (req, res) => {
  const movieId = req.params.id;

  try {
    const users = await getUsersData();
    const comments = commentQueue.getForMovie(movieId, users);

    return res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.use(express.static("public"));

app.listen(PORT, async () => {
  await initializeUsersFile();
  await migrateUserIds();
  console.log(`Server running on http://localhost:${PORT}`);
});
