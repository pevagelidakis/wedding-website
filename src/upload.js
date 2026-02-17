import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const startBtn = document.getElementById("startBtn");
const switchBtn = document.getElementById("switchBtn");
const photoBtn = document.getElementById("photoBtn");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");

let stream;
let currentFacingMode = "environment";
let mediaRecorder;
let recordedChunks = [];
let capturedBlob;
let capturedType = null;

/* ===============================
   START CAMERA
================================= */
async function startCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: true
    });

    video.srcObject = stream;

    switchBtn.style.display = "inline-block";
    photoBtn.style.display = "inline-block";
    recordBtn.style.display = "inline-block";
    startBtn.style.display = "none";

  } catch (err) {
    status.innerText = "Camera permission denied.";
  }
}

startBtn.addEventListener("click", startCamera);

/* ===============================
   SWITCH CAMERA
================================= */
switchBtn.addEventListener("click", async () => {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  await startCamera();
});

/* ===============================
   TAKE PHOTO
================================= */
photoBtn.addEventListener("click", () => {

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.style.display = "block";
  video.style.display = "none";

  canvas.toBlob((blob) => {
    capturedBlob = blob;
    capturedType = "image/jpeg";
  }, "image/jpeg", 0.9);

  uploadBtn.style.display = "inline-block";
});

/* ===============================
   RECORD VIDEO
================================= */
recordBtn.addEventListener("click", () => {

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    capturedBlob = new Blob(recordedChunks, { type: "video/webm" });
    capturedType = "video/webm";

    const videoURL = URL.createObjectURL(capturedBlob);
    video.srcObject = null;
    video.src = videoURL;
    video.controls = true;

    uploadBtn.style.display = "inline-block";
  };

  mediaRecorder.start();

  recordBtn.style.display = "none";
  stopBtn.style.display = "inline-block";
});

/* ===============================
   STOP RECORDING
================================= */
stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  stopBtn.style.display = "none";
});

/* ===============================
   UPLOAD
================================= */
uploadBtn.addEventListener("click", async () => {

  if (!capturedBlob) return;

  status.innerText = "Uploading...";

  const extension =
    capturedType === "image/jpeg" ? "jpg" : "webm";

  const filePath = `memory_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("public-pics")
    .upload(filePath, capturedBlob, { upsert: true });

  if (error) {
    status.innerText = "Upload failed 😢";
    return;
  }

  await supabase.from("uploads").insert([{
    file_path: filePath,
    file_type: capturedType,
    visibility: "public"
  }]);

  status.innerText = "Uploaded successfully! 🎉";

  resetCamera();
});

/* ===============================
   RESET
================================= */
function resetCamera() {
  capturedBlob = null;
  capturedType = null;

  video.controls = false;
  video.style.display = "block";
  canvas.style.display = "none";
  uploadBtn.style.display = "none";
}