const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    assignedTo: { type: String, required: true },
    assignedToId: { type: String, required: true, index: true },
    priority: { type: String, required: true },
    deadline: { type: String, required: true }, // stored as YYYY-MM-DD
    status: { type: String, required: true, index: true },
    description: { type: String, default: '' },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Task', taskSchema);

