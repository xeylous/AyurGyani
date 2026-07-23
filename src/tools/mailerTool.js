import nodemailer from "nodemailer";
import { config } from "../config/env.js";

/**
 * Creates Nodemailer transporter
 */
function createTransporter() {
  if (!config.emailUser || !config.emailPass) {
    return null;
  }
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });
}

/**
 * Renders MJML template via MJML Cloud API if credentials are provided
 */
async function renderMjmlTemplate(mjmlTemplate) {
  if (!config.mjmlAppId || !config.mjmlSecretKey) {
    return null;
  }

  try {
    const authHeader = "Basic " + Buffer.from(`${config.mjmlAppId}:${config.mjmlSecretKey}`).toString("base64");
    const mjmlResponse = await fetch("https://api.mjml.io/v1/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({ mjml: mjmlTemplate })
    });

    const mjmlData = await mjmlResponse.json();
    if (mjmlData && mjmlData.html) {
      return mjmlData.html;
    }
  } catch (err) {
    console.warn("⚠️ MJML API render warning, falling back to standard HTML template:", err.message);
  }
  return null;
}

/**
 * Sends a registration confirmation email using Nodemailer & MJML API
 */
export async function sendRegistrationEmail({ name, email, logo, loginUrl, supportUrl }) {
  const logoUrl = logo || "https://ayur-sathi.vercel.app/logo.png";
  const dashboardUrl = loginUrl || "https://ayur-sathi.vercel.app/login";
  const contactSupportUrl = supportUrl || "https://ayur-sathi.vercel.app/support";

  const mjmlTemplate = `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-all font-family="Arial, sans-serif" />
        <mj-text font-size="16px" color="#333333" line-height="1.6" />
        <mj-button background-color="#4f46e5" color="#ffffff" border-radius="6px" font-size="16px" />
      </mj-attributes>
    </mj-head>

    <mj-body background-color="#f4f7d2">
      <mj-section background-color="#f4f7d2" padding="20px" border-radius="8px">
        <mj-column>
          <mj-image src="${logoUrl}" alt="Company Logo" width="120px" align="center" />
        </mj-column>
      </mj-section>

      <mj-section background-color="#ffffff" padding="20px" border-radius="8px">
        <mj-column>
          <mj-text font-size="22px" font-weight="bold" align="center" color="#31572C">
            🎉 Registration Successful
          </mj-text>
          <mj-text>
            Hi <strong>${name}</strong>,
            <br /><br />
            Thank you for registering with <strong>Ayurसाथी</strong>. We're excited to have you on board.
          </mj-text>

          <mj-button href="${dashboardUrl}" align="center">
            Go to Dashboard
          </mj-button>

          <mj-text font-size="14px" color="#666666">
            If you did not create this account, please contact our support team immediately.
          </mj-text>
        </mj-column>
      </mj-section>

      <mj-section background-color="#f4f4f7" padding="20px">
        <mj-column>
          <mj-text font-size="12px" color="#888888" align="center">
            © 2025 Ayurसाथी.
            <br />
            <a href="${contactSupportUrl}" style="color:#4f46e5; text-decoration:none;">Contact Support</a>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `;

  let html = await renderMjmlTemplate(mjmlTemplate);

  if (!html) {
    // Standard HTML fallback template
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f7d2; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #31572C; text-align: center;">🎉 Registration Successful</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for registering with <strong>Ayurसाथी</strong>. We're excited to have you on board.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${dashboardUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p style="font-size: 14px; color: #666666;">If you did not create this account, please contact our support team immediately.</p>
        </div>
      </div>
    `;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`⚠️ Nodemailer credentials (EMAIL_USER / EMAIL_PASS) missing. Simulated registration email send to ${email}.`);
    return { success: true, simulated: true, deliveredTo: email };
  }

  await transporter.sendMail({
    from: `"Ayurसाथी" <${config.emailUser}>`,
    to: email,
    subject: "🎉 Registration Successful",
    html,
  });

  return { success: true, deliveredTo: email };
}

/**
 * Tool: Send Recommendation Email via Nodemailer
 */
export async function executeSendRecommendationEmail({ email, summaryContent }) {
  if (!email) {
    return { success: false, error: "Recipient email address is required." };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`⚠️ Nodemailer credentials (EMAIL_USER / EMAIL_PASS) missing. Simulated recommendation digest to ${email}.`);
    return {
      success: true,
      simulated: true,
      message: `Recommendation digest formatted. Simulated email dispatch to ${email}.`
    };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2d3748; padding: 20px; background: #f7fafc; border-radius: 8px;">
      <h2 style="color: #31572C;">Namaste 🙏</h2>
      <p>Here is your personalized Ayurvedic guidance summary from <strong>Ayurसाथी 🌿</strong>:</p>
      <div style="background: #ffffff; border-left: 4px solid #38a169; padding: 15px; margin: 15px 0; border-radius: 4px;">
        ${summaryContent.replace(/\n/g, "<br>")}
      </div>
      <p style="color: #718096; font-size: 0.9em;">
        Wishing you peace, balance, and good health,<br>
        <strong>Ayurसाथी 🌿</strong>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ayurसाथी" <${config.emailUser}>`,
      to: email,
      subject: "Your Personal Ayurvedic Recommendation Digest 🌿",
      html,
    });
    return { success: true, deliveredTo: email };
  } catch (err) {
    console.error("❌ Nodemailer Dispatch Error:", err.message);
    return { success: false, error: err.message };
  }
}

export const sendRecommendationEmailDeclaration = {
  name: "send_recommendation_email",
  description: "Send personalized Ayurvedic recommendation digest to the user's email address via Nodemailer.",
  parameters: {
    type: "OBJECT",
    properties: {
      email: { type: "STRING", description: "Recipient's email address" },
      summaryContent: { type: "STRING", description: "The Ayurvedic recommendations and guidance content to include in the email" }
    },
    required: ["email", "summaryContent"]
  }
};
