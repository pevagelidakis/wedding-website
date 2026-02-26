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

    // Prepare exact payload matching DB schema
    const payload = {
      full_name: nameValue,
      phone: isAttending ? phoneValue : null,
      attendance: isAttending ? "Yes" : "No",
      seats_reserved: isAttending ? guestsValue : null,
      message: messageValue
    };
    await insertWithRetry(payload);
    form.style.display = "none";
    thankYou.style.display = "block";
    floatingPetals(80);
  } catch (err) {
    console.error("RSVP final failure:", err);
    alert("Temporary issue. Please try again in a few seconds.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText =
      translations[document.documentElement.lang].sendBtn;
  }
});

async function insertWithRetry(payload, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 8000)
      );
      const insertPromise = supabase
        .from("rsvps")
        .insert([payload]);
      const { error } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]);
      if (error) throw error;
      return; // Success
    } catch (err) {
      attempt++;
      // If last attempt, throw
      if (attempt >= maxRetries) {
        throw err;
      }
      // Exponential backoff (300ms → 900ms → 1800ms)
      const delay = 300 * Math.pow(3, attempt - 1);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

function floatingPetals(count = 40) {
  const container = document.getElementById("petals-container");
  if (!container) return;
  const isMobile = window.innerWidth < 768;
  const total = isMobile ? Math.min(count, 25) : count;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
    petal.style.setProperty("--rotate", (Math.random() * 720 - 360) + "deg");
    const duration = 8 + Math.random() * 6;
    petal.style.animationDuration = duration + "s";
    const r = Math.random();
    petal.classList.add(
      r < 0.33 ? "far" :
      r < 0.66 ? "mid" : "near"
    );
    petal.classList.add(`variant-${1 + Math.floor(Math.random() * 3)}`);
    petal.addEventListener("animationend", () => {
      petal.remove();
    });
    fragment.appendChild(petal);
  }
  container.appendChild(fragment);
}