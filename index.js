require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8080;
const Workflow = require("./models/workflow");
const { connection } = require("./configs/database");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const csvToJson = require("./utils/csvToJson");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

// File upload configuration using multer
const upload = multer({ dest: "uploads/" });

// Save workflow
app.post("/api/save-workflows", async (req, res) => {
  const workflow = req.body;

  try {
    // Save the workflow to the database
    const newWorkflow = new Workflow(workflow);
    const savedWorkflow = await newWorkflow.save();
    res.status(201).json(savedWorkflow); // Send back the saved workflow with its _id
  } catch (error) {
    res.status(500).send("Error saving workflow");
  }
});
// Get all workflows
app.get("/api/get-workflows", async (req, res) => {
  try {
    const workflows = await Workflow.find({});
    res.status(200).json(workflows);
  } catch (error) {
    res.status(500).send("Error fetching workflows");
  }
});

// Run workflow
app.post("/api/run-workflow", upload.single("file"), async (req, res) => {
  const { workflowId } = req.body;
  const file = req.file; // Uploaded file

  try {
    // Fetch workflow from MongoDB using _id
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).send("Workflow not found");
    }

    // Parse the uploaded file (assuming it's CSV)
    let parsedData = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (row) => {
        parsedData.push(row);
      })
      .on("end", async () => {
        let result = parsedData;
        // Process the workflow nodes
        for (const node of workflow.nodes) {
          switch (node.type) {
            case "filterdata":
              result = result.map((item) => {
                // Convert every property value to lowercase if it's a string
                for (const key in item) {
                  if (
                    item.hasOwnProperty(key) &&
                    typeof item[key] === "string"
                  ) {
                    item[key] = item[key].toLowerCase();
                  }
                }
                return item;
              });
              break;
            case "dowait":
              await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
              break;
            case "convertformat":
              result = csvToJson(result);
              break;
            case "sendpost request":
              await fetch("https://workflow.requestcatcher.com/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result),
              });
              break;
            default:
              break;
          }
        }
        console.log(result);
        // After workflow execution, send result back to the client
        res.status(200).send(result);

        // Clean up uploaded file
        fs.unlinkSync(file.path);
      });
  } catch (error) {
    console.error("Error running workflow:", error);
    res.status(500).send("Error running workflow");
  }
});

app.listen(PORT, async () => {
  try {
    await connection;
    console.log("Database connected");
  } catch (err) {
    console.log("Database connection error");
  }
  console.log(`Server is up and running at ${PORT}`);
});
