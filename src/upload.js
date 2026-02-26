// Pinned to same version as gallery/admin — avoids DataCloneError
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* ─── CONFIG ─────────────────────────────────────────────── */
const SUPABASE_URL      = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";
const PUBLIC_BUCKET     = "public-pics";
const PRIVATE_BUCKET    = "private-pics";
const MAX_DURATION      = 15000;           // 15s max video
const MAX_FILE_SIZE     = 25 * 1024 * 1024; // 25MB

/* ─── DOM ────────────────────────────────────────────────── */
const modeSelection  = document.getElementById("modeSelection");
const cameraModeBtn  = document.getElementById("cameraModeBtn");
const galleryModeBtn = document.getElementById("galleryModeBtn");
const fileInput      = document.getElementById("fileInput");
const cameraWrapper  = document.querySelector(".camera-wrapper");
const controls       = document.querySelector(".controls");
const videoEl        = document.getElementById("video");
const canvasEl       = document.getElementById("canvas");
const galleryPreview = document.getElementById("galleryPreview");
const recordBtn      = document.getElementById("recordBtn");
const switchBtn      = document.getElementById("switchBtn");
const retakeBtn      = document.getElementById("retakeBtn");
const uploadBtn      = document.getElementById("uploadBtn");
const shareBtn       = document.getElementById("shareBtn");
const statusEl       = document.getElementById("status");
const progressWrap   = document.getElementById("progressWrap");
const progressFill   = document.getElementById("progressFill");
const progressLabel  = document.getElementById("progressLabel");
const toastEl        = document.getElementById("toast");

/* ─── STATE ──────────────────────────────────────────────── */
const supabase     = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let stream         = null;
let facingMode     = "environment";
let capturedFiles  = [];           // [{ blob, type }]
let mediaRecorder  = null;
let recordedChunks = [];
let isRecording    = false;
let holdTimer      = null;

/* ─── TOAST ──────────────────────────────────────────────── */
let toastTimer;
function toast(msg, duration = 3000) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), duration);
}

function setStatus(msg) { statusEl.textContent = msg; }

/* ─── CAMERA ─────────────────────────────────────────────── */
async function startCamera() {
  stopStream();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    videoEl.srcObject = stream;
    videoEl.muted     = true;
    await videoEl.play();
  } catch (err) {
    console.error("[camera]", err);
    setStatus("Camera access denied or unavailable.");
  }
}

function stopStream() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
}

/* ─── MODE SELECTION ─────────────────────────────────────── */
cameraModeBtn.addEventListener("click", async () => {
  modeSelection.style.display    = "none";
  cameraWrapper.style.display    = "block";
  controls.style.display         = "flex";
  galleryPreview.style.display   = "none";
  videoEl.style.display          = "block";
  canvasEl.style.display         = "none";
  await startCamera();
});

galleryModeBtn.addEventListener("click", () => fileInput.click());

switchBtn.addEventListener("click", async () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  await startCamera();
});

/* ─── TAP / HOLD ─────────────────────────────────────────── */
recordBtn.addEventListener("pointerdown", startHold);
recordBtn.addEventListener("pointerup",   endHold);
recordBtn.addEventListener("pointerleave", endHold);

function startHold(e) {
  e.preventDefault();
  holdTimer = setTimeout(() => startRecording(), 300);
}

function endHold(e) {
  e.preventDefault();
  clearTimeout(holdTimer);
  if (isRecording) stopRecording();
  else             takePhoto();
}

/* ─── PHOTO ──────────────────────────────────────────────── */
function takePhoto() {
  canvasEl.width  = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  canvasEl.getContext("2d").drawImage(videoEl, 0, 0);

  canvasEl.toBlob(blob => {
    if (!blob) return;
    capturedFiles.push({ blob, type: "image/jpeg" });
  }, "image/jpeg", 0.85);

  videoEl.style.display          = "none";
  canvasEl.style.display         = "block";
  galleryPreview.style.display   = "none";
  showActionButtons();
}

/* ─── VIDEO ──────────────────────────────────────────────── */
function startRecording() {
  if (!stream) return;
  isRecording    = true;
  recordedChunks = [];
  recordBtn.classList.add("recording");

  // Pick best supported codec
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    .find(t => MediaRecorder.isTypeSupported(t)) || "";

  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    capturedFiles.push({ blob, type: "video/webm" });

    videoEl.srcObject  = null;
    videoEl.src        = URL.createObjectURL(blob);
    videoEl.controls   = true;
    videoEl.muted      = false;
    videoEl.style.display        = "block";
    canvasEl.style.display       = "none";
    galleryPreview.style.display = "none";
    showActionButtons();
  };

  mediaRecorder.start();
  setTimeout(() => { if (isRecording) stopRecording(); }, MAX_DURATION);
}

function stopRecording() {
  isRecording = false;
  recordBtn.classList.remove("recording");
  if (mediaRecorder?.state !== "inactive") mediaRecorder.stop();
}

/* ─── ACTION BUTTONS ─────────────────────────────────────── */
function showActionButtons() {
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";
  [retakeBtn, uploadBtn, shareBtn].forEach(b => b.style.display = "inline-flex");

  // Only show Share on mobile devices that support it
  shareBtn.style.display = navigator.share ? "inline-flex" : "none";
}

/* ─── GALLERY PREVIEW THUMB ──────────────────────────────── */
function addPreviewThumb(blob, type) {
  galleryPreview.style.display = "flex";

  const wrapper   = document.createElement("div");
  wrapper.className = "preview-thumb";

  const el = type === "image"
    ? Object.assign(document.createElement("img"),    { src: URL.createObjectURL(blob) })
    : Object.assign(document.createElement("video"),  { src: URL.createObjectURL(blob), muted: true, playsInline: true });

  const rm  = document.createElement("button");
  rm.className   = "preview-remove";
  rm.textContent = "✕";
  rm.onclick = () => {
    wrapper.remove();
    capturedFiles = capturedFiles.filter(f => f.blob !== blob);
    if (!capturedFiles.length) galleryPreview.style.display = "none";
  };

  wrapper.append(el, rm);
  galleryPreview.appendChild(wrapper);
}

/* ─── RETAKE ─────────────────────────────────────────────── */
retakeBtn.addEventListener("click", async () => {
  capturedFiles          = [];
  galleryPreview.innerHTML = "";
  galleryPreview.style.display = "none";

  videoEl.style.display  = "block";
  canvasEl.style.display = "none";
  videoEl.controls = false;
  videoEl.src      = "";
  videoEl.srcObject = null;

  [retakeBtn, uploadBtn, shareBtn].forEach(b => b.style.display = "none");
  recordBtn.style.display = "block";
  switchBtn.style.display = "inline-block";
  modeSelection.style.display  = "flex";
  cameraWrapper.style.display  = "block";
  controls.style.display       = "flex";
  setStatus("");

  await startCamera();
});

/* ─── FILE INPUT (gallery mode) ──────────────────────────── */
fileInput.addEventListener("change", e => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  stopStream();
  capturedFiles = [];
  galleryPreview.innerHTML = "";

  files.forEach(file => {
    capturedFiles.push({ blob: file, type: file.type });
    addPreviewThumb(file, file.type.startsWith("image") ? "image" : "video");
  });

  cameraWrapper.style.display  = "block";
  controls.style.display       = "flex";
  videoEl.style.display        = "none";
  canvasEl.style.display       = "none";
  modeSelection.style.display  = "none";
  showActionButtons();

  // Reset input so the same files can be re-selected if needed
  fileInput.value = "";
});

/* ─── UPLOAD ─────────────────────────────────────────────── */
uploadBtn.addEventListener("click", async () => {
  if (!capturedFiles.length) return;

  const visibility = document.getElementById("visibility").value;
  const bucket     = visibility === "public" ? PUBLIC_BUCKET : PRIVATE_BUCKET;

  uploadBtn.disabled  = true;
  retakeBtn.disabled  = true;
  shareBtn.disabled   = true;
  progressWrap.classList.add("visible");
  setStatus("Uploading...");

  try {
    const rows = await uploadFiles(bucket, visibility, (done, total) => {
      progressFill.style.width   = Math.round((done / total) * 100) + "%";
      progressLabel.textContent  = `${done} / ${total}`;
    });

    if (rows.length) {
      // Insert DB records — also add bucket column so gallery/admin stay in sync
      const { error: dbErr } = await supabase.from("uploads").insert(
        rows.map(r => ({ ...r, bucket }))
      );
      if (dbErr) {
        // bucket column may not exist yet — retry without it
        const msg = dbErr.message || dbErr.code || "";
        if (msg.includes("bucket") || dbErr.code === "42703") {
          const { error: retryErr } = await supabase.from("uploads").insert(rows);
          if (retryErr) throw retryErr;
        } else {
          throw dbErr;
        }
      }
    }

    progressWrap.classList.remove("visible");
    toast(`✓ ${rows.length} file${rows.length !== 1 ? "s" : ""} uploaded 🤍`);
    setStatus("");

    // Brief pause so the toast is readable, then reset
    setTimeout(() => window.location.reload(), 1800);

  } catch (err) {
    progressWrap.classList.remove("visible");
    const msg = err?.message || err?.code || String(err);
    console.error("[upload]", msg);
    setStatus("Upload failed: " + msg);
    toast("⚠ Upload failed — see status below", 4000);
    uploadBtn.disabled = false;
    retakeBtn.disabled = false;
    shareBtn.disabled  = false;
  }
});

/* ─── SHARE ──────────────────────────────────────────────── */
shareBtn.addEventListener("click", async () => {
  if (!capturedFiles.length) return;

  try {
    const filesToShare = capturedFiles.map(f => {
      const ext = f.type.startsWith("image") ? "jpg" : "webm";
      return new File([f.blob], `wedding_memory_${Date.now()}.${ext}`, { type: f.type });
    });

    if (navigator.share && navigator.canShare?.({ files: filesToShare })) {
      await navigator.share({
        title: "Wedding Memories 🤍",
        text:  "Captured at the wedding ✨",
        files: filesToShare
      });
      toast("Shared successfully 🤍");
    } else {
      toast("Sharing not supported — try uploading instead.");
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("[share]", err);
      toast("Sharing failed or cancelled.");
    }
  }
});

/* ─── IMAGE COMPRESSION ──────────────────────────────────── */
function compressImage(file, quality = 0.78) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const MAX_W  = 1280;
      const scale  = Math.min(1, MAX_W / img.width);
      const cv     = document.createElement("canvas");
      cv.width     = img.width  * scale;
      cv.height    = img.height * scale;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob(b => resolve(b || file), "image/jpeg", quality);
    };
    img.onerror = () => resolve(file); // fallback to original on error
    img.src = URL.createObjectURL(file);
  });
}

/* ─── UPLOAD WITH RETRY ──────────────────────────────────── */
async function uploadWithRetry(bucket, path, file, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (!error) return true;

    const isRetryable = error.statusCode >= 500 || error.message?.includes("network");
    if (!isRetryable) {
      console.error("[uploadWithRetry] non-retryable:", error.message);
      return false;
    }

    await new Promise(r => setTimeout(r, 800 * (i + 1))); // backoff
  }
  return false;
}

/* ─── UPLOAD ALL FILES ───────────────────────────────────── */
async function uploadFiles(bucket, visibility, onProgress) {
  const valid = capturedFiles.filter(f => f.blob.size <= MAX_FILE_SIZE);
  const skipped = capturedFiles.length - valid.length;
  if (skipped) toast(`⚠ ${skipped} file(s) skipped — over 25 MB limit`);

  const rows = [];
  let done = 0;

  await Promise.all(valid.map(async fileObj => {
    let file = fileObj.blob instanceof File ? fileObj.blob : new File([fileObj.blob], "capture", { type: fileObj.type });

    if (fileObj.type.startsWith("image")) {
      const compressed = await compressImage(file);
      file = new File([compressed], file.name, { type: "image/jpeg" });
    }

    const ext      = fileObj.type.startsWith("image") ? "jpg" : "webm";
    const filePath = `memory_${crypto.randomUUID()}.${ext}`;
    const success  = await uploadWithRetry(bucket, filePath, file);

    if (success) {
      rows.push({
        file_path:  filePath,
        file_type:  fileObj.type.startsWith("image") ? "image/jpeg" : fileObj.type,
        visibility
      });
    } else {
      console.warn("[uploadFiles] failed for", filePath);
    }

    onProgress(++done, valid.length);
  }));

  return rows;
}

/* ─── CLEANUP ────────────────────────────────────────────── */
window.addEventListener("beforeunload", stopStream);