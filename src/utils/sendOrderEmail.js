import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderMail = async ({ type, order, status, tracking_number }) => {
  if (!order?.email) {
    console.log("No email found for order");
    return;
  }

  try {
    let subject = "";
    let html = "";

    // 📦 ORDER CREATED EMAIL
    if (type === "order_created") {
      subject = `Order Confirmation #${order.id}`;
      html = `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Thank you ${order.name || "Customer"} 🎉</h2>
          <p>Your payment was successful and your order has been received.</p>

          <h3>Order Details</h3>
          <p><b>Order ID:</b> ${order.id}</p>
          <p><b>Total:</b> ₦${Number(order.total || 0).toLocaleString()}</p>

          <p>We will update you when your order has been shipped.</p>

          <br/>
          <p>Thanks for choosing us ❤️</p>
        </div>
      `;
    }

    // 🚚 ORDER STATUS UPDATE EMAIL
    if (type === "order_status_update") {
      let statusText = "";

      if (status === "processing") statusText = "Your order is being processed 🟡";
      if (status === "shipped") statusText = `Your order has been shipped 🚚 Tracking: ${tracking_number || "N/A"}`;
      if (status === "delivered") statusText = "Your order has been delivered 📦";

      subject = `Order Update - ${status}`;
      html = `
        <div style="font-family: Arial; padding: 20px;">
          <h2>${statusText}</h2>
          <p><b>Order ID:</b> ${order.id}</p>
        </div>
      `;
    }

    // 🚚 ORDER SHIPPED EMAIL (OUT FOR DELIVERY)
    if (type === "order_shipped") {
      subject = `Your order is out for delivery 🚚`;

      html = `
        <div style="font-family: Arial; padding: 20px;">
          <h2>🚚 Your order is out for delivery!</h2>

          <p>Good news ${order.name || "Customer"} 🎉</p>

          <p>Your order is now on the way and will arrive soon.</p>

          <h3>Tracking Details</h3>
          <p><b>Order ID:</b> ${order.id}</p>
          <p><b>Tracking ID:</b> ${tracking_number || "N/A"}</p>

          <br/>
          <p>We will notify you when it is delivered 📦</p>

          <p>Thank you for shopping with us ❤️</p>
        </div>
      `;
    }

    if (!subject || !html) {
      console.log("No valid email template type provided");
      return;
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Orders <no-reply@yourdomain.com>",
      to: order.email,
      subject,
      html,
    });

    console.log("📧 Order email sent successfully");
  } catch (err) {
    console.error("EMAIL ERROR:", err);
  }
};