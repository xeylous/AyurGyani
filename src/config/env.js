import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://ayursaathi_db_user:COZ4CrtqArOhzsz1@ayursaathi.cgrwcre.mongodb.net/ayursaathi",
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
