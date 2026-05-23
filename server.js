import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import productsRoutes from "./src/routes/products.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import paymentsRoutes from "./src/routes/payments.routes.js";
import paystackWebhook from "./src/routes/paystack.webhook.js";
import adminAnalyticsRoutes from "./src/routes/admin.analytics.routes.js";

console.log("✅ productsRoutes imported:", typeof productsRoutes);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// app.use(helmet());

// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//   })
// );

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
console.log("👉 Mounting /products route...");
app.use("/products", productsRoutes);
app.use("/", productsRoutes);
app.use("/auth", authRoutes);
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/paystack/webhook", paystackWebhook);
app.use("/admin/analytics", adminAnalyticsRoutes);
console.log("✅ /products route mounted");

app.get("/", (req, res) => {
  res.json({
    message: "Cloth Brand API Running 🚀",
  });
});

app.get("/ping", (req, res) => {
  res.json({
    ok: true
  });
});

console.log("🚀 Server starting...");
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
