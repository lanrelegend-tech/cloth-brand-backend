import axios from "axios";

const PAYSTACK_URL = "https://api.paystack.co";

export const createPaystackPayment = async ({ email, amount, orderId }) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is missing in .env");
  }

  const response = await axios.post(
    `${PAYSTACK_URL}/transaction/initialize`,
    {
      email,
      amount: amount * 100,
      metadata: { orderId },
    },
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.authorization_url;
};