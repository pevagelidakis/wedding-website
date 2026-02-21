const form = document.getElementById("rsvp-form");
const thankYou = document.getElementById("rsvp-thankyou");
const attendance = document.getElementById("attendance");
const guestsGroup = document.getElementById("guests-group");

const nameInput = form.querySelector("input[name='name']");
const phoneInput = document.getElementById("phone");
const guestsInput = guestsGroup.querySelector("input");

const errorName = document.getElementById("contact_error_name");
const errorPhone = document.getElementById("contact_error");
const errorAttend = document.getElementById("contact_error_attend");

attendance.addEventListener("change", () => {
  const seatsInput = guestsGroup.querySelector("input");
  const contactError = document.getElementById("contact_error");

  // Always normalize value
  const value = attendance.value.toLowerCase();

  if (value === "yes") {
    guestsGroup.classList.add("visible");
    seatsInput.required = true;
  } else {
    guestsGroup.classList.remove("visible");
    seatsInput.required = false;
    seatsInput.value = "";

    // 🔥 IMPORTANT: Hide error if switching to "No"
    contactError.classList.remove("show");
  }
});


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Reset all errors
  errorName.style.display = "none";
  errorPhone.style.display = "none";
  errorAttend.style.display = "none";
  thankYou.style.display = "none";

  const nameValue = nameInput.value.trim();
  const phoneValue = phoneInput.value.trim();
  const attendanceValue = attendance.value;
  const guestsValue = guestsInput.value.trim();

  let hasError = false;

  // 1️⃣ Name required
  if (!nameValue) {
    errorName.style.display = "block";
    hasError = true;
  }

  // 2️⃣ Attendance required
  if (!attendanceValue) {
    errorAttend.style.display = "block";
    hasError = true;
  }

  // 3️⃣ If attending YES → require phone AND guests
  if (!phoneValue) {
    errorPhone.style.display = "block";
    hasError = true;
  }

  if (!guestsValue || parseInt(guestsValue) < 1) {
    errorAttend.style.display = "block";
    hasError = true;
  }

  if (hasError) return; // ❌ STOP submission completely

  if (phoneValue.value) {
    try{
      // 🚀 Insert into Supabase
      const { error } = await supabase
        .from("rsvps")
        .insert([
          {
            full_name: nameValue,
            attendance: attendanceValue,
            seats_reserved:
              attendanceValue === "Yes" ? parseInt(guestsValue) : null,
            email: emailValue || null,
            phone: phoneValue || null
          }
        ]);
        if (error) {
          console.error(error);
          alert("Something went wrong. Please try again.");
          return;
        }
    
      // const response = await fetch(form.action, {
      //   method: "POST",
      //   body: new FormData(form),
      //   headers: { Accept: "application/json" }
      // });

      if (!response.ok) throw new Error();

      form.style.opacity = "0";
      form.style.pointerEvents = "none";

      setTimeout(() => {
        form.style.display = "none";
        thankYou.classList.add("show");
      }, 400);

      thankYou.style.display = "block";

      if (typeof floatingPetals === "function") {
        floatingPetals();
      }
    } catch {
      alert("Oops, something feels off. Please try again.");
    }
  }
});

  

  function floatingPetals() {
  const container = document.getElementById("petal-container");
  if (!container) return;

  for (let i = 0; i < 200; i++) {
    const petal = document.createElement("div");
    petal.classList.add("petal");

    // Image variety
    const variant = Math.floor(Math.random() * 3) + 1;
    petal.classList.add(`variant-${variant}`);

    // Depth selection
    const depthRand = Math.random();
    let depthClass, size, duration;

    if (depthRand < 0.3) {
      depthClass = "far";
      size = Math.random() * 10 + 14;
      duration = Math.random() * 8 + 14;
    } else if (depthRand < 0.7) {
      depthClass = "mid";
      size = Math.random() * 12 + 18;
      duration = Math.random() * 6 + 12;
    } else {
      depthClass = "near";
      size = Math.random() * 14 + 26;
      duration = Math.random() * 4 + 9;
    }

    petal.classList.add(depthClass);

    petal.style.width = petal.style.height = `${size}px`;
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `${Math.random() * 2}s`;

    container.appendChild(petal);

    setTimeout(() => petal.remove(), (duration + 2) * 1000);
  }
}
// attendance.addEventListener("change", () => {
//   const input = guestsGroup.querySelector("input");

//   if (attendance.value === "Yes") {
//     guestsGroup.classList.add("visible");
//     input.required = true;
//   } else {
//     guestsGroup.classList.remove("visible");
//     input.required = false;
//     input.value = "";
//   }
// });



import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
document.addEventListener("DOMContentLoaded", () => {
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const cameraBtn = document.getElementById("cameraBtn");
  const galleryBtn = document.getElementById("galleryBtn");
  fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const maxLength = 40;
        let fileName = file.name;
        if (fileName.length > maxLength) {
          fileName = fileName.substring(0, maxLength) + "...";
        }
        fileNameDisplay.textContent = "Selected: " + fileName;
      } else {
        fileNameDisplay.textContent = "";
      }
    });
  // CAMERA
  cameraBtn.addEventListener("click", () => {
    fileInput.setAttribute("capture", "environment");
   fileInput.setAttribute("accept", "image/*,video/*");
   fileInput.click();
  });
  // GALLERY
  galleryBtn.addEventListener("click", () => {
    fileInput.removeAttribute("capture");
    fileInput.setAttribute("accept", "image/*,video/*");
    fileInput.click();
  });

  // Upload
//   uploadForm.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const visibilitySelect = document.getElementById("visibility");

//   const file = fileInput.files[0];
//   if (!file) return alert("Select a file.");

//   // 🔥 Determine bucket dynamically HERE
//   const selectedVisibility = visibilitySelect.value;

//   const bucketName = selectedVisibility === "public"
//     ? "public-pics"
//     : "private-pics";

//   const hashtagsStr = hashtagsInput.value.trim();
//   const hashtagsArray = hashtagsStr
//     ? hashtagsStr.split(' ').filter(tag => tag.startsWith('#'))
//     : [];

//   const filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

//   // Upload file to correct bucket
//   const { error: uploadError } = await supabase.storage
//     .from(bucketName)
//     .upload(filePath, file, { upsert: true });

//   if (uploadError) {
//     console.error(uploadError);
//     return alert("Upload failed: " + uploadError.message);
//   }

//   // Get public URL (works only if bucket is public)
//   const { data } = supabase.storage
//     .from(bucketName)
//     .getPublicUrl(filePath);

//   const publicUrl = data.publicUrl;

//   // Insert metadata
//   const { error: insertError } = await supabase
//     .from("uploads")
//     .insert([{
//       file_path: filePath,   // ✅ store path instead,
//       file_type: file.type,
//       hashtags: hashtagsArray,
//       visibility: selectedVisibility
//     }]);

//   if (insertError) {
//     console.error(insertError);
//     return alert("DB insert failed: " + insertError.message);
//   }

//   alert("Uploaded successfully! 🎉");
//   uploadForm.reset();
//   loadGallery();
// });

//   // Load gallery
//   async function loadGallery() {
//   const memoryGallery = document.getElementById("gallery");

//   if (!memoryGallery) return;

//   // Clear immediately to avoid stale tiles
//   memoryGallery.innerHTML = "";

//   const { data, error } = await supabase
//     .from("uploads")
//     .select("*")
//     .eq("visibility", "public")
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Gallery load error:", error.message);
//     memoryGallery.innerHTML = "<p>Failed to load memories.</p>";
//     return;
//   }

//   if (!data || data.length === 0) {
//     memoryGallery.innerHTML = "<p>No memories yet 🤍</p>";
//     return;
//   }

//   data.forEach((item) => {
//   if (!item.file_path) return;

//   const div = document.createElement("div");
//   div.className = "gallery-item";

//   const bucket =
//     item.visibility === "public"
//       ? "public-pics"
//       : "private-pics";

//   const { data: urlData } = supabase.storage
//     .from(bucket)
//     .getPublicUrl(item.file_path);

//   if (!urlData?.publicUrl) return;

//   if (item.file_type?.startsWith("image")) {
//     const img = document.createElement("img");
//     img.src = urlData.publicUrl;
//     img.loading = "lazy";
//     img.onerror = () => div.remove();
//     div.appendChild(img);
//   }

//   else if (item.file_type?.startsWith("video")) {
//     const video = document.createElement("video");
//     video.controls = true;
//     video.preload = "metadata";
//     video.src = urlData.publicUrl;
//     video.onerror = () => div.remove();
//     div.appendChild(video);
//   }

//   memoryGallery.appendChild(div);
// });
// }

  // // Search
  // searchInput.addEventListener("input", (e) => {
  //   loadGallery(e.target.value);
  // });

  // Initial load
  loadGallery();
});