import express from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { calculateShipping } from "../services/shipping.service.js";
import { sendEmail } from "../services/email.service.js";

const router = express.Router();

//
// CREATE ORDER (public)
//
router.post("/", requireAuth, async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    items,
    total,
    shipping,
    payment_ref,
    status,
  } = req.body;

  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        name,
        email,
        phone,
        address,
        items,

        total: total || 0,
        shipping: shipping || 0,
        payment_ref,

        status: status || "pending",
        delivery_status: "processing",

        user_id: req.user.id,
      },
    ])
    .select();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

//
// GET LOGGED-IN USER ORDERS
//
router.get("/my", requireAuth, async (req, res) => {
  console.log("FETCHING ORDERS FOR USER:", req.user.id);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ORDER FETCH ERROR:", error);
    return res.status(400).json({ error });
  }

  console.log("USER ORDERS:", data);
  res.json(data);
});

//
// GET SINGLE ORDER (admin only)
//
router.get("/:id", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

//
// GET ALL ORDERS (admin only)
//
router.get("/", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error });

  res.json(data);
});

//
// UPDATE ORDER STATUS (admin only)
//
router.patch("/:id", requireAdmin, async (req, res) => {
  const { status, delivery_status, tracking_number } = req.body;

  const { data, error } = await supabase
    .from("orders")
    .update({
      status,
      delivery_status,
      tracking_number,
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  // 📧 EMAIL NOTIFICATIONS
  try {
    if (data?.email) {
      let subject = "";
      let message = "";

      if (status === "processing") {
        subject = "Order Processing 🟡";
        message = "Your order is now being processed.";
      }

      if (status === "shipped") {
        subject = "Order Shipped 🚚";
        message = `Your order has been shipped. Tracking: ${tracking_number || "N/A"}`;
      }

      if (status === "delivered") {
        subject = "Order Delivered 📦";
        message = "Your order has been delivered successfully.";
      }

      if (subject) {
        await sendEmail({
          to: data.email,
          subject,
          html: `
            <h2>${subject}</h2>
            <p>${message}</p>
            <p><b>Order ID:</b> ${data.id}</p>
          `,
        });
      }
    }
  } catch (err) {
    console.log("Email failed:", err.message);
  }

  res.json(data);
});

export default router;