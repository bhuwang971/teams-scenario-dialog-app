const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "env", ".env.dev") });

const PORT = parseInt(process.env.PORT || "3978", 10);
const scenarioApiBase =
  process.env.SCENARIO_API_BASE ||
  "https://da-adaptive-card-dialog-api.salmonbush-d5bb9b4c.eastus.azurecontainerapps.io";
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || "http://localhost:3978").replace(/\/$/, "");

const app = express();
app.use(express.json());
app.use("/tab", express.static(path.join(__dirname, "public", "tab")));
app.use("/dialog", express.static(path.join(__dirname, "public", "dialog")));

app.get("/api/proxy/scenario/start", async (_req, res) => {
  try {
    const response = await fetch(`${scenarioApiBase}/api/scenario/start`);
    const payload = await response.json();
    res.status(response.status).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/proxy/scenario/compute", async (req, res) => {
  try {
    const runId = String(req.query.runId || "");
    if (!runId) {
      return res.status(400).json({ error: "Missing runId query parameter." });
    }

    const response = await fetch(
      `${scenarioApiBase}/api/scenario/compute?runId=${encodeURIComponent(runId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body || {}),
      }
    );

    const payload = await response.json();
    res.status(response.status).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/proxy/scenario/results", async (_req, res) => {
  try {
    const response = await fetch(`${scenarioApiBase}/api/scenario/results`);
    const payload = await response.json();
    res.status(response.status).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (_req, res) => {
  res.status(200).send("Teams Scenario Dialog Tab App is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Public base URL: ${publicBaseUrl}`);
  console.log(`Scenario API base: ${scenarioApiBase}`);
});
