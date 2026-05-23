import express from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import { calculateShipping } from "../services/shipping.service.js";

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

  const orderPayload = {
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
  };

  const { data, error } = await supabase
    .from("orders")
    .insert([orderPayload])
    .select()
    .single();

  if (error) {
    console.log("❌ SUPABASE ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  console.log("ORDER CREATED:", data);

  // 📧 SEND ORDER CONFIRMATION EMAIL
  try {
    const order = data || {};

    if (!order?.email) {
      console.log("EMAIL SKIPPED: missing email", order);
    } else {
      const { sendOrderMail } = await import("../util/sendOrderMail.js");

      console.log("SENDING ORDER EMAIL TO:", order.email);

      await sendOrderMail({
        type: "order_created",
        order,
      });

      console.log("ORDER EMAIL SENT SUCCESSFULLY");
    }
  } catch (err) {
    console.log("Order email failed:", err?.message || err);
  }

  res.json({
    success: true,
    order: data,
  });
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
    if (!data) {
      console.log("STATUS EMAIL SKIPPED: no order data");
    } else if (!data.email) {
      console.log("STATUS EMAIL SKIPPED: missing email on order", data);
    } else {
      const { sendOrderMail } = await import("../util/sendOrderMail.js");

      console.log("SENDING STATUS EMAIL TO:", data.email);

      await sendOrderMail({
        type: "order_status_update",
        order: data,
        status,
        tracking_number,
      });

      console.log("STATUS EMAIL SENT SUCCESSFULLY");
    }
  } catch (err) {
    console.log("Email failed:", err?.message || err);
  }

  res.json(data);
});

export default router;