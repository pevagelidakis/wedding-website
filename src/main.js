import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.getElementById("rsvp-form");
const thankYou = document.getElementById("rsvp_thankyou");
const attendance = document.getElementById("attendance");
const guestsGroup = document.getElementById("guests-group");

const nameInput = form.querySelector("input[name='name']");
const phoneInput = document.getElementById("phone");
const guestsInput = guestsGroup.querySelector("input");

const errorName = document.getElementById("contact_error_name");
const errorPhone = document.getElementById("contact_error");
const errorAttend = document.getElementById("contact_error_attend");

const submitBtn = form.querySelector("button[type='submit']");
attendance.addEventListener("change", () => {
  const value = attendance.value ? attendance.value.toLowerCase() : "";

  if (value === "yes") {
    guestsGroup.classList.add("visible");
    guestsInput.required = true;
  } else {
    guestsGroup.classList.remove("visible");
    guestsInput.required = false;
    guestsInput.value = "";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Reset UI
  errorName.style.display = "none";
  errorPhone.style.display = "none";
  errorAttend.style.display = "none";
  thankYou.style.display = "none";

  const nameValue = nameInput.value.trim();
  const phoneValue = phoneInput.value.trim();
  const attendanceValue = attendance.value ? attendance.value.toLowerCase() : "";
  const guestsValue = guestsInput.value ? parseInt(guestsInput.value, 10) : 0;
  const messageValue = document.getElementById("msg")?.value.trim() || null;

  let hasError = false;

  if (!nameValue) {
    errorName.style.display = "block";
    hasError = true;
  }

  if (!attendanceValue) {
    errorAttend.style.display = "block";
    hasError = true;
  }

  if (attendanceValue === "yes") {
    if (!phoneValue) {
      errorPhone.style.display = "block";
      hasError = true;
    }

    if (!guestsValue || guestsValue < 1) {
      errorAttend.style.display = "block";
      hasError = true;
    }
  }

  if (hasError) return;

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";

    const isAttending = attendanceValue =="yes"
    const { error } = await supabase
      .from("rsvps")
      .insert([
        {
          full_name: nameValue,
          phone: isAttending ? phoneValue : null,
          attendance: isAttending? "Yes" : "No",
          seats_reserved: isAttending? guestsValue: null,
          message: messageValue || null
        }
      ]);

    if (error) throw error;

    form.style.display = "none";
    thankYou.style.display = "block";
    setInterval(() => floatingPetals(100), 800);
  } catch (err) {
    console.error("RSVP Error:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText =
      translations[document.documentElement.lang].sendBtn;
  }
});
// attendance.addEventListener("change", () => {
//   const seatsInput = guestsGroup.querySelector("input");
//   const contactError = document.getElementById("contact_error");

//   // Always normalize value
//   const value = attendance.value.toLowerCase();

//   if (value === "yes") {
//     guestsGroup.classList.add("visible");
//     seatsInput.required = true;
//   } else {
//     guestsGroup.classList.remove("visible");
//     seatsInput.required = false;
//     seatsInput.value = "";

//     // 🔥 IMPORTANT: Hide error if switching to "No"
//     contactError.classList.remove("show");
//   }
// });

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   // Reset UI state
//   errorName.style.display = "none";
//   errorPhone.style.display = "none";
//   errorAttend.style.display = "none";
//   thankYou.style.display = "none";

//   const nameValue = nameInput.value.trim();
//   const phoneValue = phoneInput.value.trim();
//   const attendanceValue = attendance.value?.toLowerCase();
//   const guestsValue = guestsInput.value.trim();
//   const messageInput = document.getElementById("msg");
//   const messageValue = messageInput ? messageInput.value.trim() : null;
//   const isAttending = attendanceValue === "yes";

//   let hasError = false;

//   // ✅ Name required
//   if (!nameValue) {
//     errorName.style.display = "block";
//     hasError = true;
//   }

//   // ✅ Attendance required
//   if (!attendanceValue) {
//     errorAttend.style.display = "block";
//     hasError = true;
//   }

//   // ✅ Only require phone + guests if attending YES
//   if (isAttending) {
//     if (!phoneValue) {
//       errorPhone.style.display = "block";
//       hasError = true;
//     }

//     if (!guestsValue || parseInt(guestsValue) < 1) {
//       errorAttend.style.display = "block";
//       hasError = true;
//     }
//   }

//   if (hasError) return;

//   try {
//     // Optional: disable button while submitting
//     form.querySelector("button[type='submit']").disabled = true;

//     const payload = {
//       full_name: nameValue,
//       attendance: isAttending ? "Yes" : "No",
//       seats_reserved: isAttending ? guestsValue : null,
//       phone:isAttending ? phoneValue : null,
//       message: messageValue || null
//     };

//     const { data: insertData, error: insertError } = await supabase
//       .from("rsvps")
//       .insert(payload);

//     if (insertError) {
//       throw new Error(insertError.message);
//     }

//     try{
//       await supabase.functions.invoke("send-rsvp-email", {
//         body: payload
//       });
//     }catch (e){
//           console.warn('Email failed (RSVP saved):', e);
//     }

//     // ✅ Success state
//     form.reset();
//     guestsGroup.classList.remove("visible");

//     form.style.opacity = "0";
//     form.style.pointerEvents = "none";

//     setTimeout(() => {
//       form.style.display = "none";
//       thankYou.classList.add("show");
//     }, 400);

//     thankYou.style.display = "block";

//     if (typeof floatingPetals === "function") {
//       floatingPetals();
//     }

//   } catch (err) {
//     alert("Oops, something feels off. Please try again.");
//   } finally {
//     form.querySelector("button[type='submit']").disabled = false;
//   }
// });
  

// function createPetal() {
//   const petal = document.createElement("div");
//   petal.className = "petal";
//   // Random horizontal start
//   petal.style.left = Math.random() * 100 + "vw";
//   // Random duration
//   const duration = 6 + Math.random() * 6;
//   petal.style.animationDuration = duration + "s";
//   // Random drift & rotation
//   petal.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
//   petal.style.setProperty("--rotate", (Math.random() * 720 - 360) + "deg");
//   // Random depth
//   const depth = ["far", "mid", "near"];
//   petal.classList.add(depth[Math.floor(Math.random() * depth.length)]);
//   // Random image variant
//   const variant = 1 + Math.floor(Math.random() * 3);
//   petal.classList.add(`variant-${variant}`);
//   document.getElementById("petals-container").appendChild(petal);

//   // Cleanup
//   setTimeout(() => petal.remove(), duration * 1000);
// }

// function triggerPetals(count = 100){
//   for (let i = 0; i < count; i++) {
//     setTimeout(createPetal, i * 120);
//   }
// }


function floatingPetals(count = 40) {
  const container = document.getElementById("petals-container");
  if (!container) return;

  // Reduce load on small/mobile devices
  const isMobile = window.innerWidth < 768;
  const total = isMobile ? Math.min(count, 25) : count;

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < total; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";

    // Random horizontal start
    petal.style.left = Math.random() * 100 + "vw";

    // Random drift & rotation (GPU friendly)
    petal.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
    petal.style.setProperty("--rotate", (Math.random() * 720 - 360) + "deg");

    // Random duration
    const duration = 8 + Math.random() * 6;
    petal.style.animationDuration = duration + "s";

    // Depth selection (no width recalculation needed)
    const r = Math.random();
    petal.classList.add(
      r < 0.33 ? "far" :
      r < 0.66 ? "mid" : "near"
    );

    // Variant selection
    petal.classList.add(`variant-${1 + Math.floor(Math.random() * 3)}`);

    // Auto cleanup (no setTimeout needed)
    petal.addEventListener("animationend", () => {
      petal.remove();
    });

    fragment.appendChild(petal);
  }

  // Single DOM injection
  container.appendChild(fragment);
}