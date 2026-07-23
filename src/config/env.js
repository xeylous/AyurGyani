import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  emailUser: process.env.EMAIL_USER || "",
  emailPass: process.env.EMAIL_PASS || "",
  mjmlAppId: process.env.MJML_APP_ID || "",
  mjmlSecretKey: process.env.MJML_SECRET_KEY || "",
  sendgridKey: process.env.SENDGRID_KEY || "",
  fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_USER || "no-reply@ayursaathi.org",
  allowedOrigins: [
    "https://ayur-sathi.vercel.app",
    "http://localhost:3000"
  ]
};
