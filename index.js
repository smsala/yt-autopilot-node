const express = require("express");
const app = express();

app.use(express.json());

// health check route
app.get("/", (req, res) => {
  res.send("YouTube autopilot Cloud Run service is running.");
});

// yeh route baad mein autopilot banega (Google Sheet se title utha ke video banane ke liye)
app.post("/process-next-video", async (req, res) => {
  console.log("Received request to process next video...");

  // TODO:
  // 1) Google Sheet se next row read karna
  // 2) Lamba script generate karna (LLM se)
  // 3) Google TTS se voice banana
  // 4) Images generate + FFmpeg se video banana
  // 5) YouTube API se upload karna

  res.json({ ok: true, message: "Placeholder: processing logic will be added here." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
