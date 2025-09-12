import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import auth from "../middleware/auth.js";

dotenv.config();
const router = express.Router();

// Signup

router.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, role });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login

router.post("/login", async (req, res) => {
  const { email, password} = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Login (add this to auth.js)
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.json({ token, role: 'admin' });
  }
  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// Admin creates user & sends credentials
router.post("/admin/create-user", async (req, res) => {
  const { email, password,role } = req.body;

  try {
    // check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash and save
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed,role });
    await user.save();

    // ✅ define transporter here
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ optional: check if ready
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Transporter not ready:", error);
      } else {
        console.log("✅ Email server is ready");
      }
    });

    // ✅ send email
    await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Account Credentials",
      text: `Hello,\n\nYour account has been created.\n\nEmail: ${email}\nPassword: ${password}\nRole: ${role}\n\nPlease change your password after first login.`,
    });

    console.log("✅ Email sent to", email);

    res.status(201).json({ message: "User created & credentials sent via email" });
  } catch (err) {
    console.error("Admin create-user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//forgot password
router.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide email, old password and new password" });
    }

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/changepassword", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // set in authMiddleware after verifying token

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
