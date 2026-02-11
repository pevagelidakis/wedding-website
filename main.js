const form = document.getElementById("rsvp-form");
  const thankYou = document.getElementById("rsvp-thankyou");
  const attendance = document.getElementById("attendance");
  const guestsGroup = document.getElementById("guests-group");
  const emailInput = document.getElementById("email");

  attendance.addEventListener("change", () => {
    const input = guestsGroup.querySelector("input");
    if (attendance.value === "Yes") {
      guestsGroup.style.display = "block";
      input.required = true;
    } else {
      guestsGroup.style.display = "none";
      input.required = false;
      input.value = "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (emailInput.value) {
      const reply = document.createElement("input");
      reply.type = "hidden";
      reply.name = "_replyto";
      reply.value = emailInput.value;
      form.appendChild(reply);
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error();

      form.style.display = "none";
      thankYou.style.display = "block";

      if (typeof floatingPetals === "function") {
        floatingPetals();
      }

    } catch {
      alert("Something went wrong. Please try again.");
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
attendance.addEventListener("change", () => {
  const input = guestsGroup.querySelector("input");

  if (attendance.value === "Yes") {
    guestsGroup.classList.add("visible");
    input.required = true;
  } else {
    guestsGroup.classList.remove("visible");
    input.required = false;
    input.value = "";
  }
});










// create table uploads (
//   id bigserial primary key,
//   file_url text not null,
//   file_type text not null,
//   hashtags text[],
//   visibility text not null,
//   created_at timestamp with time zone default now()
// );

// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// const bucketName = "public";

// // 🔹 Wait until DOM is ready
// document.addEventListener("DOMContentLoaded", () => {
//   const uploadForm = document.getElementById("uploadForm");
//   const gallery = document.getElementById("gallery");
//   const searchInput = document.getElementById("search");

//   // =============================
//   // 📤 UPLOAD
//   // =============================
//   uploadForm.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const fileInput = document.getElementById("fileInput");
//     const hashtagsInput = document.getElementById("hashtags");
//     const visibility = document.getElementById("visibility").value;

//     if (!fileInput.files.length) {
//       alert("Please select a file.");
//       return;
//     }

//     const file = fileInput.files[0];
//     const hashtags = hashtagsInput.value.trim(); // store as TEXT
//     const filePath = `${Date.now()}_${file.name}`;

//     // 🔹 Upload to storage
//     const { error: uploadError } = await supabase.storage
//       .from(bucketName)
//       .upload(filePath, file);

//     if (uploadError) {
//       console.error(uploadError);
//       alert("Upload failed.");
//       return;
//     }

//     // 🔹 Get public URL
//     const { data: publicUrlData } = supabase.storage
//       .from(bucketName)
//       .getPublicUrl(filePath);

//     const publicURL = publicUrlData.publicUrl;

//     // 🔹 Insert metadata into DB
//     const { error: insertError } = await supabase
//       .from("uploads")
//       .insert([
//         {
//           file_url: publicURL,
//           file_type: file.type,
//           hashtags: hashtags,
//           visibility: visibility
//         }
//       ]);

//     if (insertError) {
//       console.error(insertError);
//       alert("Database insert failed.");
//       return;
//     }

//     alert("Uploaded successfully 🤍");
//     uploadForm.reset();
//     loadGallery();
//   });

//   // =============================
//   // 🖼 LOAD GALLERY
//   // =============================
//   async function loadGallery(searchTerm = "") {
//     let query = supabase
//       .from("uploads")
//       .select("*")
//       .eq("visibility", "public")
//       .order("created_at", { ascending: false });

//     if (searchTerm) {
//       query = query.ilike("hashtags", `%${searchTerm}%`);
//     }

//     const { data, error } = await query;

//     if (error) {
//       console.error(error);
//       return;
//     }

//     gallery.innerHTML = "";

//     data.forEach((item) => {
//       const div = document.createElement("div");
//       div.className = "gallery-item";

//       if (item.file_type.startsWith("image")) {
//         div.innerHTML = `<img src="${item.file_url}" loading="lazy">`;
//       } else {
//         div.innerHTML = `
//           <video controls preload="metadata">
//             <source src="${item.file_url}" type="${item.file_type}">
//           </video>
//         `;
//       }

//       gallery.appendChild(div);
//     });
//   }

//   // =============================
//   // 🔍 SEARCH
//   // =============================
//   searchInput.addEventListener("input", (e) => {
//     const term = e.target.value.toLowerCase();
//     loadGallery(term);
//   });

//   // Initial load
//   loadGallery();
// });


import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const visibility = document.getElementById("visibility").value;

const bucketName = visibility === "public"
  ? "public-pics"
  : "private-pics";
document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const cameraBtn = document.getElementById("cameraBtn");
  const galleryBtn = document.getElementById("galleryBtn");

  // CAMERA
  cameraBtn.addEventListener("click", () => {
    fileInput.setAttribute("capture", "environment");
    fileInput.setAttribute("accept", "image/*");
    fileInput.click();
  });

  // GALLERY
  galleryBtn.addEventListener("click", () => {
    fileInput.removeAttribute("capture");
    fileInput.setAttribute("accept", "image/*");
    fileInput.click();
  });

  // Upload
  uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const hashtagsInput = document.getElementById("hashtags");
  const visibilitySelect = document.getElementById("visibility");

  const file = fileInput.files[0];
  if (!file) return alert("Select a file.");

  // 🔥 Determine bucket dynamically HERE
  const selectedVisibility = visibilitySelect.value;

  const bucketName = selectedVisibility === "public"
    ? "public-pics"
    : "private-pics";

  const hashtagsStr = hashtagsInput.value.trim();
  const hashtagsArray = hashtagsStr
    ? hashtagsStr.split(' ').filter(tag => tag.startsWith('#'))
    : [];

  const filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // Upload file to correct bucket
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    return alert("Upload failed: " + uploadError.message);
  }

  // Get public URL (works only if bucket is public)
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  // Insert metadata
  const { error: insertError } = await supabase
    .from("uploads")
    .insert([{
      file_url: publicUrl,
      file_type: file.type,
      hashtags: hashtagsArray,
      visibility: selectedVisibility
    }]);

  if (insertError) {
    console.error(insertError);
    return alert("DB insert failed: " + insertError.message);
  }

  alert("Uploaded successfully! 🎉");
  uploadForm.reset();
  loadGallery();
});

  // Load gallery
  async function loadGallery() {
  const memoryGallery = document.getElementById("memoryGallery");

  if (!memoryGallery) return;

  // Clear immediately to avoid stale tiles
  memoryGallery.innerHTML = "";

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gallery load error:", error.message);
    memoryGallery.innerHTML = "<p>Failed to load memories.</p>";
    return;
  }

  if (!data || data.length === 0) {
    memoryGallery.innerHTML = "<p>No memories yet 🤍</p>";
    return;
  }

  data.forEach((item) => {
    if (!item.file_url) return;

    const div = document.createElement("div");
    div.className = "gallery-item";

    // Handle images safely
    if (item.file_type && item.file_type.startsWith("image")) {
      const img = document.createElement("img");
      img.src = item.file_url;
      img.loading = "lazy";

      // Remove broken tiles automatically
      img.onerror = () => {
        div.remove();
      };

      div.appendChild(img);
    } 
    
    // Handle videos safely
    else if (item.file_type && item.file_type.startsWith("video")) {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";

      const source = document.createElement("source");
      source.src = item.file_url;
      source.type = item.file_type;

      video.appendChild(source);

      video.onerror = () => {
        div.remove();
      };

      div.appendChild(video);
    }

    memoryGallery.appendChild(div);
  });
}

  // // Search
  // searchInput.addEventListener("input", (e) => {
  //   loadGallery(e.target.value);
  // });

  // Initial load
  loadGallery();
});