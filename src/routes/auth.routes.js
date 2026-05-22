import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "../utils/email.js";

const router = express.Router();

// USER + ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. find user in DB
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 2. compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3. generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// USER SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // check if user exists
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user object
    const newUser = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      role: "customer",
      created_at: new Date(),
    };

    // insert into DB
    const { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // generate token
    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: data.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await sendWelcomeEmail(data.email, data.name);

    return res.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Signup failed" });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", requireAuth, async (req, res) => {
  try {
    // req.user is expected to be injected by JWT middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// UPDATE CURRENT USER PROFILE
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { email, name } = req.body;

    const updates = {};

    if (email) updates.email = email;
    if (name) updates.name = name;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("email", req.user.email)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Profile updated successfully",
      user: data,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;