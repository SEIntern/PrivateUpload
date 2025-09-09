import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import File from '../models/File.js';
import auth from '../middleware/auth.js';
import dotenv from 'dotenv';
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
  const { iv } = req.body;
  try {
    // Convert buffer (which is a Base64 string) back to Buffer
    const base64String = buffer.toString();
    const encryptedBuffer = Buffer.from(base64String, 'base64');
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'encrypted_files' },
      async (error, result) => {
        if (error) return res.status(500).json({ message: 'Cloudinary error', error });
        const file = new File({
          public_id: result.public_id,
          original_filename: originalname,
          owner: req.user.id,
          iv,
        });
        await file.save();
        res.status(201).json({ message: 'File uploaded', file });
      }
    );
    result.end(encryptedBuffer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// List user's files
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
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.public_id, { resource_type: 'raw' });
    // Delete from MongoDB
    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;