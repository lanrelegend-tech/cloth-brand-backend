import express from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

//
// 📊 TOTAL STATS
//
router.get("/summary", requireAdmin, async (req, res) => {
  const { data: orders } = await supabase.from("orders").select("*");

  const totalOrders = orders.length;

  const totalRevenue = orders
    .filter(o => o.status === "paid")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const statusCount = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalOrders,
    totalRevenue,
    statusCount,
  });
});

//
// 🔥 TOP PRODUCTS (basic version)
//
router.get("/top-products", requireAdmin, async (req, res) => {
  const { data: orders } = await supabase.from("orders").select("items");

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