import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "YOUR_URL";
const SUPABASE_ANON_KEY = "YOUR_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const modeSelection = document.getElementById("modeSelection");
const cameraModeBtn = document.getElementById("cameraModeBtn");
const galleryModeBtn = document.getElementById("galleryModeBtn");
const fileInput = document.getElementById("fileInput");
const cameraWrapper = document.querySelector(".camera-wrapper");
const controls = document.querySelector(".controls");

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

/* ========== MODE SELECTION ========== */

cameraModeBtn.onclick = async () => {
  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";
  await startCamera();
};

galleryModeBtn.addEventListener("click", () => {
    fileInput.removeAttribute("capture");
    fileInput.setAttribute("accept", "image/*,video/*");
    fileInput.click();
  });
// galleryModeBtn.onclick = () => fileInput.click();

/* ========== FILE UPLOAD ========== */

fileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  capturedBlob = file;
  capturedType = file.type;

  modeSelection.style.display = "none";
  cameraWrapper.style.display = "block";
  controls.style.display = "flex";

  if (file.type.startsWith("image")) {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img,0,0);
      video.style.display="none";
      canvas.style.display="block";
    };
    img.src = URL.createObjectURL(file);
  } else {
    video.src = URL.createObjectURL(file);
    video.controls = true;
  }

  showPreviewButtons();
};

/* ========== CAMERA ========== */

async function startCamera(){
  if(stream) stream.getTracks().forEach(t=>t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode:currentFacingMode},
    audio:true
  });

  video.srcObject = stream;
}

switchBtn.onclick = async ()=>{
  currentFacingMode = currentFacingMode==="environment"?"user":"environment";
  await startCamera();
};

/* ========== PHOTO / VIDEO ========== */

let holdTimer;

recordBtn.onmousedown = recordBtn.ontouchstart = e=>{
  e.preventDefault();
  holdTimer = setTimeout(startRecording,600);
};

recordBtn.onmouseup = recordBtn.ontouchend = e=>{
  e.preventDefault();
  clearTimeout(holdTimer);
  if(isRecording) stopRecording();
  else takePhoto();
};

function takePhoto(){
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video,0,0);

  canvas.toBlob(blob=>{
    capturedBlob=blob;
    capturedType="image/jpeg";
  },"image/jpeg",0.9);

  video.style.display="none";
  canvas.style.display="block";
  showPreviewButtons();
}

function startRecording(){
  isRecording=true;
  recordBtn.classList.add("recording");
  recordedChunks=[];
  mediaRecorder=new MediaRecorder(stream);

  mediaRecorder.ondataavailable=e=>{
    if(e.data.size>0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop=()=>{
    capturedBlob=new Blob(recordedChunks,{type:"video/webm"});
    capturedType="video/webm";
    video.srcObject=null;
    video.src=URL.createObjectURL(capturedBlob);
    video.controls=true;
    showPreviewButtons();
  };

  mediaRecorder.start();
}

function stopRecording(){
  isRecording=false;
  recordBtn.classList.remove("recording");
  mediaRecorder.stop();
}

/* ========== PREVIEW STATE ========== */

function showPreviewButtons(){
  recordBtn.style.display="none";
  switchBtn.style.display="none";

  retakeBtn.style.display="inline-block";
  shareBtn.style.display="inline-block";
  uploadBtn.style.display="inline-block";
}

/* ========== RETAKE ========== */

retakeBtn.onclick = ()=>{
  capturedBlob=null;
  capturedType=null;

  video.controls=false;
  video.src="";
  video.srcObject=null;

  canvas.style.display="none";
  video.style.display="block";

  retakeBtn.style.display="none";
  shareBtn.style.display="none";
  uploadBtn.style.display="none";

  recordBtn.style.display="block";
  switchBtn.style.display="inline-block";

  cameraWrapper.style.display="none";
  controls.style.display="none";
  modeSelection.style.display="flex";
};

/* ========== SHARE ========== */

shareBtn.onclick = async ()=>{
  if(!capturedBlob) return;

  const ext=capturedType.startsWith("image")?"jpg":"webm";
  const file=new File([capturedBlob],`memory_${Date.now()}.${ext}`,{type:capturedType});

  if(navigator.share && navigator.canShare?.({files:[file]})){
    await navigator.share({
      title:"Wedding Memory 🤍",
      text:"Captured at the Wedding ✨",
      files:[file]
    });
  }else{
    const url=URL.createObjectURL(capturedBlob);
    const a=document.createElement("a");
    a.href=url;
    a.download=file.name;
    a.click();
  }
};

/* ========== UPLOAD ========== */

uploadBtn.onclick = async ()=>{
  if(!capturedBlob) return;

  status.innerText="Uploading...";

  const ext=capturedType.startsWith("image")?"jpg":"webm";
  const filePath=`memory_${Date.now()}.${ext}`;

  const {error}=await supabase.storage
    .from("public-pics")
    .upload(filePath,capturedBlob,{upsert:true});

  if(error){
    status.innerText="Upload failed 😢";
    return;
  }

  await supabase.from("uploads").insert([{
    file_path:filePath,
    file_type:capturedType,
    visibility:"public"
  }]);

  status.innerText="Uploaded successfully 🤍";
  retakeBtn.click();
};
