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
const galleryPreview = document.getElementById("galleryPreview");
const recordBtn = document.getElementById("recordBtn");
const switchBtn = document.getElementById("switchBtn");
const retakeBtn = document.getElementById("retakeBtn");
const uploadBtn = document.getElementById("uploadBtn");
const shareBtn = document.getElementById("shareBtn");
const status = document.getElementById("status");

/* ================= STATE ================= */
let stream = null;
let currentFacingMode = "environment"; // front or back camera
let capturedFiles = []; // { blob, type }
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let holdTimer = null;

const MAX_DURATION = 15000; // 15 sec
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/* ================= CAMERA ================= */
async function startCamera() {
  stopStream();
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

/* ================= MODE SELECTION ================= */
cameraModeBtn.addEventListener("click", async () => {
  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";
  galleryPreview.style.display = "none";
  await startCamera();
});

galleryModeBtn.addEventListener("click", () => fileInput.click());

switchBtn.addEventListener("click", async () => {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  await startCamera();
});

/* ================= TAP / HOLD ================= */
recordBtn.addEventListener("mousedown", startHold);
recordBtn.addEventListener("touchstart", startHold);
recordBtn.addEventListener("mouseup", endHold);
recordBtn.addEventListener("mouseleave", endHold);
recordBtn.addEventListener("touchend", endHold);

function startHold(e) {
  e.preventDefault();
  holdTimer = setTimeout(() => startRecording(), 300);
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
    capturedFiles.push({ blob, type: "image/jpeg" });
  }, "image/jpeg", 0.85);

  video.style.display = "none";
  canvas.style.display = "block";
  galleryPreview.style.display = "none";  // hide gallery preview
  showPreviewButtons();
}

/* ================= VIDEO ================= */
function startRecording() {
  if (!stream) return;

  isRecording = true;
  recordBtn.classList.add("recording");
  recordedChunks = [];

  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    capturedFiles.push({ blob, type: "video/webm" });

    video.srcObject = null;
    video.src = URL.createObjectURL(blob);
    video.controls = true;
    video.muted = false;

    canvas.style.display = "none";
    video.style.display = "block";
    galleryPreview.style.display = "none";
    showPreviewButtons();
  };

  mediaRecorder.start();

  setTimeout(() => {
    if (isRecording) stopRecording();
  }, MAX_DURATION);
}

function stopRecording() {
  isRecording = false;
  recordBtn.classList.remove("recording");
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
}
/* ================= PREVIEW ================= */
function showPreviewButtons() {
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";
  retakeBtn.style.display = "inline-block";
  uploadBtn.style.display = "inline-block";
  shareBtn.style.display = "inline-block";
}

// Add preview to gallery container
function showPreview(blob, type) {
  galleryPreview.style.display = "flex";

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100px";
  wrapper.style.height = "100px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.overflow = "hidden";
  wrapper.style.marginRight = "8px";

  let element;
  if (type === "image") {
    element = document.createElement("img");
    element.src = URL.createObjectURL(blob);
  } else {
    element = document.createElement("video");
    element.src = URL.createObjectURL(blob);
    element.muted = true;
    element.playsInline = true;
  }
  element.style.width = "100%";
  element.style.height = "100%";
  element.style.objectFit = "cover";

  const removeBtn = document.createElement("button");
  removeBtn.innerText = "✕";
  removeBtn.style.position = "absolute";
  removeBtn.style.top = "4px";
  removeBtn.style.right = "4px";
  removeBtn.style.background = "rgba(0,0,0,0.6)";
  removeBtn.style.color = "#fff";
  removeBtn.style.border = "none";
  removeBtn.style.borderRadius = "50%";
  removeBtn.style.width = "22px";
  removeBtn.style.height = "22px";
  removeBtn.style.cursor = "pointer";
  removeBtn.onclick = () => {
    wrapper.remove();
    capturedFiles = capturedFiles.filter(f => f.blob !== blob);
  };

  wrapper.appendChild(element);
  wrapper.appendChild(removeBtn);
  galleryPreview.appendChild(wrapper);
}

/* ================= RETAKE ================= */
retakeBtn.addEventListener("click", async () => {
  capturedFiles = [];
  galleryPreview.innerHTML = "";
  galleryPreview.style.display = "none";  // hide gallery preview

  video.style.display = "block";          // show camera view
  canvas.style.display = "none";          // hide canvas
  video.controls = false;
  video.src = "";
  video.srcObject = null;

  retakeBtn.style.display = "none";
  uploadBtn.style.display = "none";
  shareBtn.style.display = "none";
  recordBtn.style.display = "block";
  switchBtn.style.display = "inline-block";
  modeSelection.style.display = "flex";
  cameraWrapper.style.display = "block";  // show camera wrapper
  controls.style.display = "flex";
  status.innerText = "";

  await startCamera();                     // restart camera preview
});

/* ================= GALLERY FILES ================= */
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  stopStream();
  capturedFiles = [];
  files.forEach(file => {
    capturedFiles.push({ blob: file, type: file.type });
    showPreview(file, file.type.startsWith("image") ? "image" : "video");
  });
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";
//   galleryPreview.innerHTML = "";
  galleryPreview.style.display = "flex";


  modeSelection.style.display = "none";
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";
  showPreviewButtons();
});
/* ================= UPLOAD ================= */
uploadBtn.addEventListener("click", async () => {
  if (!capturedFiles.length) return;

  uploadBtn.disabled = true;
  status.innerText = "Uploading...";

  try {
    const visibility = document.getElementById("visibility").value;
    const bucketName = visibility === "public"
      ? "public-pics"
      : "private-pics";

    const uploadedFiles = await uploadFiles(bucketName);

    if (uploadedFiles.length > 0) {
      const { error } = await supabase
        .from("uploads")
        .insert(uploadedFiles);

      if (error) {
        console.error("DB Insert Error:", error);
        throw error;
      }
    }

    status.innerText = "Uploaded successfully 🤍";
  } catch (err) {
    console.error(err);
    status.innerText = "Upload failed. Please try again.";
  } finally {
    uploadBtn.disabled = false;
    window.location.reload()
  }
});


/* ================= SHARE ================= */
shareBtn.addEventListener("click", async () => {
  if (!capturedFiles.length) {
    status.innerText = "No files to share 🤍";
    return;
  }

  try {
    const filesToShare = capturedFiles.map(fileObj => {
      const ext = fileObj.type.startsWith("image") ? "jpg" : "webm";
      return new File([fileObj.blob], `wedding_memory_${Date.now()}.${ext}`, { type: fileObj.type });
    });

    if (navigator.share && navigator.canShare({ files: filesToShare })) {
      await navigator.share({
        title: "Wedding Memories 🤍",
        text: "Captured at the wedding ✨",
        files: filesToShare
      });
      status.innerText = "Shared successfully 🤍";
    } else {
      status.innerText = "Sharing not supported on this device, try uploading instead.";
    }

  } catch (err) {
    console.error(err);
    status.innerText = "Sharing failed or canceled.";
  }
});

async function compressImage(file, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / img.width);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
    };
  });
}

async function uploadWithRetry(bucket, path, file, retries = 3) {
  let attempt = 0;

  while (attempt < retries) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      });

    if (!error) return true;

    attempt++;
    await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff
  }

  return false;
}

async function uploadFiles(bucketName) {
  const successfulUploads = [];

  const tasks = capturedFiles.map(async (fileObj) => {

    if (fileObj.blob.size > MAX_FILE_SIZE) return null;

    let file = fileObj.blob;

    if (fileObj.type.startsWith("image")) {
      file = await compressImage(file);
    }

    const extension = fileObj.type.startsWith("image") ? "jpg" : "webm";
    const filePath = `memory_${crypto.randomUUID()}.${extension}`;

    const success = await uploadWithRetry(bucketName, filePath, file);

    if (success) {
      successfulUploads.push({
        file_path: filePath,
        file_type: file.type,
        visibility: bucketName === "public-pics" ? "public" : "private"
      });
    }

    return success;
  });

  await Promise.all(tasks);
  return successfulUploads;
}

/* ================= CLEANUP ================= */
window.addEventListener("beforeunload", stopStream);
// /* ================= ELEMENTS ================= */
