const express = require("express");
const {Storage} = require("@google-cloud/storage");
const {exec} = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
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
    // Download files
    await storage.bucket(AUDIO_BUCKET).file(audioFile).download({destination: audioFile});
    await storage.bucket(IMAGE_BUCKET).file(imageFile).download({destination: imageFile});

    console.log("Files downloaded!");

    // FFmpeg test command: combine image + audio → MP4
    const ffmpegCmd = `ffmpeg -loop 1 -i ${imageFile} -i ${audioFile} -c:v libx264 -t 10 -pix_fmt yuv420p -vf scale=1280:720 ${outputFile}`;

    exec(ffmpegCmd, async (err) => {
      if (err) {
        console.error("FFmpeg Error:", err);
        return res.status(500).json({error: "FFmpeg failed"});
      }

      console.log("FFmpeg success! Uploading...");

      await storage.bucket(OUTPUT_BUCKET).upload(outputFile);

      console.log("Upload done!");

      // Cleanup local files
      fs.unlinkSync(audioFile);
      fs.unlinkSync(imageFile);
      fs.unlinkSync(outputFile);

      return res.json({success: true, message: "Test video created + uploaded!"});
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({error: error.message});
  }
});

app.get("/", (req, res) => res.send("Autopilot Test Ready!"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server running on port", PORT));
