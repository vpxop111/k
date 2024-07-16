const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());

// POST endpoint for prediction
app.post("/predict", (req, res) => {
  const message = req.body.message;
  const modelPath = process.env.MODEL_PATH || path.join(__dirname, "scams.pth");
  const vectorizerPath =
    process.env.VECTORIZER_PATH || path.join(__dirname, "vectt.pkl");
  const pythonPath = process.env.PYTHON_PATH || "/usr/bin/python3"; // Default Python path

  const pythonArgs = [
    path.join(__dirname, "predict.py"),
    message,
    modelPath,
    vectorizerPath,
  ];

  let pythonProcess;

  try {
    pythonProcess = spawn(pythonPath, pythonArgs);
  } catch (error) {
    console.error(`Failed to spawn Python process: ${error.message}`);
    res.status(500).send(`Failed to spawn Python process: ${error.message}`);
    return;
  }

  pythonProcess.on("error", (err) => {
    console.error(`Python process error: ${err.message}`);
    res.status(500).send(`Python process error: ${err.message}`);
  });

  pythonProcess.stdout.on("data", (data) => {
    const prediction = data.toString().trim();
    const result = prediction === "1" ? "scam" : "ham";
    res.json({ message, predicted_result: result, python_used: pythonPath });
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    res.status(500).send(data.toString());
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
