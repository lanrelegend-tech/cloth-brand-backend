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

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];

  // verify request is from Paystack
  if (hash !== signature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const orderId = event.data.metadata.orderId;

    // update order + fetch order data
    const { data: order } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .select()
      .single();

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