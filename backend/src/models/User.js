const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['manager', 'employee'], required: true },
    name: { type: String, required: true },
    employeeId: { type: String, default: null, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
