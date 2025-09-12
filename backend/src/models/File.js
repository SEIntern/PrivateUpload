import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  original_filename: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  iv: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: String, // manager/admin email
    default: null,
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('File', fileSchema);
