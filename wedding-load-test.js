import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { randomString, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "1m", target: 100 },   // Warm up
    { duration: "2m", target: 300 },   // Scale
    { duration: "3m", target: 500 },   // Peak
    { duration: "2m", target: 500 },   // Sustain
    { duration: "1m", target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"],  // 95% under 1.5s
    http_req_failed: ["rate<0.02"],     // <2% failures
  },
};

const BASE = "https://wedding-website-ox7g.onrender.com";

const SUPABASE_URL = "https://qgdifervtqgkmvonawza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGlmZXJ2dHFna212b25hd3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTU2MDUsImV4cCI6MjA4NjM5MTYwNX0.v_Kf0OWU1F8DC3ThOPaYNne8b6a1EjPpOpGAb4HAvpA";

// Small fake image payload (~50kb)
const imageData = new Uint8Array(50000).fill(120);

export default function () {

  // ===============================
  // 1️⃣ VISIT MAIN PAGE
  // ===============================

  let res = http.get(BASE);
  check(res, { "homepage loaded": (r) => r.status === 200 });

  sleep(randomIntBetween(1, 3));

  // ===============================
  // 2️⃣ RSVP SUBMISSION
  // ===============================

  const isAttending = Math.random() > 0.2;

  const rsvpPayload = JSON.stringify({
    full_name: `Guest_${randomString(8)}`,
    phone: isAttending ? "+3069" + randomIntBetween(10000000, 99999999) : null,
    attendance: isAttending ? "Yes" : "No",
    seats_reserved: isAttending ? randomIntBetween(1, 4) : null,
    message: "Looking forward to celebrating 🤍",
  });

  let rsvpRes = http.post(
    `${SUPABASE_URL}/rest/v1/rsvps`,
    rsvpPayload,
    {
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
    }
  );

  check(rsvpRes, { "RSVP inserted": (r) => r.status === 201 });

  sleep(randomIntBetween(1, 2));

  // ===============================
  // 3️⃣ IMAGE UPLOAD
  // ===============================

  const fileName = `memory_${randomString(12)}.jpg`;

  let uploadRes = http.put(
    `${SUPABASE_URL}/storage/v1/object/public-pics/${fileName}`,
    imageData,
    {
      headers: {
        "Content-Type": "image/jpeg",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  check(uploadRes, { "image uploaded": (r) => r.status === 200 });

  sleep(1);

  // ===============================
  // 4️⃣ VIEW DIGITAL ALBUM
  // ===============================

  let albumRes = http.get(`${BASE}/digital-album.html`);
  check(albumRes, { "album page loaded": (r) => r.status === 200 });

  sleep(randomIntBetween(2, 4));
}