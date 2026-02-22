import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

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
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let holdTimer = null;
let lastUploadTime = 0;

/* ================= CONSTANTS ================= */

const MAX_DURATION = 15000; // 15 seconds
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const UPLOAD_COOLDOWN = 10000; // 10 seconds

/* =========================================================
   CAMERA START
========================================================= */

async function startCamera() {
  stopStream();

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: currentFacingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  video.srcObject = stream;
  video.muted = true;      // prevents feedback
  video.playsInline = true;
  await video.play();
}

/* ================= STOP STREAM ================= */

function stopStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

/* ================= MODE ================= */

cameraModeBtn.addEventListener("click", async () => {
  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";
  await startCamera();
});

galleryModeBtn.addEventListener("click", () => fileInput.click());

/* =========================================================
   TAP / HOLD
========================================================= */

recordBtn.addEventListener("mousedown", startHold);
recordBtn.addEventListener("touchstart", startHold);

recordBtn.addEventListener("mouseup", endHold);
recordBtn.addEventListener("mouseleave", endHold);
recordBtn.addEventListener("touchend", endHold);

function startHold(e) {
  e.preventDefault();
  holdTimer = setTimeout(() => startRecording(), 600);
}

function endHold(e) {
  e.preventDefault();
  clearTimeout(holdTimer);

  if (isRecording) stopRecording();
  else takePhoto();
}

/* ================= PHOTO ================= */

function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d").drawImage(video, 0, 0);

  canvas.toBlob(blob => {
    capturedBlob = blob;
    capturedType = "image/jpeg";
  }, "image/jpeg", 0.85);

  video.style.display = "none";
  canvas.style.display = "block";
  showPreviewButtons();
}

/* ================= VIDEO ================= */

// async function startRecording() {
//   isRecording = true;
//   recordBtn.classList.add("recording");

//   stopStream();

//   stream = await navigator.mediaDevices.getUserMedia({
//     video: {
//       facingMode: currentFacingMode,
//       width: { ideal: 1280 },
//       height: { ideal: 720 }
//     },
//     audio: {
//       echoCancellation: true,
//       noiseSuppression: true,
//       autoGainControl: true
//     }
//   });

//   video.srcObject = stream;
//   video.muted = true;
//   await video.play();

//   recordedChunks = [];
//   mediaRecorder = new MediaRecorder(stream, {
//     mimeType: "video/webm;codecs=vp8,opus"
//   });

//   mediaRecorder.ondataavailable = e => {
//     if (e.data.size > 0) recordedChunks.push(e.data);
//   };

//   mediaRecorder.onstop = () => {
//     capturedBlob = new Blob(recordedChunks, { type: "video/webm" });
//     capturedType = "video/webm";

//     stopStream();

//     video.srcObject = null;
//     video.src = URL.createObjectURL(capturedBlob);
//     video.controls = true;
//     video.muted = false;

//     showPreviewButtons();
//   };

//   mediaRecorder.start();

//   // Auto-stop after max duration
//   setTimeout(() => {
//     if (isRecording) stopRecording();
//   }, MAX_DURATION);
// }
function startRecording() {
  if (!stream) return;

  isRecording = true;
  recordBtn.classList.add("recording");

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp8,opus"
  });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    capturedBlob = new Blob(recordedChunks, { type: "video/webm" });
    capturedType = "video/webm";

    video.srcObject = null;
    video.src = URL.createObjectURL(capturedBlob);
    video.controls = true;
    video.muted = false;

    showPreviewButtons();
  };

  mediaRecorder.start();

  setTimeout(() => {
    if (isRecording) stopRecording();
  }, MAX_DURATION);
}
// function stopRecording() {
//   isRecording = false;
//   recordBtn.classList.remove("recording");

//   if (mediaRecorder && mediaRecorder.state !== "inactive") {
//     mediaRecorder.stop();
//   }
// }
function stopRecording() {
  isRecording = false;
  recordBtn.classList.remove("recording");

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}
/* ================= PREVIEW ================= */

function showPreviewButtons() {
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";

  retakeBtn.style.display = "inline-block";
  uploadBtn.style.display = "inline-block";
  shareBtn.style.display = "inline-block";
}

/* ================= RETAKE ================= */

// retakeBtn.addEventListener("click", async () => {
//   capturedBlob = null;
//   capturedType = null;

//   video.controls = false;
//   video.style.display = "block";
//   canvas.style.display = "none";

//   retakeBtn.style.display = "none";
//   uploadBtn.style.display = "none";
//   shareBtn.style.display = "none";

//   recordBtn.style.display = "block";
//   switchBtn.style.display = "inline-block";

//   await startCamera();
// });
retakeBtn.addEventListener("click", async () => {
  capturedBlob = null;
  capturedType = null;

  video.src = "";
  video.srcObject = null;
  video.controls = false;
  canvas.style.display = "none";

  retakeBtn.style.display = "none";
  uploadBtn.style.display = "none";
  shareBtn.style.display = "none";

  recordBtn.style.display = "block";
  switchBtn.style.display = "inline-block";

  modeSelection.style.display = "flex";
  cameraWrapper.style.display = "none";
  controls.style.display = "none";

  status.innerText = "";

  stopStream();
});

/* ================= UPLOAD ================= */

uploadBtn.addEventListener("click", async () => {
  if (!capturedBlob) return;

  // Cooldown protection
  if (Date.now() - lastUploadTime < UPLOAD_COOLDOWN) {
    status.innerText = "Please wait before uploading again.";
    return;
  }

  if (capturedBlob.size > MAX_FILE_SIZE) {
    status.innerText = "File too large. Please record shorter video.";
    return;
  }

  lastUploadTime = Date.now();
  uploadBtn.disabled = true;
  status.innerText = "Uploading...";

  const visibility = document.getElementById("visibility").value;
  const bucketName = visibility === "public" ? "public-pics" : "private-pics";

  const extension = capturedType.startsWith("image")
    ? "jpg"
    : "webm";

  const filePath = `memory_${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, capturedBlob, {
      contentType: capturedType,
      upsert: false
    });

  if (error) {
    status.innerText = "Upload failed 😢";
    uploadBtn.disabled = false;
    return;
  }

  await supabase.from("uploads").insert([{
    file_path: filePath,
    bucket: bucketName,
    file_type: capturedType
  }]);

  status.innerText = "Uploaded successfully 🤍";

  setTimeout(() => window.location.reload(), 1200);
});

/* ================= CLEANUP ================= */

window.addEventListener("beforeunload", () => {
  stopStream();
});