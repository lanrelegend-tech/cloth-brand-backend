import express from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

const normalizeStatus = (status) => (status || "").toLowerCase();

const getFulfillmentStatus = (order) => {
  const deliveryStatus = normalizeStatus(order.delivery_status);
  const paymentStatus = normalizeStatus(order.status);

  if (["shipped", "delivered"].includes(deliveryStatus)) return deliveryStatus;
  if (["shipped", "delivered"].includes(paymentStatus)) return paymentStatus;

  return deliveryStatus || paymentStatus || "pending";
};

//
// 📊 TOTAL STATS
//
router.get("/summary", requireAdmin, async (req, res) => {
  const { data: orders = [], error } = await supabase.from("orders").select("*");

  if (error) return res.status(400).json({ error: error.message });

  const totalOrders = orders.length;

  const totalRevenue = orders
    .reduce((sum, o) => sum + Number(o.total || o.total_price || 0) + Number(o.shipping || 0), 0);

  const statusCount = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const deliveryStatusCount = orders.reduce((acc, order) => {
    const status = getFulfillmentStatus(order);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  res.json({
    totalOrders,
    totalRevenue,
    statusCount,
    deliveryStatusCount,
    recentOrders,
  });
});

//
// 🔥 TOP PRODUCTS (basic version)
//
router.get("/top-products", requireAdmin, async (req, res) => {
  const { data: orders = [], error } = await supabase.from("orders").select("items");

  if (error) return res.status(400).json({ error: error.message });

  const productMap = {};

  orders.forEach(order => {
    order.items?.forEach(item => {
      const name = item.product;

      productMap[name] = (productMap[name] || 0) + (item.qty || 1);
    });
  });

  const topProducts = Object.entries(productMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  res.json(topProducts);
});

export default router;
