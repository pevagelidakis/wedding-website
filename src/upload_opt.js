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
    // showPreview(blob, "image");
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

    // showPreview(blob, "video");
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
// fileInput.addEventListener("change", (e) => {
//   const files = Array.from(e.target.files);
//   if (!files.length) return;

//   files.forEach(file => {
//     capturedFiles.push({ blob: file, type: file.type });
//     showPreview(file, file.type.startsWith("image") ? "image" : "video");
//   });

//   modeSelection.style.display = "none";
//   cameraWrapper.style.display = "block";
//   controls.style.display = "flex";
//   recordBtn.style.display = "none";
//   switchBtn.style.display = "none";
//   showPreviewButtons();
// });
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  stopStream();
  cameraWrapper.style.display = "block";
  controls.style.display = "none";
  galleryPreview.innerHTML = "";
  galleryPreview.style.display = "flex";

  capturedFiles = [];
  files.forEach(file => {
    capturedFiles.push({ blob: file, type: file.type });
    showPreview(file, file.type.startsWith("image") ? "image" : "video");
  });

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

  const visibility = document.getElementById("visibility").value;
  const bucketName = visibility === "public" ? "public-pics" : "private-pics";

  for (const fileObj of capturedFiles) {
    if (fileObj.blob.size > MAX_FILE_SIZE) continue;

    const extension = fileObj.type.startsWith("image") ? "jpg" : "webm";
    const filePath = `memory_${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileObj.blob, { contentType: fileObj.type, upsert: false });

    if (!error) {
      await supabase.from("uploads").insert([{ file_path: filePath, bucket: bucketName, file_type: fileObj.type }]);
    }
  }

  status.innerText = "Uploaded successfully 🤍";
  setTimeout(() => window.location.reload(), 1200);
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

/* ================= CLEANUP ================= */
window.addEventListener("beforeunload", stopStream);
// /* ================= ELEMENTS ================= */

// const modeSelection = document.getElementById("modeSelection");
// const cameraModeBtn = document.getElementById("cameraModeBtn");
// const galleryModeBtn = document.getElementById("galleryModeBtn");
// const fileInput = document.getElementById("fileInput");

// const cameraWrapper = document.querySelector(".camera-wrapper");
// const controls = document.querySelector(".controls");

// const video = document.getElementById("video");
// const canvas = document.getElementById("canvas");

// const recordBtn = document.getElementById("recordBtn");
// const switchBtn = document.getElementById("switchBtn");
// const retakeBtn = document.getElementById("retakeBtn");
// const uploadBtn = document.getElementById("uploadBtn");
// const shareBtn = document.getElementById("shareBtn");
// const status = document.getElementById("status");

// /* ================= STATE ================= */

// let stream = null;
// let currentFacingMode = "environment";
// // let capturedBlob = null;
// // let capturedType = null;
// let capturedFiles = []; // { blob, type }
// let mediaRecorder = null;
// let recordedChunks = [];
// let isRecording = false;
// let holdTimer = null;
// let lastUploadTime = 0;

// /* ================= CONSTANTS ================= */

// const MAX_DURATION = 15000; // 15 seconds
// const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
// const UPLOAD_COOLDOWN = 10000; // 10 seconds

// /* =========================================================
//    CAMERA START
// ========================================================= */

// async function startCamera() {
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
//   video.muted = true;      // prevents feedback
//   video.playsInline = true;
//   await video.play();
// }

// /* ================= STOP STREAM ================= */

// function stopStream() {
//   if (stream) {
//     stream.getTracks().forEach(track => track.stop());
//     stream = null;
//   }
// }

// /* ================= MODE ================= */

// cameraModeBtn.addEventListener("click", async () => {
//   modeSelection.style.display = "none";
//   cameraWrapper.style.display = "block";
//   controls.style.display = "flex";
//   await startCamera();
// });

// galleryModeBtn.addEventListener("click", () => fileInput.click());

// /* =========================================================
//    TAP / HOLD
// ========================================================= */

// recordBtn.addEventListener("mousedown", startHold);
// recordBtn.addEventListener("touchstart", startHold);

// recordBtn.addEventListener("mouseup", endHold);
// recordBtn.addEventListener("mouseleave", endHold);
// recordBtn.addEventListener("touchend", endHold);

// function startHold(e) {
//   e.preventDefault();
//   holdTimer = setTimeout(() => startRecording(), 600);
// }

// function endHold(e) {
//   e.preventDefault();
//   clearTimeout(holdTimer);

//   if (isRecording) stopRecording();
//   else takePhoto();
// }

// /* ================= PHOTO ================= */

// function takePhoto() {
//   canvas.width = video.videoWidth;
//   canvas.height = video.videoHeight;

//   canvas.getContext("2d").drawImage(video, 0, 0);

//   canvas.toBlob(blob => {
//     capturedBlob = blob;
//     capturedType = "image/jpeg";
//   }, "image/jpeg", 0.85);

//   video.style.display = "none";
//   canvas.style.display = "block";
//   showPreviewButtons();
// }

// /* ================= VIDEO ================= */
// function startRecording() {
//   if (!stream) return;

//   isRecording = true;
//   recordBtn.classList.add("recording");

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

//     video.srcObject = null;
//     video.src = URL.createObjectURL(capturedBlob);
//     video.controls = true;
//     video.muted = false;

//     showPreviewButtons();
//   };

//   mediaRecorder.start();

//   setTimeout(() => {
//     if (isRecording) stopRecording();
//   }, MAX_DURATION);
// }

// function stopRecording() {
//   isRecording = false;
//   recordBtn.classList.remove("recording");

//   if (mediaRecorder && mediaRecorder.state !== "inactive") {
//     mediaRecorder.stop();
//   }
// }
// /* ================= PREVIEW ================= */

// function showPreviewButtons() {
//   recordBtn.style.display = "none";
//   switchBtn.style.display = "none";

//   retakeBtn.style.display = "inline-block";
//   uploadBtn.style.display = "inline-block";
//   shareBtn.style.display = "inline-block";
// }

// /* ================= RETAKE ================= */

// retakeBtn.addEventListener("click", async () => {
// //   let capturedBlob = null;
// //   let capturedType = null;
//   let capturedFiles = []; // { blob, type }

//   video.src = "";
//   video.srcObject = null;
//   video.controls = false;
//   canvas.style.display = "none";

//   retakeBtn.style.display = "none";
//   uploadBtn.style.display = "none";
//   shareBtn.style.display = "none";

//   recordBtn.style.display = "block";
//   switchBtn.style.display = "inline-block";

//   modeSelection.style.display = "flex";
//   cameraWrapper.style.display = "none";
//   controls.style.display = "none";

//   status.innerText = "";

//   stopStream();
// });

// /* ================= UPLOAD ================= */
// fileInput.addEventListener("change", (e) => {
//   const files = Array.from(e.target.files);
//   if (!files.length) return;

//   capturedFiles = [];

//   modeSelection.style.display = "none";
//   cameraWrapper.style.display = "block";
//   controls.style.display = "flex";

//   recordBtn.style.display = "none";
//   switchBtn.style.display = "none";

//   video.style.display = "none";
//   canvas.style.display = "none";

//   const previewContainer = document.getElementById("galleryPreview");
//   previewContainer.innerHTML = "";
//   previewContainer.style.display = "flex";

//   files.forEach(file => {
//     capturedFiles.push({ blob: file, type: file.type });

//     const wrapper = document.createElement("div");
//     wrapper.style.position = "relative";
//     wrapper.style.width = "100px";
//     wrapper.style.height = "100px";
//     wrapper.style.borderRadius = "12px";
//     wrapper.style.overflow = "hidden";

//     let element;
//     if (file.type.startsWith("image")) {
//       element = document.createElement("img");
//       element.src = URL.createObjectURL(file);
//       element.style.width = "100%";
//       element.style.height = "100%";
//       element.style.objectFit = "cover";
//     } else {
//       element = document.createElement("video");
//       element.src = URL.createObjectURL(file);
//       element.muted = true;
//       element.playsInline = true;
//       element.style.width = "100%";
//       element.style.height = "100%";
//       element.style.objectFit = "cover";
//     }

//     // Remove button
//     const removeBtn = document.createElement("button");
//     removeBtn.innerText = "✕";
//     removeBtn.style.position = "absolute";
//     removeBtn.style.top = "4px";
//     removeBtn.style.right = "4px";
//     removeBtn.style.background = "rgba(0,0,0,0.6)";
//     removeBtn.style.color = "#fff";
//     removeBtn.style.border = "none";
//     removeBtn.style.borderRadius = "50%";
//     removeBtn.style.width = "22px";
//     removeBtn.style.height = "22px";
//     removeBtn.style.cursor = "pointer";

//     removeBtn.onclick = () => {
//       wrapper.remove();
//       capturedFiles = capturedFiles.filter(f => f.blob !== file);
//     };

//     wrapper.appendChild(element);
//     wrapper.appendChild(removeBtn);
//     previewContainer.appendChild(wrapper);
//   });

//   showPreviewButtons();
// });
// // uploadBtn.addEventListener("click", async () => {
// //   if (!capturedBlob) return;

// //   // Cooldown protection
// //   if (Date.now() - lastUploadTime < UPLOAD_COOLDOWN) {
// //     status.innerText = "Please wait before uploading again.";
// //     return;
// //   }

// //   if (capturedBlob.size > MAX_FILE_SIZE) {
// //     status.innerText = "File too large. Please record shorter video.";
// //     return;
// //   }

// //   lastUploadTime = Date.now();
// //   uploadBtn.disabled = true;
// //   status.innerText = "Uploading...";

// //   const visibility = document.getElementById("visibility").value;
// //   const bucketName = visibility === "public" ? "public-pics" : "private-pics";

// //   const extension = capturedType.startsWith("image")
// //     ? "jpg"
// //     : "webm";

// //   const filePath = `memory_${crypto.randomUUID()}.${extension}`;

// //   const { error } = await supabase.storage
// //     .from(bucketName)
// //     .upload(filePath, capturedBlob, {
// //       contentType: capturedType,
// //       upsert: false
// //     });

// //   if (error) {
// //     status.innerText = "Upload failed 😢";
// //     uploadBtn.disabled = false;
// //     return;
// //   }

// //   await supabase.from("uploads").insert([{
// //     file_path: filePath,
// //     bucket: bucketName,
// //     file_type: capturedType
// //   }]);

// //   status.innerText = "Uploaded successfully 🤍";

// //   setTimeout(() => window.location.reload(), 1200);
// // });
// uploadBtn.addEventListener("click", async () => {
//   if (!capturedFiles.length) return;

//   uploadBtn.disabled = true;
//   status.innerText = "Uploading...";

//   const visibility = document.getElementById("visibility").value;
//   const bucketName = visibility === "public" ? "public-pics" : "private-pics";

//   for (const fileObj of capturedFiles) {
//     if (fileObj.blob.size > MAX_FILE_SIZE) continue;

//     const extension = fileObj.type.startsWith("image") ? "jpg" : "webm";
//     const filePath = `memory_${crypto.randomUUID()}.${extension}`;

//     const { error } = await supabase.storage
//       .from(bucketName)
//       .upload(filePath, fileObj.blob, {
//         contentType: fileObj.type,
//         upsert: false
//       });

//     if (!error) {
//       await supabase.from("uploads").insert([{
//         file_path: filePath,
//         bucket: bucketName,
//         file_type: fileObj.type
//       }]);
//     }
//   }

//   status.innerText = "Uploaded successfully 🤍";
//   setTimeout(() => window.location.reload(), 1200);
// });
// /* ================= CLEANUP ================= */

// window.addEventListener("beforeunload", () => {
//   stopStream();
// });