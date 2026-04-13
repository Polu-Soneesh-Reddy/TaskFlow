const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    avatar: { type: String, default: '' },
    leaveBalance: { type: Number, default: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Employee', employeeSchema);

