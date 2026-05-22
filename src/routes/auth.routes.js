import express from "express";
import { loginAdmin } from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const token = await loginAdmin(email, password);

  if (!token) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ token });
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