
// contact-handler.js - Handles contact form submission to Supabase

const SB_URL = "https://lmtjqneyfebhnzvgdwui.supabase.co";
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaW56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';

let sbClient;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase Client
    if (typeof supabase !== 'undefined') {
        sbClient = supabase.createClient(SB_URL, SB_ANON_KEY);
    }

    const form = document.getElementById('inquiry-form');
    const successMsg = document.getElementById('form-success-msg');
    
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerText = "SENDING...";

                // Collect Form Data
                const fullName = form.querySelector('input[placeholder="Enter your Name"]').value.trim();
                const email = form.querySelector('input[type="email"]').value.trim();
                const phone = form.querySelector('input[type="tel"]').value.trim();
                const message = form.querySelector('textarea').value.trim();
                
                // Collect Checkboxes (Reasons)
                const reasonCheckboxes = form.querySelectorAll('input[name="reason"]:checked');
                const reasons = Array.from(reasonCheckboxes).map(cb => cb.value);
                
                const inquiryData = {
                    client_name: fullName,
                    email: email,
                    phone: phone,
                    message: message,
                    package_interest: reasons.length > 0 ? reasons.join(', ').toUpperCase() : 'GENERAL',
                    reasons: reasons,
                    status: 'UNREAD',
                    created_at: new Date().toISOString()
                };

                // Save to Supabase
                const { error } = await sbClient.from('enquiries').insert([inquiryData]);
                
                if (error) throw error;

                // --- Resend Email Integration via Supabase Edge Function ---
                try {
                    await fetch(`${SB_URL}/functions/v1/send-enquiry-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: fullName,
                            email: email,
                            phone: phone,
                            reasons: reasons.length > 0 ? reasons.join(', ') : 'General enquiry',
                            message: message
                        })
                    });
                } catch (emailErr) {
                    console.error('[Contact] Email trigger failed:', emailErr);
                    // We don't block success if only email fails, as the DB save worked
                }

                // Success State
                form.style.display = 'none';
                successMsg.style.display = 'block';
                successMsg.classList.add('fade-in');

            } catch (err) {
                console.error('[Contact] Submission error details:', err);
                const errorMsg = err.message || (error && error.message) || "Unknown error occurred";
                alert(`Sorry, there was an error: ${errorMsg}. Please try again or contact us via WhatsApp.`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        };
    }
});
