// api/send-email.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // REPLACE the entire try/catch email block with this:
try {
  const emailRes = await fetch('https://wedding-website-ox7g.onrender.com/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const emailData = await emailRes.json();
  
  if (!emailRes.ok) {
    console.warn('Email failed (RSVP saved):', emailData);
  }
} catch (emailErr) {
  console.warn('Email notification failed (RSVP saved):', emailErr);
}

}
