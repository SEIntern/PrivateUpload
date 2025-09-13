import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: {
    type: String,
    enum: ['user', 'manager'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending', 
  },
  managerEmail: {
    type: String,
    default: null,   
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
