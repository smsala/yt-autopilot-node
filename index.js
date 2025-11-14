const express = require("express");
const { Storage } = require("@google-cloud/storage");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json());

const storage = new Storage();

const AUDIO_BUCKET = "video-audioyt";
const IMAGE_BUCKET = "video-imagesyt";
const OUTPUT_BUCKET = "video-finalyt";

app.post("/process-next-video", async (req, res) => {
  console.log("Starting test video generation...");

  const audioFile = "test.mp3";
  const imageFile = "test.jpg";
  const outputFile = "output-test.mp4";

  try {
    // Download test files
    await storage.bucket(AUDIO_BUCKET).file(audioFile).download({ destination: audioFile });
    await storage.bucket(IMAGE_BUCKET).file(imageFile).download({ destination: imageFile });
    console.log("Files downloaded successfully!");

    // FFmpeg command: create 10-sec video
    const cmd = `ffmpeg -loop 1 -i ${imageFile} -i ${audioFile} -c:v libx264 -t 10 -pix_fmt yuv420p -vf scale=1280:720 ${outputFile}`;

    exec(cmd, async (err, stdout, stderr) => {
      if (err) {
        console.log("FFmpeg Error:", stderr);
        return res.status(500).json({ error: "FFmpeg failed" });
      }

      console.log("FFmpeg success! Uploading final video...");

      await storage.bucket(OUTPUT_BUCKET).upload(outputFile);

      // Cleanup
      fs.unlinkSync(audioFile);
      fs.unlinkSync(imageFile);
      fs.unlinkSync(outputFile);

      res.json({
        status: "success",
        message: "Test video generated & uploaded!"
      });
    });

  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("YouTube autopilot Cloud Run service is running.");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
