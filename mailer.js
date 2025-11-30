import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_KEY);

export async function sendRecommendation(email, content) {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "Your Ayurvedic Recommendations 🌿",
    html: `<h3>Namaste 🙏</h3>
           <p>Here are the Ayurvedic recommendations based on your concerns:</p>
           <div>${content}</div>
           <br><p>Wishing you good health,<br><strong>AyurSathi</strong></p>`
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
