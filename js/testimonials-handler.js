(function () {
    /**
     * testimonials-handler.js - Public side logic for Testimonials
     * Fetches and displays testimonials from Supabase Database.
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

    /**
     * Fetch published testimonials from the database
     */
    async function fetchPublicTestimonials() {
        if (!sbClient) return [];
        try {
            const { data, error } = await sbClient
                .from('testimonials')
                .select('*')
                .eq('status', 'PUBLISHED')
                .order('created_at', { ascending: false });

            if (error) throw error;
            logBackend('Fetch Testimonials', 'SUCCESS', `Loaded ${data.length} published testimonials`);
            return data || [];
        } catch (err) {
            logBackend('Fetch Testimonials', 'ERROR', 'Could not retrieve reviews', err);
            return [];
        }
    }

    /**
     * Render standard card for Home page
     */
    function renderTestimonialCard(item) {
        // Generate initials for avatar
        const initials = item.client_name
            .split('&')
            .map(n => n.trim().charAt(0))
            .join('&');

        return `
            <div class="testimonial-card-dribbble fade-in text-left">
                <div class="card-quote-icon">"</div>
                <div class="card-body-text">
                    "${item.review_text}"
                </div>
                <div class="card-footer">
                    <div class="author-avatar">${initials}</div>
                    <div class="author-info flex flex-col">
                        <span class="author-name-bold">${item.client_name}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render marquee card for Testimonials page
     */
    function renderMarqueeCard(item) {
        return `
            <div class="testimonial-card-dribbble">
                <span class="material-icons card-quote-icon">format_quote</span>
                <p class="card-body-text">"${item.review_text}"</p>
                <div class="card-footer">
                    <div class="author-avatar"><span class="material-icons">person</span></div>
                    <div class="author-info">
                        <span class="author-name-bold">${item.client_name}</span>
                    </div>
                </div>
            </div>
        `;
    }

    const initTestimonials = async () => {
        if (window.testimonialsInitialized) return;
        window.testimonialsInitialized = true;

        console.log('[Testimonials] Handler initializing (IIFE)...');

        if (!sbClient && window.supabase) {
            sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        const testimonials = await fetchPublicTestimonials();

        // 1. Handle Home Page (index.html)
        const homeContainer = document.getElementById('homeTestimonialsContainer');
        if (homeContainer && testimonials.length > 0) {
            // Filter ONLY for selected home testimonials
            let homeTestimonials = testimonials.filter(t => t.is_selected_home === true);

            if (homeTestimonials.length > 0) {
                homeContainer.innerHTML = homeTestimonials
                    .map(t => renderTestimonialCard(t))
                    .join('');
            } else {
                // If nothing is ticked, don't show the "Loading" message anymore
                homeContainer.innerHTML = '';
                // Optional: Hide the section if no testimonials are featured
                const section = homeContainer.closest('section');
                if (section) section.style.display = 'none';
            }
        }

        // 2. Handle Testimonials Page (testimonials.html)
        const marqueeCols = document.querySelectorAll('.marquee-col');
        if (marqueeCols.length > 0 && testimonials.length > 0) {
            const colCount = marqueeCols.length;
            const colBatches = Array.from({ length: colCount }, () => []);

            testimonials.forEach((item, index) => {
                colBatches[index % colCount].push(item);
            });

            // Find max batch size to balance others
            const maxBatchSize = Math.max(...colBatches.map(b => b.length));
            const targetCount = Math.max(10, maxBatchSize * 2);

            marqueeCols.forEach((col, i) => {
                const batch = colBatches[i];
                if (batch.length > 0) {
                    // Match the height by ensuring similar number of cards in all columns
                    const multiplier = Math.max(2, Math.ceil(targetCount / batch.length));
                    let html = '';
                    for (let m = 0; m < multiplier; m++) {
                        html += batch.map(t => renderMarqueeCard(t)).join('');
                    }
                    col.innerHTML = html;
                } else {
                    // Fallback for empty batch
                    col.innerHTML = testimonials.map(t => renderMarqueeCard(t)).join('');
                }
            });
        }

        // 3. Handle Form Submission (testimonials.html)
        const testimonialForm = document.getElementById('testimonialForm');
        if (testimonialForm && sbClient) {
            testimonialForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = testimonialForm.querySelector('.btn-submit');
                const formContent = document.getElementById('formContent');
                const success = document.getElementById('successMessage');

                const client_name = document.getElementById('userName').value;
                const review_text = document.getElementById('userStory').value;

                try {
                    btn.innerHTML = 'Submitting...';
                    btn.disabled = true;

                    const reviewData = {
                        client_name,
                        review_text,
                        status: 'PENDING REVIEW',
                        created_at: new Date().toISOString()
                    };

                    logBackend('Submit Testimonial', 'INFO', `Submitting review for ${client_name}`, reviewData);
                    const { error } = await sbClient
                        .from('testimonials')
                        .insert([reviewData]);

                    if (error) throw error;
                    logBackend('Submit Testimonial', 'SUCCESS', 'Review submitted for moderation');

                    formContent.style.opacity = '0';
                    formContent.style.transform = 'translateY(-20px)';

                    setTimeout(() => {
                        formContent.style.display = 'none';
                        success.style.display = 'block';
                        success.style.opacity = '0';
                        success.style.transform = 'translateY(10px) scale(0.98)';

                        requestAnimationFrame(() => {
                            success.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                            success.style.opacity = '1';
                            success.style.transform = 'translateY(0) scale(1)';
                        });
                    }, 500);

                } catch (err) {
                    logBackend('Submit Testimonial', 'ERROR', 'Could not submit review', err);
                    alert('Submission failed: ' + err.message);
                    btn.innerHTML = 'Retry Submission';
                    btn.disabled = false;
                }
            };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTestimonials);
    } else {
        initTestimonials();
    }
})();
