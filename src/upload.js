import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// document.addEventListener("DOMContentLoaded", () => {

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================= ELEMENTS ================= */

const modeSelection = document.getElementById("modeSelection");
const cameraModeBtn = document.getElementById("cameraModeBtn");
const galleryModeBtn = document.getElementById("galleryModeBtn");
const fileInput = document.getElementById("fileInput");

const cameraWrapper = document.querySelector(".camera-wrapper");
const controls = document.querySelector(".controls");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const recordBtn = document.getElementById("recordBtn");
const switchBtn = document.getElementById("switchBtn");
const retakeBtn = document.getElementById("retakeBtn");
const uploadBtn = document.getElementById("uploadBtn");
const shareBtn = document.getElementById("shareBtn");
const status = document.getElementById("status");

/* ================= STATE ================= */

let stream = null;
let currentFacingMode = "environment";
let capturedBlob = null;
let capturedType = null;

/* =========================================================
   MODE SELECTION
========================================================= */

cameraModeBtn.addEventListener("click", async () => {
  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";
  await startCamera();
});

galleryModeBtn.addEventListener("click", () => {
  fileInput.click();
});

/* =========================================================
   EXISTING FILE UPLOAD (FIXED)
========================================================= */

fileInput.addEventListener("change", (e) => {

  const file = e.target.files[0];
  if (!file) return;

  capturedBlob = file;
  capturedType = file.type;

  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";

  recordBtn.style.display = "none";
  switchBtn.style.display = "none";

  if (file.type.startsWith("image")) {

    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);

      video.style.display = "none";
      canvas.style.display = "block";
    };

    img.src = URL.createObjectURL(file);

  } else {

    video.src = URL.createObjectURL(file);
    video.controls = true;
    video.style.display = "block";
    canvas.style.display = "none";

  }

  /* =========================================================
   PHOTO (TAP) + VIDEO (HOLD) CAPTURE
========================================================= */

let mediaRecorder = null;
let recordedChunks = [];
let holdTimeout = null;
let isRecording = false;

/* ----------- TAP = PHOTO ----------- */

recordBtn.addEventListener("click", () => {

  // If it was a hold recording, ignore click
  if (isRecording) return;

  capturePhoto();
});

function capturePhoto() {

  if (!stream) return;

  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    capturedBlob = blob;
    capturedType = "image/jpeg";
  }, "image/jpeg", 0.9);

  stopCameraStream();

  video.style.display = "none";
  canvas.style.display = "block";

  showPreviewButtons();
}

/* ----------- HOLD = VIDEO ----------- */

recordBtn.addEventListener("mousedown", startHold);
recordBtn.addEventListener("touchstart", startHold);

recordBtn.addEventListener("mouseup", stopHold);
recordBtn.addEventListener("mouseleave", stopHold);
recordBtn.addEventListener("touchend", stopHold);

function startHold() {

  holdTimeout = setTimeout(() => {
    startRecording();
  }, 300); // 300ms hold threshold
}

function stopHold() {

  clearTimeout(holdTimeout);

  if (isRecording) {
    stopRecording();
  }
}

function startRecording() {

  if (!stream) return;

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {

    const blob = new Blob(recordedChunks, { type: "video/webm" });

    capturedBlob = blob;
    capturedType = "video/webm";

    video.srcObject = null;
    video.src = URL.createObjectURL(blob);
    video.controls = true;

    stopCameraStream();

    showPreviewButtons();
  };

  mediaRecorder.start();
  isRecording = true;
  recordBtn.classList.add("recording");
}

function stopRecording() {

  mediaRecorder.stop();
  isRecording = false;
  recordBtn.classList.remove("recording");
}

/* ----------- STOP CAMERA ----------- */

function stopCameraStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}
  showPreviewButtons();
});

/* =========================================================
   CAMERA
========================================================= */

async function startCamera() {

  if (stream) stream.getTracks().forEach(t => t.stop());

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: true
    });

    video.srcObject = stream;
    video.style.display = "block";
    canvas.style.display = "none";

  } catch (err) {
    status.innerText = "Camera permission denied.";
  }
}

switchBtn.addEventListener("click", async () => {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  await startCamera();
});

/* =========================================================
   PREVIEW STATE
========================================================= */

function showPreviewButtons() {

  retakeBtn.style.display = "inline-block";
  shareBtn.style.display = "inline-block";
  uploadBtn.style.display = "inline-block";
}

/* =========================================================
   RETAKE
========================================================= */

retakeBtn.addEventListener("click", () => {

  capturedBlob = null;
  capturedType = null;

  video.src = "";
  video.srcObject = null;
  video.controls = false;

  canvas.style.display = "none";

  retakeBtn.style.display = "none";
  shareBtn.style.display = "none";
  uploadBtn.style.display = "none";

  cameraWrapper.style.display = "none";
  controls.style.display = "none";
  modeSelection.style.display = "flex";

  fileInput.value = ""; // IMPORTANT RESET
});

/* =========================================================
   SHARE (Native Mobile Share)
========================================================= */

shareBtn.addEventListener("click", async () => {

  if (!capturedBlob) return;

  const ext = capturedType.startsWith("image") ? "jpg" : "webm";
  const file = new File(
    [capturedBlob],
    `wedding_memory_${Date.now()}.${ext}`,
    { type: capturedType }
  );

  try {

    if (navigator.share && navigator.canShare?.({ files: [file] })) {

      await navigator.share({
        title: "Wedding Memory 🤍",
        text: "Captured at the Wedding ✨",
        files: [file]
      });

    } else {

      const url = URL.createObjectURL(capturedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();

    }

  } catch (err) {
    console.log("Share cancelled");
  }
});

/* =========================================================
   UPLOAD TO SUPABASE
========================================================= */

uploadBtn.addEventListener("click", async () => {

  if (!capturedBlob) return;

  status.innerText = "Uploading...";

  const ext = capturedType.startsWith("image") ? "jpg" : "webm";
  const filePath = `memory_${Date.now()}.${ext}`;

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

  status.innerText = "Uploaded successfully 🤍";

  retakeBtn.click();
});