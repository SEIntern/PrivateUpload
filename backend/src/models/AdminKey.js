import mongoose from "mongoose";

const AdminKeySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    encryptionKey: { type: String, required: true }, // hex or base64
  },
  { timestamps: true }
);

export default mongoose.model("AdminKey", AdminKeySchema);
