/**
 * login.js - Authentication handler
 */

// Initialize Supabase Client
const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';
let sbClient = null;

try {
    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error('Failed to initialize Supabase:', e);
}

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    // Always bind this first to prevent silent page reloading
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!sbClient) {
            loginError.innerText = "Database offline. Please check your adblocker/incognito cookies.";
            loginError.style.display = 'block';
            return;
        }
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if(!email || !password) return;

        loginError.style.display = 'none';
        loginSubmitBtn.innerText = 'AUTHENTICATING...';
        loginSubmitBtn.disabled = true;

        try {
            const { data, error } = await sbClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                loginError.innerText = error.message;
                loginError.style.display = 'block';
                loginSubmitBtn.innerText = 'AUTHENTICATE';
                loginSubmitBtn.disabled = false;
            } else {
                loginSubmitBtn.innerText = 'ACCESS GRANTED';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);
            }
        } catch (err) {
            loginError.innerText = "Error: " + err.message;
            loginError.style.display = 'block';
            loginSubmitBtn.innerText = 'AUTHENTICATE';
            loginSubmitBtn.disabled = false;
        }
    });

    if (!sbClient) {
        loginError.innerText = "Database offline. Please disable adblockers.";
        loginError.style.display = "block";
        return;
    }

    // Check if already logged in
    try {
        const { data: { session } } = await sbClient.auth.getSession();
        if (session) {
            window.location.href = 'admin.html';
        }
    } catch(err) {
        console.warn("Could not check session (cookies blocked?):", err);
    }
});
