const mongoose = require("mongoose");

const workflowSchema = new mongoose.Schema({
  nodes: Array,
  edges: Array,
});
9;
const Workflow = mongoose.model("Workflow", workflowSchema);

module.exports = Workflow;
