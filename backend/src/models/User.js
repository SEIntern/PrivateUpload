import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: {
    type: String,
    enum: ['user', 'manager'],
    default: 'user',
  },
});

export default mongoose.model('User', userSchema);
