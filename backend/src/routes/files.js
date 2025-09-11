import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import File from '../models/File.js';
import User from '../models/User.js';   // ✅ import User model
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js'; // ✅ admin middleware
import dotenv from 'dotenv';
import AdminKey from "../models/AdminKey.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload encrypted file


router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { originalname, buffer } = req.file;
  const { iv, encryptionKey } = req.body; // 🔑 frontend must send encryptionKey
  try {
    const base64String = buffer.toString();
    const encryptedBuffer = Buffer.from(base64String, 'base64');

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'encrypted_files' },
      async (error, result) => {
        if (error) return res.status(500).json({ message: 'Cloudinary error', error });

        // Save File metadata
        const file = new File({
          public_id: result.public_id,
          original_filename: originalname,
          owner: req.user.id,
          iv,
        });
        await file.save();

        // Save AdminKey for admin access
        await AdminKey.create({
          user: req.user.id,
          file: file._id,
          encryptionKey, // 🔑 store the key (hex/base64)
        });

        res.status(201).json({ message: 'File uploaded', file });
      }
    );

    uploadStream.end(encryptedBuffer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});


// List user's own files
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download file (returns Cloudinary URL)
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.owner.toString() !== req.user.id)
      return res.status(404).json({ message: 'File not found' });
    const url = cloudinary.url(file.public_id, { resource_type: 'raw', secure: true });
    res.json({ url, iv: file.iv, original_filename: file.original_filename });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found' });
    }
    await cloudinary.uploader.destroy(file.public_id, { resource_type: 'raw' });
    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

/* ------------------- ADMIN ROUTES ------------------- */

// Get all users (admin only)
router.get('/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});




router.get('/admin/users/:userId/files', auth, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    // get all files of that user
    const files = await File.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate('owner', 'email username');

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No files found for this user' });
    }

    // fetch keys for those files
    const fileIds = files.map(f => f._id);
    const keys = await AdminKey.find({ file: { $in: fileIds } });

    // merge file + key + url
    const response = files.map(file => {
      const keyDoc = keys.find(k => k.file.toString() === file._id.toString());
      const url = cloudinary.url(file.public_id, {
        resource_type: "raw",
        secure: true,
      });
      return {
        ...file.toObject(),
        encryptionKey: keyDoc ? keyDoc.encryptionKey : null,
        url, // 👈 add signed Cloudinary download URL
      };
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching admin files:", err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});




export default router;
