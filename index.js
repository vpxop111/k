const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());

app.post("/predict", (req, res) => {
  const message = req.body.message;
  const modelPath = path.join(__dirname, "scams.pth");
  const vectorizerPath = path.join(__dirname, "vectt.pkl");

  const pythonPath = process.env.PYTHON_PATH; // Fetch Python path from environment variable

  if (!pythonPath) {
    const errorMessage = "PYTHON_PATH environment variable is not set.";
    console.error(errorMessage);
    res.status(500).send(errorMessage);
    return;
  }

  let pythonProcess;

  try {
    pythonProcess = spawn(pythonPath, [
      path.join(__dirname, "predict.py"),
      message,
      modelPath,
      vectorizerPath,
    ]);
  } catch (error) {
    console.error(`Failed to spawn Python process: ${error.message}`);
    res.status(500).send(`Failed to spawn Python process: ${error.message}`);
    return;
  }

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
