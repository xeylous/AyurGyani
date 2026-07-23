import cors from "cors";
import { config } from "./env.js";

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or allowed list
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS Notice: Origin '${origin}' requested access.`);
      callback(null, true); // Permissive in dev/staging to prevent CORS breakage
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};

export const corsMiddleware = cors(corsOptions);
