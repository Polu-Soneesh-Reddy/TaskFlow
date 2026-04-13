const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    fromDate: { type: String, required: true }, // stored as YYYY-MM-DD
    toDate: { type: String, required: true }, // stored as YYYY-MM-DD
    reason: { type: String, required: true },
    status: { type: String, required: true, index: true }, // Pending|Approved|Rejected
    appliedOn: { type: String, required: true }, // stored as YYYY-MM-DD
  },
  { versionKey: false }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

