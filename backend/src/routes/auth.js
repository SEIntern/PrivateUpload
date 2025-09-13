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

// POST /signup
router.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      role,
      status: "pending",   // directly pending
    });

    await user.save();

    res.status(201).json({
      message: "Signup request submitted. Waiting for admin approval.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// PUT /status/:id
router.put("/status/:id", auth, async (req, res) => {
  try {
    const { action, managerEmail } = req.body; // also accept managerEmail
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "approve") {
      user.status = "approved";

      // If user is employee, save managerEmail
      if (user.role === "user" && managerEmail) {
        user.managerEmail = managerEmail;
      }

      await user.save();
    } else if (action === "reject") {
      // Delete the user entirely
      await User.findByIdAndDelete(req.params.id);
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    //  Send mail according to action
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject, text;
    if (action === "approve") {
      subject = "Your account has been approved";
      text = `Hello,\n\nYour account has been approved. You can now login.${
        user.role === "user" && managerEmail
          ? `\n\nYour assigned manager: ${managerEmail}`
          : ""
      }\n\nRegards,\nAdmin`;
    } else {
      subject = " Your account has been rejected";
      text = `Hello,\n\nSorry, your account request has been rejected. Your credentials have been removed from our system.\n\nRegards,\nAdmin`;
    }

    await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      text,
    });

    res.json({
      message:
        action === "approve"
          ? "User approved & email sent successfully"
          : "User rejected, credentials deleted & email sent",
      status: action === "approve" ? "approved" : "deleted",
      managerEmail: user.managerEmail || null,
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check approval status
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending approval." });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your signup request was rejected." });
    }

    // Only approved users get tokens
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, managerEmail: user.managerEmail },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
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
  const { email, password, role, managerEmail } = req.body;

  try {
    // check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash and save
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashed,
      role,
      status: "approved", // Admin created = auto-approved
      managerEmail: role === "user" ? managerEmail || "" : "", // only for employees
    });
    await user.save();

    // transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // send email
    await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Account Credentials",
      text: `Hello,\n\nYour account has been created and approved.\n\nEmail: ${email}\nPassword: ${password}\nRole: ${role}\n${
        managerEmail ? `Manager: ${managerEmail}\n` : ""
      }\n\nPlease change your password after first login.`,
    });

    console.log("Email sent to", email);

    res
      .status(201)
      .json({ message: "User created, approved & credentials sent via email" });
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
