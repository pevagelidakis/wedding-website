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
let holdTimeout = null;
let isRecording = false;

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
   GALLERY UPLOAD
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

  showPreviewButtons();
});

/* =========================================================
   CAMERA
========================================================= */

/* ================= CAMERA ================= */

async function startCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacingMode },
    audio: true
  });

  video.srcObject = stream;
}

startCamera();

/* ================= SWITCH ================= */

switchBtn.addEventListener("click", async () => {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  await startCamera();
});

/* ================= TAP / HOLD ================= */

let holdTimer;

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
  }, "image/jpeg", 0.9);

  video.style.display = "none";
  canvas.style.display = "block";

  showPreviewButtons();
}

/* ================= VIDEO ================= */

function startRecording() {
  isRecording = true;
  recordBtn.classList.add("recording");

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    capturedBlob = new Blob(recordedChunks, { type: "video/webm" });
    capturedType = "video/webm";

    video.srcObject = null;
    video.src = URL.createObjectURL(capturedBlob);
    video.controls = true;

    showPreviewButtons();
  };

  mediaRecorder.start();
}

function stopRecording() {
  isRecording = false;
  recordBtn.classList.remove("recording");
  mediaRecorder.stop();
}

/* ================= PREVIEW MODE ================= */

function showPreviewButtons() {
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";

  retakeBtn.style.display = "inline-block";
  uploadBtn.style.display = "inline-block";
  shareBtn.style.display = "inline-block";
}

/* ================= RETAKE ================= */

retakeBtn.addEventListener("click", async () => {
  capturedBlob = null;
  capturedType = null;

  video.controls = false;
  video.style.display = "block";
  canvas.style.display = "none";

  retakeBtn.style.display = "none";
  uploadBtn.style.display = "none";
  shareBtn.style.display = "none";

  recordBtn.style.display = "block";
  switchBtn.style.display = "inline-block";

  await startCamera();
});

/* ================= SHARE ================= */

shareBtn.addEventListener("click", async () => {
  if (!capturedBlob) return;

  try {
    const extension =
      capturedType === "image/jpeg" ? "jpg" : "webm";

    const fileName = `Panos_Marianna_Wedding_${Date.now()}.${extension}`;

    const file = new File(
      [capturedBlob],
      fileName,
      { type: capturedType }
    );

    // ✅ Mobile native share (Instagram, Gmail, Messenger etc)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {

      await navigator.share({
        title: "Wedding Memory 🤍",
        text: "Captured at Panos & Marianna’s Wedding ✨",
        files: [file]
      });

      status.innerText = "Shared successfully 🤍";

    } else {
      // 🖥 Desktop fallback
      const url = URL.createObjectURL(capturedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      status.innerText = "Downloaded (Sharing not supported on this device)";
    }

  } catch (err) {
    console.error(err);
    status.innerText = "Sharing cancelled or not supported.";
  }
});


/* ================= UPLOAD ================= */

uploadBtn.addEventListener("click", async () => {
  if (!capturedBlob) return;

  status.innerText = "Uploading...";
  const visibilitySelect = document.getElementById("visibility");
  const selectedVisibility = visibilitySelect.value
  const bucketName = selectedVisibility === "public"
    ? "public-pics"
    : "private-pics";
  const extension =
    capturedType === "image/jpeg" ? "jpg" : "webm";

  const filePath = `memory_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, capturedBlob, { upsert: true });

  if (error) {
    status.innerText = "Upload failed 😢";
    return;
  }

  await supabase.from("uploads").insert([{
    file_path: filePath,
    bucket:bucketName,
    file_type: capturedType,
    // visibility: selectedVisibility
  }]);

  status.innerText = "Uploaded successfully 🤍";

  // retakeBtn.click();
  setTimeout(() => {
  window.location.reload();
}, 1000);
});