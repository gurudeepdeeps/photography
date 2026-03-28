/**
 * login.js - Authentication handler
 */

// Initialize Supabase Client
let sbClient = window.supabaseClient;

if (!sbClient && window.supabase) {
    const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Detailed backend logger
 */
const logBackend = (operation, status, details, error = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const styles = {
        SUCCESS: 'background: #064e3b; color: #34d399; padding: 2px 5px; border-radius: 2px; font-weight: bold;',
        ERROR: 'background: #450a0a; color: #f87171; padding: 2px 5px; border-radius: 2px; font-weight: bold;',
        INFO: 'background: #1e3a8a; color: #60a5fa; padding: 2px 5px; border-radius: 2px; font-weight: bold;'
    };
    
    console.group(`Backend: ${operation} - ${status} (${timestamp})`);
    console.log(`%c${status}`, styles[status] || '', details);
    if (error) console.error('Full Error Object:', error);
    console.groupEnd();
};

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
                logBackend('Sign In', 'ERROR', `Failed login attempt for ${email}`, error);
                loginError.innerText = error.message;
                loginError.style.display = 'block';
                loginSubmitBtn.innerText = 'AUTHENTICATE';
                loginSubmitBtn.disabled = false;
            } else {
                logBackend('Sign In', 'SUCCESS', `User ${email} authenticated successfully`);
                loginSubmitBtn.innerText = 'ACCESS GRANTED';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);
            }
        } catch (err) {
            logBackend('Sign In', 'ERROR', 'Unexpected error during authentication', err);
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
            logBackend('Session Check', 'SUCCESS', `Active session found for ${session.user.email}`);
            window.location.href = 'admin.html';
        } else {
            logBackend('Session Check', 'INFO', 'No active session found');
        }
    } catch(err) {
        logBackend('Session Check', 'ERROR', 'Failed to check session', err);
    }
});
