const { spawn } = require("child_process");
const path = require("path");

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const message = req.body.message;
    const modelPath = path.join(process.cwd(), "model", "scams.pth");
    const vectorizerPath = path.join(process.cwd(), "model", "vectt.pkl");
    const pythonPath = process.env.PYTHON_PATH || "python";
    const pythonScriptPath = path.join(process.cwd(), "model", "predict.py");

    const pythonArgs = [pythonScriptPath, message, modelPath, vectorizerPath];

    try {
      const pythonProcess = spawn(pythonPath, pythonArgs);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error output: ${errorOutput}`);
          res.status(500).json({ error: "Internal server error" });
        } else {
          const prediction = output.trim();
          const result = prediction === "1" ? "scam" : "ham";
          res
            .status(200)
            .json({
              message,
              predicted_result: result,
              python_used: pythonPath,
            });
        }
      });
    } catch (error) {
      console.error(`Failed to spawn Python process: ${error.message}`);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};
