(function() {
    /**
     * packages-handler.js - Public side logic for Packages
     * Fetches and displays packages from Supabase Database.
     */

    const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';

    let sbClientPkg = null;

    if (window.supabase) {
        sbClientPkg = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
     * Fetch active packages from the database
     */
    async function fetchPublicPackages() {
        if (!sbClientPkg) return [];
        try {
            const { data, error } = await sbClientPkg
                .from('packages')
                .select('*')
                .eq('status', 'ACTIVE')
                .order('price', { ascending: true });

            if (error) throw error;
            logBackend('Fetch Packages', 'SUCCESS', `Loaded ${data.length} active packages`);
            return data || [];
        } catch (err) {
            logBackend('Fetch Packages', 'ERROR', 'Could not retrieve packages', err);
            return [];
        }
    }

    /**
     * Render package card
     */
    function renderPackageCard(pkg, index) {
        const features = pkg.features_summary ? pkg.features_summary.split('\n').filter(f => f.trim()) : [];
        const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pkg.price);
        const waText = encodeURIComponent(`Hi Sagar! I'm interested in the ${pkg.whatsapp_label || pkg.name} package. Please share more details.`);
        
        const isFeatured = pkg.is_signature;

        return `
            <div class="collection-card ${isFeatured ? 'featured' : ''} fade-in" style="animation-delay: ${index * 0.1}s">
                ${isFeatured ? '<div class="featured-badge">Our Signature</div>' : ''}
                <h4>${pkg.name}</h4>
                <p class="description">${features[0] || 'Artisanal documentation of your most significant moments.'}</p>
                <ul class="features">
                    ${features.slice(1).map(f => `<li>${f}</li>`).join('')}
                    <li class="package-price">${formattedPrice}</li>
                </ul>
                <a href="https://wa.me/916363770057?text=${waText}"
                    target="_blank" rel="noopener"
                    class="btn btn-outline px-16 py-5 inline-flex items-center gap-4 group">
                    Enquire on WhatsApp
                </a>
            </div>
        `;
    }

    const initPackages = async () => {
        if (window.packagesInitialized) return;
        window.packagesInitialized = true;
        
        console.log('[Packages] Handler initializing (IIFE)...');
        
        if (!sbClientPkg && window.supabase) {
            sbClientPkg = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        
        if (!sbClientPkg) {
            console.error('[Packages] Supabase client unavailable.');
            return;
        }
        
        let packages = await fetchPublicPackages();
        console.log(`[Packages] Found ${packages.length} active packages.`);
        
        // Reorder for 3+ items
        if (packages.length >= 3) {
            const signatureIdx = packages.findIndex(p => p.is_signature);
            if (signatureIdx !== -1) {
                const signaturePkg = packages.splice(signatureIdx, 1)[0];
                packages.splice(1, 0, signaturePkg);
            }
        } else if (packages.length > 0) {
            packages.sort((a,b) => (b.is_signature ? 1 : 0) - (a.is_signature ? 1 : 0));
        }

        const pkgContainers = [
            document.getElementById('packagesContainer'),
            document.querySelector('.pkg-section .grid'),
            document.querySelector('.packages-row-mobile')
        ];

        pkgContainers.forEach(container => {
            if (container) {
                if (packages.length > 0) {
                    container.innerHTML = packages
                        .map((p, idx) => renderPackageCard(p, idx))
                        .join('');
                    console.log('[Packages] Rendered to container successfully.');
                } else {
                    container.innerHTML = '<div class="col-span-full text-center opacity-50 uppercase tracking-widest text-sm py-12">New collections coming soon...</div>';
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPackages);
    } else {
        initPackages();
    }
})();
