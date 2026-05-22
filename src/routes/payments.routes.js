import express from "express";
import { supabase } from "../config/supabase.js";
import { createPaystackPayment } from "../services/paystack.service.js";
import { createCryptoPayment } from "../services/crypto.service.js";

const router = express.Router();

//
// 💳 PAYSTACK
//
router.post("/paystack", async (req, res) => {
  const { orderId, email, amount } = req.body;

  const url = await createPaystackPayment({
    email,
    amount,
    orderId,
  });

  await supabase
    .from("orders")
    .update({ status: "processing_paystack" })
    .eq("id", orderId);

  res.json({ url });
});

//
// ₿ CRYPTO
//
router.post("/crypto", async (req, res) => {
  const { orderId, amount } = req.body;

  const payment = await createCryptoPayment({ orderId, amount });

  await supabase
    .from("orders")
    .update({ status: "crypto_pending" })
    .eq("id", orderId);

  res.json(payment);
});

export default router;