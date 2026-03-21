const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';
let sbClient = null;

try {
    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Supabase API init error (Home Films):", e);
}

async function initHomeSelectedWorks() {
    if (!sbClient) return;

    const container = document.getElementById('homeSelectedWorksContainer');
    if (!container) return;

    try {
        const { data: films, error } = await sbClient
            .from('films')
            .select('*')
            .eq('is_selected_work', true)
            .eq('status', 'PUBLISHED')
            .limit(4)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!films || films.length === 0) {
            container.innerHTML = '<div class="col-span-full py-20 text-center opacity-40 uppercase tracking-widest text-xs">More cinematic works coming soon...</div>';
            return;
        }

        let html = '';
        films.forEach(film => {
            html += `
                <div class="video-item fade-in visible">
                    <div class="video-wrapper aspect-video bg-surface-container overflow-hidden relative">
                            <video 
                                src="${film.video_url || ''}" 
                                controls 
                                class="w-full h-full object-cover" 
                                poster="${film.cover_image_url || 'assets/cinematic-frame.jpg'}"
                                preload="metadata"
                                playsinline
                                onclick="if (event.offsetY < this.offsetHeight * 0.85) { event.preventDefault(); this.paused ? this.play() : this.pause(); }">
                            </video>
                    </div>
                    <div class="mt-8">
                        <h3 class="text-2xl italic font-serif">${film.couple_name || film.title}</h3>
                        <p class="text-xs tracking-widest uppercase text-primary opacity-60 mt-3">${film.category || 'FILM'}</p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Trigger animations if the animation handler is globally available
        if (typeof window.triggerGlobalAnimations === 'function') {
            window.triggerGlobalAnimations();
        }

    } catch (err) {
        console.error('[Selected Works] Fetch error:', err);
        container.innerHTML = '<div class="col-span-full py-20 text-center text-primary/60 uppercase tracking-widest text-xs">Unable to load curated portfolio</div>';
    }
}

document.addEventListener('DOMContentLoaded', initHomeSelectedWorks);
