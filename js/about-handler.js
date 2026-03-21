(function() {
    /**
     * about-handler.js - Public side logic for About page
     * Fetches and displays about profile and values from Supabase.
     */

    const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';

    let sbClient = null;

    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    async function initAbout() {
        if (window.aboutInitialized) return;
        window.aboutInitialized = true;

        if (!sbClient) return;

        console.log('[About] Initializing content...');

        try {
            // 1. Fetch Profile
            const { data: profile, error: pError } = await sbClient
                .from('about_profile')
                .select('*')
                .single();
            
            if (!pError && profile) {
                if (document.getElementById('aboutNameText')) document.getElementById('aboutNameText').innerText = profile.name;
                if (document.getElementById('aboutSubNameText')) document.getElementById('aboutSubNameText').innerText = profile.sub_name;
                if (document.getElementById('aboutBioText')) {
                    document.getElementById('aboutBioText').innerHTML = `<p>${profile.bio.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
                }
                if (document.getElementById('aboutStat1ValText')) document.getElementById('aboutStat1ValText').innerText = profile.stat1_val;
                if (document.getElementById('aboutStat1LabelText')) document.getElementById('aboutStat1LabelText').innerText = profile.stat1_label;
                if (document.getElementById('aboutStat2ValText')) document.getElementById('aboutStat2ValText').innerText = profile.stat2_val;
                if (document.getElementById('aboutStat2LabelText')) document.getElementById('aboutStat2LabelText').innerText = profile.stat2_label;
                if (document.getElementById('aboutManifestoText')) {
                    // Split the quote to wrap last word or specific parts in span if we want, but let's keep it simple
                    document.getElementById('aboutManifestoText').innerText = profile.manifesto_quote;
                }
                if (profile.portrait_url && document.getElementById('aboutPortrait')) {
                    document.getElementById('aboutPortrait').src = profile.portrait_url;
                }
            }

            // 2. Fetch Values
            const { data: values, error: vError } = await sbClient
                .from('about_values')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (!vError && values && values.length > 0) {
                const grid = document.getElementById('aboutValuesGrid');
                if (grid) {
                    grid.innerHTML = values.map((val, index) => `
                        <div class="collection-card fade-in ${val.is_featured ? 'featured' : ''}" style="animation-delay: ${index * 0.1}s">
                            ${val.is_featured ? '<div class="featured-badge">Core Intent</div>' : ''}
                            <h4>${val.title}</h4>
                            <p class="description">${val.description}</p>
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('[About] Handler error:', err);
        } finally {
            // Hide Loader
            const loader = document.getElementById('aboutLoader');
            const mainContent = document.getElementById('aboutHeroMain');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => loader.style.display = 'none', 800);
            }
            if (mainContent) {
                mainContent.style.opacity = '1';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAbout);
    } else {
        initAbout();
    }
})();
