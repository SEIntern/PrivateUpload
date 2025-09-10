import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  original_filename: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  iv: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('File', fileSchema);
