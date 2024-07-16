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

  // Specify the full path to python3 executable
  const pythonPath = "/opt/miniconda3/bin/python3"; // Adjust path for your system

  const pythonProcess = spawn(pythonPath, [
    path.join(__dirname, "predict.py"),
    message,
    modelPath,
    vectorizerPath,
  ]);

  pythonProcess.stdout.on("data", (data) => {
    const prediction = data.toString().trim();
    const result = prediction === "1" ? "scam" : "ham";
    res.json({ message, predicted_result: result });
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    res.status(500).send(data.toString());
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
