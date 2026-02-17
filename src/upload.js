import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");

let stream;
let capturedBlob;

// 🎥 Start Camera
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;

    startBtn.style.display = "none";
    captureBtn.style.display = "inline-block";

  } catch (err) {
    status.innerText = "Camera permission denied.";
  }
});

// 📸 Capture Photo
captureBtn.addEventListener("click", () => {

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.style.display = "block";
  video.style.display = "none";

  captureBtn.style.display = "none";
  uploadBtn.style.display = "inline-block";

  // Convert to blob
  canvas.toBlob((blob) => {
    capturedBlob = blob;
  }, "image/jpeg", 0.9);
});

// ☁ Upload to Supabase
uploadBtn.addEventListener("click", async () => {

  if (!capturedBlob) return;

  status.innerText = "Uploading...";

  const filePath = `photo_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("public-pics")
    .upload(filePath, capturedBlob);

  if (error) {
    status.innerText = "Upload failed 😢";
    return;
  }

  await supabase.from("uploads").insert([{
    file_path: filePath,
    file_type: "image/jpeg",
    visibility: "public"
  }]);

  status.innerText = "Uploaded successfully! 🎉";

  // Stop camera
  stream.getTracks().forEach(track => track.stop());
});