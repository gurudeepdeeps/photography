(function() {
    /**
     * home-about-handler.js - Syncs the About section on the Index page with Supabase
     */

    const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';

    let sbClient = null;

    if (window.supabase) {
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

    async function initHomeAbout() {
        console.log('[Home About] Starting sync...');
        if (!sbClient) {
            console.error('[Home About] Supabase client not initialized.');
            return;
        }

        try {
            const { data: profile, error } = await sbClient
                .from('about_profile')
                .select('*')
                .limit(1)
                .single();
            
            if (error) {
                logBackend('Fetch Home Profile', 'ERROR', 'Could not retrieve about profile for home page', error);
                return;
            }

            if (profile) {
                logBackend('Fetch Home Profile', 'SUCCESS', 'Profile loaded for home page display');
                
                // Update Name
                const nameEl = document.getElementById('homeAboutName');
                if (nameEl) nameEl.innerText = profile.name;
                
                // Update Sub Name
                const subNameEl = document.getElementById('homeAboutSubName');
                if (subNameEl) subNameEl.innerText = profile.sub_name;
                
                // Update Bio
                const bioEl = document.getElementById('homeAboutBio');
                if (bioEl) {
                    const bioHtml = profile.bio
                        .split('\n\n')
                        .filter(p => p.trim())
                        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                        .join('');
                    bioEl.innerHTML = bioHtml;
                }

                // Update Stats
                const s1v = document.getElementById('homeAboutStat1Val');
                const s1l = document.getElementById('homeAboutStat1Label');
                if (s1v && profile.stat1_val) s1v.innerText = profile.stat1_val;
                if (s1l && profile.stat1_label) s1l.innerText = profile.stat1_label;
                
                const s2v = document.getElementById('homeAboutStat2Val');
                const s2l = document.getElementById('homeAboutStat2Label');
                if (s2v && profile.stat2_val) s2v.innerText = profile.stat2_val;
                if (s2l && profile.stat2_label) s2l.innerText = profile.stat2_label;

                // Update Image
                const imgEl = document.getElementById('homeAboutImage');
                if (imgEl && profile.portrait_url) {
                    imgEl.src = profile.portrait_url;
                }
                
                console.log('[Home About] UI Synced successfully.');
            }
        } catch (err) {
            logBackend('Home About Context Initialization', 'ERROR', 'Unexpected handler failure', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeAbout);
    } else {
        initHomeAbout();
    }
})();
