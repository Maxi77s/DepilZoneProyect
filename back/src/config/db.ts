import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("[db] Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("[db] Error al conectar:", error);
    process.exit(1);
  }
}
