const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';
let sbClient = null;

try {
    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Supabase API init error:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('video-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loader = document.getElementById('loader-container');
    
    let currentPage = 0;
    const FILMS_PER_PAGE = 6;
    
    async function loadFilms(reset = false) {
        if (!sbClient) return;
        
        if (reset) {
            currentPage = 0;
            grid.innerHTML = '';
            if (loader) loader.classList.add('active');
        }
        
        try {
            if (reset && loadMoreBtn) {
                // Initial load: button is hidden, loader is visible
                loadMoreBtn.style.display = 'none';
            } else if (loadMoreBtn) {
                loadMoreBtn.innerText = 'LOADING MORE...';
            }
            
            const from = currentPage * FILMS_PER_PAGE;
            const to = from + FILMS_PER_PAGE - 1;
            
            const { data: films, error } = await sbClient.from('films')
                .select('*')
                .eq('status', 'PUBLISHED')
                .order('created_at', { ascending: false })
                .range(from, to);
                
            if (error) throw error;
            
            if (films.length === 0 && reset) {
                grid.innerHTML = '<div class="col-span-full text-center opacity-50 text-xl font-serif">More films coming soon...</div>';
                if(loadMoreBtn) loadMoreBtn.style.display = 'none';
                if (loader) loader.classList.remove('active');
                return;
            }
            
            let html = '';
            films.forEach(film => {
                html += `
                    <div class="video-item fade-in visible">
                        <div class="video-wrapper aspect-video bg-surface-container overflow-hidden relative">
                            <video src="${film.video_url || ''}" controls class="w-full h-full object-cover" poster="${film.cover_image_url || 'assets/cinematic-frame.jpg'}" preload="metadata" playsinline onclick="if (event.offsetY < this.offsetHeight * 0.85) { event.preventDefault(); this.paused ? this.play() : this.pause(); }"></video>
                        </div>
                        <div class="mt-8">
                            <h3 class="text-2xl italic font-serif">${film.couple_name || film.title}</h3>
                            <p class="text-xs tracking-widest uppercase text-primary opacity-60 mt-3">${film.category || 'FILM'}</p>
                        </div>
                    </div>
                `;
            });
            
            if (reset) {
                grid.innerHTML = html;
                if (loader) loader.classList.remove('active');
            } else {
                grid.insertAdjacentHTML('beforeend', html);
            }
            
            // Check if there are more
            if (films.length < FILMS_PER_PAGE) {
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            } else {
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'inline-block';
                    loadMoreBtn.innerText = 'LOAD MORE FILMS';
                }
            }
            
            currentPage++;
            
        } catch(e) {
            console.error(e);
            if (loadMoreBtn) loadMoreBtn.innerText = 'ERROR LOADING';
            if (loader) loader.classList.remove('active');
        }
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadFilms(false);
        });
    }
    
    loadFilms(true);
});
