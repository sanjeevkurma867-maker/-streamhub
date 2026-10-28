import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.findOne({
      $or: [{ username: username.trim() }, { email: normalizedEmail }]
    })) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10)
    });

    res.status(201).json({ token: createToken(user), user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: createToken(user), user: safeUser(user) });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user: safeUser(user) });
});

export default router;