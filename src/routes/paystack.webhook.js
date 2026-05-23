import express from "express";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { sendEmail } from "../services/email.service.js";

const router = express.Router();

//
// 🔔 PAYSTACK WEBHOOK
//
router.post("/", async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const payload = JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];

  // verify request is from Paystack
  if (hash !== signature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const orderId =
      event.data?.metadata?.orderId || event.data?.reference;

    // update order + fetch order data
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .or(`id.eq.${orderId},payment_ref.eq.${orderId}`)
      .select()
      .single();

    if (error || !order) {
      console.log("Order not found for webhook:", orderId);
    }

    // 📧 send email via service
    try {
      if (order?.email) {
        await sendEmail({
          to: order.email,
          subject: "Payment Successful 🎉",
          html: `
            <h2>Thank you for your order</h2>
            <p>Your payment was successful.</p>
            <p><b>Order ID:</b> ${orderId}</p>
            <p><b>Status:</b> Paid</p>
          `
        });
      }
    } catch (err) {
      console.log("Email failed:", err.message);
    }
  }

  res.sendStatus(200);
});

export default router;