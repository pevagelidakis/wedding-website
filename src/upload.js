import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const recordBtn = document.getElementById("recordBtn");
const switchBtn = document.getElementById("switchBtn");
const retakeBtn = document.getElementById("retakeBtn");
const uploadBtn = document.getElementById("uploadBtn");
const shareBtn = document.getElementById("shareBtn");
const status = document.getElementById("status");

let stream;
let currentFacingMode = "environment";
let mediaRecorder;
let recordedChunks = [];
let capturedBlob = null;
let capturedType = null;
let isRecording = false;

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

  const file = new File([capturedBlob], "memory", {
    type: capturedType
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Wedding Memory 🤍",
      text: "Captured this beautiful moment!"
    });
  } else {
    const url = URL.createObjectURL(capturedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memory";
    a.click();
  }
});

/* ================= UPLOAD ================= */

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

  status.innerText = "Uploaded successfully 🤍";

  retakeBtn.click();
});