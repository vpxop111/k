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

  const pythonPaths = [
    "/opt/miniconda3/bin/python3",
    "/opt/homebrew/bin/python3",
    "/usr/local/bin/python3",
    "/usr/bin/python3",
  ];

  let pythonProcess;
  let chosenPath = "";

  // Try each Python path until one works
  for (const pythonPath of pythonPaths) {
    try {
      pythonProcess = spawn(pythonPath, [
        path.join(__dirname, "predict.py"),
        message,
        modelPath,
        vectorizerPath,
      ]);
      chosenPath = pythonPath;
      break; // Exit the loop if spawn succeeds
    } catch (error) {
      console.error(
        `Failed to spawn Python process using ${pythonPath}: ${error.message}`
      );
    }
  }

  if (!pythonProcess) {
    // If none of the paths worked
    const errorMessage = `Failed to spawn Python process using any of the paths: ${pythonPaths.join(
      ", "
    )}`;
    console.error(errorMessage);
    res.status(500).send(errorMessage);
    return;
  }

  pythonProcess.stdout.on("data", (data) => {
    const prediction = data.toString().trim();
    const result = prediction === "1" ? "scam" : "ham";
    res.json({ message, predicted_result: result, python_used: chosenPath });
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    res.status(500).send(data.toString());
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
