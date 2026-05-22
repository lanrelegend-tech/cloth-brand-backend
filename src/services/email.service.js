import axios from "axios";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendEmail = async ({ to, subject, html }) => {
  if (!RESEND_API_KEY) return;

  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "onboarding@resend.dev",
        to,
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.log("Email error:", err.message);
  }
};