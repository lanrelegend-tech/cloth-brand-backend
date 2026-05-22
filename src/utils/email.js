import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email, name) => {
  try {
    await resend.emails.send({
      from: "Velra Store <onboarding@resend.dev>",
      to: email,
      subject: "🎉 Welcome to Velra!",
      html: `
        <div style="font-family: Arial;">
          <h1>Welcome ${name} 🎉</h1>
          <p>Thanks for joining Velra Store.</p>
          <p>We’re excited to have you!</p>
        </div>
      `,
    });
  } catch (err) {
    console.log("Email error:", err);
  }
};