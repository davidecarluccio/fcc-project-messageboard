const mongoose = require('mongoose');

// Reply Schema
const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true }
});

// Thread Schema
const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);
const Reply = mongoose.model('Reply', replySchema);

module.exports = { Thread, Reply };
