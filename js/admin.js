/**
 * admin.js - Logic for Admin Dashboard SPA
 */

// Initialize Supabase Client
const SUPABASE_URL = 'https://lmtjqneyfebhnzvgdwui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdGpxbmV5ZmViaG56dmdkd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDkzNzEsImV4cCI6MjA4OTYyNTM3MX0._gemg7d30T3uFDXRJ2We9itBFncioGkQ93rQElqU2lM';
let sbClient = null;

try {
    if (window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('Supabase SDK not found. Live features will be disabled.');
    }
} catch (e) {
    console.error('Failed to initialize Supabase:', e);
}

document.addEventListener('DOMContentLoaded', async () => {

    // Elements
    const navLinks = document.querySelectorAll('[data-target]');
    const views = document.querySelectorAll('.admin-view');
    const topbarTitle = document.querySelector('.topbar-title');
    const searchBar = document.getElementById('topbarSearch');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const adminSidebar = document.getElementById('adminSidebar');

    // --- ROUTE PROTECTION (Non-blocking for UI listeners) ---
    async function checkAuth() {
        if (sbClient) {
            try {
                const { data: { session }, error } = await sbClient.auth.getSession();
                if (error || !session) {
                    window.location.replace('login.html');
                    return;
                }
            } catch (err) {
                console.error("Auth check failed:", err);
            }
        }
    }
    checkAuth();

    // --- LOGOUT LOGIC (Moved to top for reliability) ---
    async function handleLogout(e) {
        if (e) e.preventDefault();
        console.log("Logging out...");
        
        // Immediate redirect fallback in case signOut() hangs
        const timeout = setTimeout(() => {
            console.warn("Logout timeout, forcing redirect");
            window.location.href = 'login.html';
        }, 3000);

        try {
            if (sbClient) {
                await sbClient.auth.signOut();
                console.log("Supabase signed out successfully");
            }
        } catch (err) {
            console.error("Sign out error:", err);
        } finally {
            clearTimeout(timeout);
            window.location.href = 'login.html';
        }
    }

    const signOutBtn = document.getElementById('signOutBtn');
    const topbarLogoutBtn = document.getElementById('topbarLogoutBtn');
    if (signOutBtn) signOutBtn.addEventListener('click', handleLogout);
    if (topbarLogoutBtn) topbarLogoutBtn.addEventListener('click', handleLogout);

    // --- SUPABASE FILMS INTEGRATION ---
    let currentFilmsPage = 0;
    const FILMS_PER_PAGE = 6;
    let currentFilmsFilter = 'ALL';
    window.filmsMap = {};
    let editingFilmId = null;

    async function fetchFilms(reset = true) {
        const listContainer = document.getElementById('filmsList');
        const loadMoreBtn = document.getElementById('loadMoreFilmsBtn');
        if (!listContainer) return;

        if (reset) {
            currentFilmsPage = 0;
            window.filmsMap = {};
            if (!sbClient) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 text-error text-sm uppercase">COULD NOT CONNECT TO DATABASE</div>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }
            listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">LOADING BACKEND...</div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }

        try {
            const from = currentFilmsPage * FILMS_PER_PAGE;
            const to = from + FILMS_PER_PAGE - 1;

            let query = sbClient.from('films').select('*');
                
            if (currentFilmsFilter === 'DRAFT') {
                query = query.eq('status', 'DRAFT');
            }

            const { data: films, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Update Stats
            const { count: filmCount } = await sbClient.from('films').select('*', { count: 'exact', head: true });
            const fStat = document.getElementById('statTotalFilms');
            if(fStat && filmCount !== undefined) fStat.innerHTML = `${filmCount} <span class="material-icons text-primary text-sm">trending_up</span>`;

            if (reset && films.length === 0) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">NO FILMS IN DB. CLICK UPLOAD.</div>';
                return;
            }

            let html = '';
            films.forEach(film => {
                window.filmsMap[film.id] = film;
                const statusClass = film.status === 'PUBLISHED' ? 'success' : 'draft';
                let dateStr = 'N/A';
                const dateVal = film.created_at || film.event_date;
                if (dateVal) {
                    const start = new Date(dateVal);
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    dateStr = `${months[start.getMonth()]}<br>${String(start.getDate()).padStart(2, '0')},<br>${start.getFullYear()}`;
                }

                html += `
                    <div class="film-card fade-in">
                        <div class="drag-handle">
                            <input type="checkbox" class="film-bulk-checkbox" value="${film.id}" style="accent-color: var(--color-primary); cursor: pointer; transform: scale(1.2);">
                        </div>
                        <img src="${film.cover_image_url || 'assets/cinematic-frame.jpg'}" class="film-thumb ${film.status === 'DRAFT' ? 'grayscale' : ''}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'160\\\' height=\\\'90\\\' viewBox=\\\'0 0 160 90\\\' fill=\\\'%232A2A2A\\\'><rect width=\\\'160\\\' height=\\\'90\\\'/></svg>'">
                        
                        <div class="film-info">
                            <div class="text-[10px] text-primary tracking-widest uppercase mb-1">FILM TITLE</div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-medium text-lg ${film.status === 'DRAFT' ? 'text-white/50' : ''}">${film.title}</h3>
                                ${film.is_selected_work ? '<span class="material-icons text-primary text-sm" title="Featured on Home Page">stars</span>' : ''}
                            </div>
                            ${film.is_selected_work ? '<div class="text-[8px] text-primary uppercase tracking-widest font-bold">Featured on Home</div>' : ''}
                        </div>
                        
                        <div class="film-couple">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-1">COUPLE</div>
                            <div class="${film.status === 'DRAFT' ? 'text-white/50' : ''}">${film.couple_name}</div>
                        </div>

                        <div class="film-category w-32">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">CATEGORY</div>
                            <span class="badge ${film.status === 'DRAFT' ? 'badge-outline opacity-50' : 'badge-outline'}">${film.category}</span>
                        </div>

                        <div class="film-status w-32">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">STATUS</div>
                            <span class="badge ${film.status === 'DRAFT' ? 'badge-outline opacity-50' : 'badge-outline'}" 
                                  style="color: ${film.status === 'PUBLISHED' ? '#2ecc71' : 'var(--color-text)'}; border-color: ${film.status === 'PUBLISHED' ? '#2ecc71' : 'var(--color-outline)'};">
                                ${film.status}
                            </span>
                        </div>

                        <div class="film-date text-xs opacity-50 tracking-widest w-24">
                            ${dateStr}
                        </div>

                        <div class="film-actions flex gap-4 ml-auto">
                            <button class="icon-btn-small" onclick="editFilm('${film.id}', event)"><span class="material-icons text-sm hover:text-primary transition-colors">edit</span></button>
                            <button class="icon-btn-small" onclick="deleteFilm('${film.id}', event)"><span class="material-icons text-sm text-error hover:text-error transition-colors">delete</span></button>
                        </div>
                    </div>
                `;
            });

            if (reset) {
                listContainer.innerHTML = html;
            } else {
                listContainer.insertAdjacentHTML('beforeend', html);
            }

            // Animate items natively if not applied by observer yet
            setTimeout(() => {
                const newCards = listContainer.querySelectorAll('.fade-in:not(.visible)');
                newCards.forEach(c => c.classList.add('visible'));
            }, 50);

            // Update bulk select UI logic
            const deleteBtn = document.getElementById('deleteSelectedBtn');
            const countSpn = document.getElementById('selectedCount');
            const checkboxes = document.querySelectorAll('.film-bulk-checkbox');

            function updateBulkDeleteUI() {
                const checkedCount = document.querySelectorAll('.film-bulk-checkbox:checked').length;
                if(deleteBtn && countSpn) {
                    if(checkedCount > 0) {
                        deleteBtn.style.display = 'flex';
                        countSpn.innerText = checkedCount;
                    } else {
                        deleteBtn.style.display = 'none';
                    }
                }
            }

            checkboxes.forEach(cb => {
                cb.addEventListener('change', updateBulkDeleteUI);
            });
            updateBulkDeleteUI(); // Init
            
            currentFilmsPage++;

            if (loadMoreBtn) {
                if (films.length < FILMS_PER_PAGE) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }

        } catch (err) {
            console.error('Error fetching films:', err);
            if (reset) {
                const errMsg = err.message || 'DATABASE FETCH ERROR';
                listContainer.innerHTML = `<div class="text-error text-center py-8 tracking-widest uppercase text-sm">FAILED TO FETCH: ${errMsg}</div>`;
            }
        }
    }

    // Connect Load More Button
    const topLoadMore = document.getElementById('loadMoreFilmsBtn');
    if (topLoadMore) {
        topLoadMore.addEventListener('click', () => {
            fetchFilms(false);
        });
    }

    // Calls will be made at the end of DOMContentLoaded to avoid TDZ errors

    function getStoragePath(url) {
        if (!url || typeof url !== 'string') return null;
        if (url.includes('assets/')) return null; // Ignore local assets
        const bucketPrefix = '/storage/v1/object/public/films_media/';
        const index = url.indexOf(bucketPrefix);
        if (index !== -1) {
            return url.substring(index + bucketPrefix.length);
        }
        return null;
    }

    // Global delete for inline handler
    window.deleteFilm = async function (id, event) {
        if (event) event.stopPropagation();
        
        const film = window.filmsMap[id];
        if (!film) return;

        if (confirm(`Delete '${film.title}' and all its media files?`)) {
            // 1. Identify files to remove
            const filesToRemove = [];
            const cp = getStoragePath(film.cover_image_url);
            if (cp) filesToRemove.push(cp);
            const vp = getStoragePath(film.video_url);
            if (vp) filesToRemove.push(vp);

            // 2. Remove from Storage
            if (filesToRemove.length > 0) {
                console.log("Removing storage files:", filesToRemove);
                await sbClient.storage.from('films_media').remove(filesToRemove);
            }

            // 3. Remove from Database
            await sbClient.from('films').delete().eq('id', id);
            fetchFilms(true);
        }
    }

    // --- SUPABASE ALBUMS INTEGRATION ---
    let currentAlbumsPage = 0;
    const ALBUMS_PER_PAGE = 6;
    let currentAlbumsFilter = 'ALL';
    window.albumsMap = {};
    let editingAlbumId = null;
    let currentManagingAlbumId = null;
    
    // --- SUPABASE TESTIMONIALS INTEGRATION ---
    let currentTestimonialsFilter = 'PUBLISHED';
    window.testimonialsMap = {};
    let editingTestimonialId = null;

    async function fetchAlbums(reset = true) {
        const listContainer = document.getElementById('albumsList');
        const loadMoreBtn = document.getElementById('loadMoreAlbumsBtn');
        if (!listContainer) return;

        if (reset) {
            currentAlbumsPage = 0;
            window.albumsMap = {};
            if (!sbClient) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 text-error text-sm uppercase">COULD NOT CONNECT TO DATABASE</div>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }
            listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">LOADING ALBUMS...</div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }

        try {
            const from = currentAlbumsPage * ALBUMS_PER_PAGE;
            const to = from + ALBUMS_PER_PAGE - 1;

            let query = sbClient.from('albums').select('*');
                
            // Apply category filter if needed (currently filtering by client_name or title is more common for albums)
            // But if the server has a category column, we can use it.
            // For now, let's just use the ALL filter and placeholder for others.

            const { data: albums, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Update Stats
            const { count: albumCount } = await sbClient.from('albums').select('*', { count: 'exact', head: true });
            const aStat = document.getElementById('statTotalAlbums');
            if(aStat && albumCount !== undefined) aStat.innerHTML = `${albumCount} <span class="material-icons text-primary text-sm">photo_library</span>`;

            if (reset && albums.length === 0) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">NO ALBUMS IN DB. CLICK CREATE.</div>';
                return;
            }

            let html = '';
            albums.forEach(album => {
                window.albumsMap[album.id] = album;
                
                let dateStr = 'N/A';
                const dateVal = album.event_date || album.created_at;
                if (dateVal) {
                    const start = new Date(dateVal);
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    dateStr = `${months[start.getMonth()]}<br>${String(start.getDate()).padStart(2, '0')},<br>${start.getFullYear()}`;
                }

                html += `
                    <div class="film-card fade-in">
                        <div class="drag-handle">
                            <input type="checkbox" class="album-bulk-checkbox" value="${album.id}" style="accent-color: var(--color-primary); cursor: pointer; transform: scale(1.2);">
                        </div>
                        <img src="${album.cover_image_url || 'assets/cinematic-frame.jpg'}" class="film-thumb" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'160\\\' height=\\\'90\\\' viewBox=\\\'0 0 160 90\\\' fill=\\\'%232A2A2A\\\'><rect width=\\\'160\\\' height=\\\'90\\\'/></svg>'">
                        
                        <div class="film-info">
                            <div class="text-[10px] text-primary tracking-widest uppercase mb-1">ALBUM TITLE</div>
                            <h3 class="font-medium text-lg">${album.title}</h3>
                        </div>
                        
                        <div class="film-couple">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-1">CLIENT</div>
                            <div>${album.client_name}</div>
                        </div>

                        <div class="film-category w-32">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">PHOTOS</div>
                            <div class="tracking-widest">${album.photo_count || 0} <span class="material-icons text-primary text-xs ml-1">photo</span></div>
                        </div>

                        <div class="film-status w-32">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">ACCESS</div>
                            <div class="flex items-center gap-2 text-xs tracking-widest uppercase">
                                <span class="material-icons text-sm opacity-50">${album.access_level === 'PRIVATE' ? 'lock' : 'public'}</span> 
                                ${album.access_level}
                            </div>
                        </div>

                        <div class="film-date text-xs opacity-50 tracking-widest w-24">
                            ${dateStr}
                        </div>

                        <div class="film-actions flex gap-4 ml-auto">
                            <button class="icon-btn-small" onclick="manageAlbumImages('${album.id}', event)" title="Manage images"><span class="material-icons text-sm hover:text-primary transition-colors">photo_library</span></button>
                            <button class="icon-btn-small" onclick="editAlbum('${album.id}', event)" title="Edit album details"><span class="material-icons text-sm hover:text-primary transition-colors">edit</span></button>
                            <button class="icon-btn-small" onclick="deleteAlbum('${album.id}', event)" title="Delete album"><span class="material-icons text-sm text-error hover:text-error transition-colors">delete</span></button>
                        </div>
                    </div>
                `;
            });

            if (reset) {
                listContainer.innerHTML = html;
            } else {
                listContainer.insertAdjacentHTML('beforeend', html);
            }

            // Animate items
            setTimeout(() => {
                const newCards = listContainer.querySelectorAll('.fade-in:not(.visible)');
                newCards.forEach(c => c.classList.add('visible'));
            }, 50);

            // Bulk Delete logic for albums
            const deleteSelectedBtn = document.getElementById('deleteSelectedAlbumsBtn');
            const countSpn = document.getElementById('selectedAlbumsCount');
            const checkboxes = document.querySelectorAll('.album-bulk-checkbox');

            function updateAlbumBulkDeleteUI() {
                const checkedCount = document.querySelectorAll('.album-bulk-checkbox:checked').length;
                if(deleteSelectedBtn && countSpn) {
                    if(checkedCount > 0) {
                        deleteSelectedBtn.style.display = 'flex';
                        countSpn.innerText = checkedCount;
                    } else {
                        deleteSelectedBtn.style.display = 'none';
                    }
                }
            }

            checkboxes.forEach(cb => cb.addEventListener('change', updateAlbumBulkDeleteUI));
            updateAlbumBulkDeleteUI();
            
            currentAlbumsPage++;

            if (loadMoreBtn) {
                if (albums.length < ALBUMS_PER_PAGE) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }

        } catch (err) {
            console.error('Error fetching albums:', err);
            if (reset) {
                const errMsg = err.message || 'DATABASE FETCH ERROR';
                listContainer.innerHTML = `<div class="text-error text-center py-8 tracking-widest uppercase text-sm">FAILED TO FETCH: ${errMsg}</div>`;
            }
        }
    }

    // --- SUPABASE PACKAGES LOGIC ---
    let currentPackagesFilter = 'ALL';
    let editingPackageId = null;
    window.packagesMap = {};

    async function fetchPackages(reset = true) {
        const listContainer = document.getElementById('packagesList');
        if (!listContainer) return;

        if (reset) {
            window.packagesMap = {};
            if (!sbClient) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 text-error text-sm uppercase">COULD NOT CONNECT TO DATABASE</div>';
                return;
            }
            listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">LOADING PACKAGES...</div>';
        }

        try {
            let query = sbClient.from('packages').select('*').order('created_at', { ascending: false });

            const { data: packages, error } = await query;
            if (error) throw error;

            if (packages.length === 0) {
                listContainer.innerHTML = `<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">NO ${currentPackagesFilter} PACKAGES FOUND</div>`;
                return;
            }

            let html = '';
            packages.forEach(pkg => {
                window.packagesMap[pkg.id] = pkg;
                const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pkg.price);
                
                html += `
                    <div class="film-card fade-in">
                        <div class="drag-handle"><span class="material-icons opacity-30">inventory_2</span></div>
                        <div class="film-info">
                            <div class="text-[10px] text-primary tracking-widest uppercase mb-1">PACKAGE ${pkg.is_signature ? '• SIGNATURE' : ''}</div>
                            <h3 class="font-medium text-lg">${pkg.name}</h3>
                        </div>
                        <div class="film-couple" style="flex: 2;">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-1">PRICE</div>
                            <div class="text-lg font-serif text-primary">${formattedPrice}</div>
                        </div>
                        <div class="film-status w-32">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">STATUS</div>
                            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest border ${pkg.status === 'ACTIVE' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-white/40'}">
                                <span class="w-1.5 h-1.5 rounded-full ${pkg.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-white/30'}"></span> 
                                ${pkg.status}
                            </div>
                        </div>
                        <div class="film-actions flex gap-4 ml-auto items-center">
                            <button class="icon-btn-small" onclick="editPackage('${pkg.id}', event)" title="Edit package">
                                <span class="material-icons text-sm opacity-50 hover:opacity-100 hover:text-primary transition-all">edit</span>
                            </button>
                            <button class="icon-btn-small" onclick="deletePackage('${pkg.id}', event)" title="Delete package">
                                <span class="material-icons text-sm opacity-50 hover:opacity-100 hover:text-error transition-all">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;

        } catch (err) {
            console.error('Packages fetch failed:', err);
            listContainer.innerHTML = `<div class="text-error text-center py-8 text-xs uppercase">ERROR: ${err.message}</div>`;
        }
    }

    // Package Modal Logic
    const addPackageModal = document.getElementById('addPackageModal');
    const newPackageForm = document.getElementById('newPackageForm');
    const pkgStatusMsg = document.getElementById('packageStatusMsg');
    
    if (document.getElementById('addPackageBtn')) {
        document.getElementById('addPackageBtn').addEventListener('click', () => {
            editingPackageId = null;
            document.getElementById('packageModalTitle').innerText = 'Add New Package';
            document.getElementById('savePkgBtn').innerText = 'SAVE PACKAGE';
            newPackageForm.reset();
            addPackageModal.style.display = 'flex';
            setTimeout(() => addPackageModal.classList.add('active'), 50);
        });
    }

    if (document.getElementById('closePackageModalBtn')) {
        document.getElementById('closePackageModalBtn').addEventListener('click', () => {
            addPackageModal.classList.remove('active');
        });
    }

    if (document.getElementById('cancelPkgBtn')) {
        document.getElementById('cancelPkgBtn').addEventListener('click', () => {
            addPackageModal.classList.remove('active');
        });
    }

    window.editPackage = function(id, event) {
        if (event) event.stopPropagation();
        editingPackageId = id;
        const pkg = window.packagesMap[id];
        
        document.getElementById('packageModalTitle').innerText = 'Edit Package';
        document.getElementById('savePkgBtn').innerText = 'UPDATE PACKAGE';
        
        document.getElementById('pkgName').value = pkg.name;
        document.getElementById('pkgStatus').value = pkg.status;
        document.getElementById('pkgPrice').value = pkg.price;
        document.getElementById('pkgWhatsAppLabel').value = pkg.whatsapp_label || '';
        document.getElementById('pkgIsSignature').checked = pkg.is_signature || false;
        document.getElementById('pkgFeatures').value = pkg.features_summary || '';
        
        addPackageModal.style.display = 'flex';
        setTimeout(() => addPackageModal.classList.add('active'), 50);
    };

    window.deletePackage = async function(id, event) {
        if (event) event.stopPropagation();
        if (!confirm('Permanently delete this package?')) return;
        
        try {
            const { error } = await sbClient.from('packages').delete().eq('id', id);
            if (error) throw error;
            fetchPackages(true);
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    if (newPackageForm) {
        newPackageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('savePkgBtn');
            const originalBtnText = saveBtn.innerText;
            
            saveBtn.innerText = 'SAVING...';
            saveBtn.disabled = true;
            pkgStatusMsg.style.display = 'none';

            const pkgData = {
                name: document.getElementById('pkgName').value.trim(),
                category: 'WEDDING', // Default to pass database check constraint since UI categories were removed
                status: document.getElementById('pkgStatus').value,
                price: parseFloat(document.getElementById('pkgPrice').value || 0),
                whatsapp_label: document.getElementById('pkgWhatsAppLabel').value.trim(),
                is_signature: document.getElementById('pkgIsSignature').checked,
                features_summary: document.getElementById('pkgFeatures').value.trim()
            };

            console.log('Attempting to save package:', pkgData);

            try {
                let error;
                if (editingPackageId) {
                    console.log('Updating package:', editingPackageId);
                    const result = await sbClient.from('packages').update(pkgData).eq('id', editingPackageId);
                    error = result.error;
                } else {
                    console.log('Inserting new package');
                    const result = await sbClient.from('packages').insert([pkgData]);
                    error = result.error;
                }

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }

                console.log('Package saved successfully!');
                pkgStatusMsg.innerText = editingPackageId ? 'PACKAGE UPDATED' : 'PACKAGE CREATED';
                pkgStatusMsg.style.display = 'block';
                pkgStatusMsg.className = 'text-xs text-primary tracking-widest uppercase mt-4 mb-4 text-center';
                
                setTimeout(() => {
                    if (addPackageModal) {
                        addPackageModal.classList.remove('active');
                        // Reset display style too if it was set
                        addPackageModal.style.display = 'none';
                    }
                    fetchPackages(true);
                }, 1000);

            } catch (err) {
                console.error('Save package failed full error:', err);
                pkgStatusMsg.innerText = 'SAVE ERROR: ' + (err.message || 'Unknown error');
                pkgStatusMsg.style.display = 'block';
                pkgStatusMsg.className = 'text-xs text-error tracking-widest uppercase mt-4 mb-4 text-center';
            } finally {
                saveBtn.innerText = originalBtnText;
                saveBtn.disabled = false;
            }
        });
    }

    const packagesFilterTabs = document.getElementById('packagesFilterTabs');
    if (packagesFilterTabs) {
        packagesFilterTabs.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                packagesFilterTabs.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                currentPackagesFilter = link.getAttribute('data-filter') || 'ALL';
                fetchPackages(true);
            });
        });
    }

    // --- SUPABASE TESTIMONIALS LOGIC ---
    async function fetchTestimonials(reset = true) {
        const listContainer = document.getElementById('testimonialsList');
        if (!listContainer) return;

        if (reset) {
            window.testimonialsMap = {};
            if (!sbClient) {
                listContainer.innerHTML = '<div class="opacity-50 text-center py-8 text-error text-sm uppercase">COULD NOT CONNECT TO DATABASE</div>';
                return;
            }
            listContainer.innerHTML = '<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">LOADING REVIEWS...</div>';
        }

        try {
            const { data: testimonials, error } = await sbClient
                .from('testimonials')
                .select('*')
                .eq('status', currentTestimonialsFilter)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (testimonials.length === 0) {
                listContainer.innerHTML = `<div class="opacity-50 text-center py-8 tracking-widest uppercase text-sm">NO ${currentTestimonialsFilter} TESTIMONIALS</div>`;
                return;
            }

            let html = '';
            testimonials.forEach(item => {
                window.testimonialsMap[item.id] = item;
                const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
                
                html += `
                    <div class="film-card fade-in">
                        <div class="drag-handle"><span class="material-icons opacity-30">comment</span></div>
                        <div class="film-info">
                            <div class="flex items-center gap-2 mb-1">
                                <div class="text-[10px] text-primary tracking-widest uppercase">CLIENT</div>
                                ${item.is_selected_home ? '<span class="material-icons text-[12px] text-primary" title="Featured on Home Page">stars</span>' : ''}
                            </div>
                            <h3 class="font-medium text-lg">${item.client_name}</h3>
                        </div>
                        <div class="film-couple" style="flex: 2.5;">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-1">REVIEW</div>
                            <div class="text-xs opacity-80 line-clamp-2">${item.review_text}</div>
                        </div>
                        <div class="film-status w-40">
                            <div class="text-[10px] opacity-50 tracking-widest uppercase mb-2">STATUS</div>
                            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest border ${item.status === 'PUBLISHED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}">
                                <span class="w-1.5 h-1.5 rounded-full ${item.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'}"></span> 
                                ${item.status}
                            </div>
                        </div>
                        <div class="film-actions flex gap-4 ml-auto items-center">
                            ${item.status === 'PENDING REVIEW' ? `
                            <button class="icon-btn-small" onclick="approveTestimonial('${item.id}', event)" title="Approve & Publish">
                                <span class="material-icons text-sm text-primary hover:scale-110 transition-transform">check_circle</span>
                            </button>` : ''}
                            <button class="icon-btn-small" onclick="editTestimonial('${item.id}', event)" title="Edit testimonial">
                                <span class="material-icons text-sm opacity-50 hover:opacity-100 hover:text-primary transition-all">edit</span>
                            </button>
                            <button class="icon-btn-small" onclick="deleteTestimonial('${item.id}', event)" title="Delete testimonial">
                                <span class="material-icons text-sm opacity-50 hover:opacity-100 hover:text-error transition-all">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;

        } catch (err) {
            console.error('Testimonials fetch failed:', err);
            listContainer.innerHTML = `<div class="text-error text-center py-8 text-xs uppercase">ERROR: ${err.message}</div>`;
        }
    }

    // Connect Filter Tabs for Testimonials
    const testimonialsFilterTabs = document.getElementById('testimonialsFilterTabs');
    if (testimonialsFilterTabs) {
        testimonialsFilterTabs.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                testimonialsFilterTabs.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                currentTestimonialsFilter = link.getAttribute('data-filter') || 'PUBLISHED';
                fetchTestimonials(true);
            });
        });
    }

    // Connect Load More for Albums
    const loadMoreAlbumsBtn = document.getElementById('loadMoreAlbumsBtn');
    if (loadMoreAlbumsBtn) {
        loadMoreAlbumsBtn.addEventListener('click', () => {
            fetchAlbums(false);
        });
    }

    // Connect Filter Tabs for Albums
    const albumsFilterTabs = document.getElementById('albumsFilterTabs');
    if (albumsFilterTabs) {
        albumsFilterTabs.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                albumsFilterTabs.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                currentAlbumsFilter = link.getAttribute('data-filter') || 'ALL';
                fetchAlbums(true);
            });
        });
    }

    // Create Album Button
    const createAlbumBtn = document.getElementById('createAlbumBtn');
    if (createAlbumBtn) {
        createAlbumBtn.addEventListener('click', (e) => {
            e.preventDefault();
            editingAlbumId = null;
            document.getElementById('albumModalTitle').innerText = 'Create New Album';
            document.getElementById('saveAlbumBtn').innerText = 'CREATE ALBUM';
            document.getElementById('newAlbumForm').reset();
            document.getElementById('currentAlbumCoverPreview').classList.add('hidden');
            
            const modal = document.getElementById('addAlbumModal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 50);
            }
        });
    }

    // Close Album Modal
    const addAlbumModal = document.getElementById('addAlbumModal');
    const closeAlbumModalBtn = document.getElementById('closeAlbumModalBtn');
    const cancelAlbumBtn = document.getElementById('cancelAlbumBtn');

    function closeAddAlbumModal() {
        if (addAlbumModal) {
            addAlbumModal.classList.remove('active');
            setTimeout(() => addAlbumModal.style.display = 'none', 300);
        }
    }
    if (closeAlbumModalBtn) closeAlbumModalBtn.onclick = closeAddAlbumModal;
    if (cancelAlbumBtn) cancelAlbumBtn.onclick = closeAddAlbumModal;

    // Save Album
    const newAlbumForm = document.getElementById('newAlbumForm');
    if (newAlbumForm) {
        newAlbumForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveAlbumBtn');
            const statusMsg = document.getElementById('albumUploadStatusMsg');
            
            const title = document.getElementById('addAlbumTitle').value;
            const client_name = document.getElementById('addAlbumClient').value;
            const category = document.getElementById('addAlbumCategory').value;
            const event_date = document.getElementById('addAlbumDate').value;
            const access_level = document.getElementById('addAlbumAccess').value;
            const coverFileInput = document.getElementById('addAlbumCover');
            
            try {
                saveBtn.disabled = true;
                saveBtn.innerText = 'SAVING...';
                statusMsg.innerText = 'UPLOADING DATA...';
                statusMsg.style.display = 'block';

                let coverUrl = editingAlbumId ? window.albumsMap[editingAlbumId].cover_image_url : null;
                
                // Upload cover if provided
                if (coverFileInput.files.length > 0) {
                    const file = coverFileInput.files[0];
                    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
                    const filePath = `album_covers/${fileName}`;
                    
                    const { data, error: uploadError } = await sbClient.storage
                        .from('films_media') // Renaming bucket or using existing one
                        .upload(filePath, file);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = sbClient.storage
                        .from('films_media')
                        .getPublicUrl(filePath);
                    
                    coverUrl = publicUrl;
                }

                const albumData = {
                    title,
                    client_name,
                    category,
                    event_date: event_date || null,
                    access_level,
                    cover_image_url: coverUrl
                };

                let albumId = editingAlbumId;
                let result;
                if (editingAlbumId) {
                    result = await sbClient.from('albums').update(albumData).eq('id', editingAlbumId).select();
                } else {
                    result = await sbClient.from('albums').insert([albumData]).select();
                }

                if (result.error) throw result.error;
                
                // Get the ID (either existing or newly created)
                albumId = result.data[0].id;

                // --- Handle Bulk Gallery Photo Upload ---
                const bulkPhotosInput = document.getElementById('addAlbumPhotosBulk');
                if (bulkPhotosInput && bulkPhotosInput.files.length > 0) {
                    const photos = bulkPhotosInput.files;
                    statusMsg.innerText = `UPLOADING ${photos.length} GALLERY PHOTOS...`;
                    
                    for (let i = 0; i < photos.length; i++) {
                        const file = photos[i];
                        statusMsg.innerText = `UPLOADING (${i + 1}/${photos.length}): ${file.name}...`;
                        
                        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
                        const filePath = `albums/${albumId}/${fileName}`;
                        
                        const { error: uploadError } = await sbClient.storage
                            .from('films_media')
                            .upload(filePath, file);
                        
                        if (uploadError) {
                            console.error("Single image upload failed:", uploadError);
                            continue; // Continue with others
                        }

                        const { data: { publicUrl } } = sbClient.storage
                            .from('films_media')
                            .getPublicUrl(filePath);

                        await sbClient.from('album_images').insert([{
                            album_id: albumId,
                            image_url: publicUrl,
                            order_index: i
                        }]);
                    }

                    // Update photo count
                    const { data: countData } = await sbClient
                        .from('album_images')
                        .select('id', { count: 'exact' })
                        .eq('album_id', albumId);
                    
                    if (countData) {
                        await sbClient.from('albums').update({ photo_count: countData.length }).eq('id', albumId);
                    }
                }

                statusMsg.innerText = 'SUCCESS!';
                setTimeout(() => {
                    closeAddAlbumModal();
                    fetchAlbums(true);
                    saveBtn.disabled = false;
                    statusMsg.style.display = 'none';
                }, 1000);

            } catch (err) {
                console.error('Save failed:', err);
                statusMsg.innerText = 'ERROR: ' + (err.message || 'Unknown error');
                saveBtn.disabled = false;
            }
        });
    }

    // Manage Album Images Global
    window.manageAlbumImages = async function(id, event) {
        if(event) event.stopPropagation();
        const album = window.albumsMap[id];
        if(!album) return;
        
        currentManagingAlbumId = id;
        document.getElementById('manageImagesSubtitle').innerText = `ALBUM: ${album.title} | CLIENT: ${album.client_name}`;
        
        // Show Modal
        const modal = document.getElementById('manageImagesModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 50);
        }
        
        fetchAlbumImages(id);
    }

    async function fetchAlbumImages(albumId) {
        const grid = document.getElementById('albumImagesGrid');
        if(!grid) return;
        
        grid.innerHTML = '<div class="col-span-full opacity-50 text-center py-8 tracking-widest uppercase text-xs">LOADING PHOTOS...</div>';
        
        try {
            const { data: images, error } = await sbClient
                .from('album_images')
                .select('*')
                .eq('album_id', albumId)
                .order('order_index', { ascending: true });
            
            if (error) throw error;
            
            if (images.length === 0) {
                grid.innerHTML = '<div class="col-span-full opacity-50 text-center py-8 tracking-widest uppercase text-xs">NO PHOTOS IN THIS ALBUM. UPLOAD SOME BELOW.</div>';
                // Update photo count in albums table if needed
                await sbClient.from('albums').update({ photo_count: 0 }).eq('id', albumId);
                return;
            }
            
            // Update photo count
            await sbClient.from('albums').update({ photo_count: images.length }).eq('id', albumId);

            let html = '';
            images.forEach(img => {
                html += `
                    <div class="relative group aspect-square bg-surface-lowest overflow-hidden border border-outline">
                        <img src="${img.image_url}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                        <button onclick="deleteAlbumImage('${img.id}', event)" class="absolute top-2 right-2 p-1.5 bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                            <span class="material-icons text-xs">delete</span>
                        </button>
                    </div>
                `;
            });
            grid.innerHTML = html;
            
        } catch (err) {
            console.error('Images fetch failed:', err);
            grid.innerHTML = `<div class="col-span-full text-error text-center py-8 text-xs uppercase">ERROR: ${err.message}</div>`;
        }
    }

    // Upload Photos to Album
    const uploadAlbumPhotos = document.getElementById('uploadAlbumPhotos');
    if (uploadAlbumPhotos) {
        uploadAlbumPhotos.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files.length || !currentManagingAlbumId) return;
            
            const status = document.getElementById('photosUploadStatus');
            status.style.display = 'block';
            status.innerText = `UPLOADING ${files.length} PHOTOS...`;
            
            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
                    const filePath = `albums/${currentManagingAlbumId}/${fileName}`;
                    
                    status.innerText = `UPLOADING ${i+1}/${files.length}: ${file.name}...`;

                    const { data, error: uploadError } = await sbClient.storage
                        .from('films_media')
                        .upload(filePath, file);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = sbClient.storage
                        .from('films_media')
                        .getPublicUrl(filePath);
                    
                    // Insert into album_images
                    const { error: dbError } = await sbClient.from('album_images').insert([{
                        album_id: currentManagingAlbumId,
                        image_url: publicUrl,
                        order_index: i // For now just simple index
                    }]);
                    
                    if (dbError) throw dbError;
                }
                
                status.innerText = 'SUCCESSFULLY UPLOADED ALL PHOTOS';
                setTimeout(() => status.style.display = 'none', 3000);
                uploadAlbumPhotos.value = ''; // Clear input
                fetchAlbumImages(currentManagingAlbumId);
                fetchAlbums(true); // Refresh main list to show count
                
            } catch (err) {
                console.error('Batch upload failed:', err);
                status.innerText = 'UPLOAD FAILED: ' + err.message;
            }
        });
    }

    // Global image delete
    window.deleteAlbumImage = async function(id, event) {
        if(event) event.stopPropagation();
        if(!confirm('Delete this photo permanently?')) return;
        
        try {
            // Get image url to remove from storage
            const { data: img, error: getErr } = await sbClient
                .from('album_images')
                .select('*')
                .eq('id', id)
                .single();
                
            if (getErr) throw getErr;
            
            const sp = getStoragePath(img.image_url);
            if (sp) {
                await sbClient.storage.from('films_media').remove([sp]);
            }
            
            const { error: delErr } = await sbClient
                .from('album_images')
                .delete()
                .eq('id', id);
                
            if (delErr) throw delErr;
            
            fetchAlbumImages(currentManagingAlbumId);
            
        } catch (err) {
            console.error('Delete photo failed:', err);
            alert('Failed to delete photo: ' + err.message);
        }
    }

    // Close Manage Images Modal
    const manageImagesModal = document.getElementById('manageImagesModal');
    const closeManageImagesBtn = document.getElementById('closeManageImagesBtn');
    const doneManageImagesBtn = document.getElementById('doneManageImagesBtn');

    if (closeManageImagesBtn) closeManageImagesBtn.onclick = () => {
        manageImagesModal.classList.remove('active');
        setTimeout(() => manageImagesModal.style.display = 'none', 300);
    };
    if (doneManageImagesBtn) doneManageImagesBtn.onclick = () => {
        manageImagesModal.classList.remove('active');
        setTimeout(() => manageImagesModal.style.display = 'none', 300);
    };

    // Global edit album
    window.editAlbum = function(id, event) {
        if(event) event.stopPropagation();
        const album = window.albumsMap[id];
        if(!album) return;
        
        editingAlbumId = id;
        document.getElementById('albumModalTitle').innerText = 'Edit Album Details';
        document.getElementById('saveAlbumBtn').innerText = 'SAVE CHANGES';
        
        document.getElementById('addAlbumTitle').value = album.title;
        document.getElementById('addAlbumClient').value = album.client_name;
        document.getElementById('addAlbumCategory').value = album.category || 'WEDDING';
        document.getElementById('addAlbumDate').value = album.event_date || '';
        document.getElementById('addAlbumAccess').value = album.access_level || 'PRIVATE';
        
        const preview = document.getElementById('currentAlbumCoverPreview');
        if(album.cover_image_url) {
            preview.classList.remove('hidden');
            preview.innerHTML = `Current: <a href="${album.cover_image_url}" target="_blank" class="text-primary hover:underline">View Cover</a>`;
        } else {
            preview.classList.add('hidden');
        }
        
        const modal = document.getElementById('addAlbumModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 50);
        }
    }

    // Global delete album
    window.deleteAlbum = async function(id, event) {
        if(event) event.stopPropagation();
        const album = window.albumsMap[id];
        if(!album || !confirm(`Delete album '${album.title}' and all its photos?`)) return;
        
        try {
            // 1. Get all images to clean storage
            const { data: images } = await sbClient.from('album_images').select('image_url').eq('album_id', id);
            
            const filesToRemove = [];
            if(album.cover_image_url) {
                const sp = getStoragePath(album.cover_image_url);
                if(sp) filesToRemove.push(sp);
            }
            if(images) {
                images.forEach(img => {
                    const sp = getStoragePath(img.image_url);
                    if(sp) filesToRemove.push(sp);
                });
            }
            
            if(filesToRemove.length > 0) {
                await sbClient.storage.from('films_media').remove(filesToRemove);
            }
            
            // 2. Cascade delete will handle album_images if foreign key is set to CASCADE
            // If not, we might need to delete album_images manually
            await sbClient.from('album_images').delete().eq('album_id', id);
            await sbClient.from('albums').delete().eq('id', id);
            
            fetchAlbums(true);
            
        } catch (err) {
            console.error('Delete album failed:', err);
            alert('Delete failed: ' + err.message);
        }
    }

    // --- TESTIMONIALS HANDLERS ---
    const addTestimonialBtn = document.getElementById('addTestimonialBtn');
    const addTestimonialModal = document.getElementById('addTestimonialModal');
    const closeTestimonialModalBtn = document.getElementById('closeTestimonialModalBtn');
    const cancelTestiBtn = document.getElementById('cancelTestiBtn');
    const newTestimonialForm = document.getElementById('newTestimonialForm');

    function closeAddTestiModal() {
        if (addTestimonialModal) {
            addTestimonialModal.classList.remove('active');
            setTimeout(() => {
                addTestimonialModal.style.display = 'none';
                if (newTestimonialForm) newTestimonialForm.reset();
                const sel = document.getElementById('testiSelected');
                if (sel) sel.checked = false;
            }, 300);
        }
    }

    if (addTestimonialBtn) {
        addTestimonialBtn.addEventListener('click', () => {
            editingTestimonialId = null;
            document.getElementById('testimonialModalTitle').innerText = 'Add Testimonial';
            document.getElementById('saveTestiBtn').innerText = 'SAVE TESTIMONIAL';
            const modal = document.getElementById('addTestimonialModal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 50);
            }
        });
    }

    if (closeTestimonialModalBtn) closeTestimonialModalBtn.onclick = closeAddTestiModal;
    if (cancelTestiBtn) cancelTestiBtn.onclick = closeAddTestiModal;

    if (newTestimonialForm) {
        newTestimonialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveTestiBtn');
            const statusMsg = document.getElementById('testimonialStatusMsg');
            
            const client_name = document.getElementById('testiClient').value;
            const status = document.getElementById('testiStatus').value;
            const review_text = document.getElementById('testiText').value;
            const is_selected_home = document.getElementById('testiSelected').checked;

            try {
                saveBtn.disabled = true;
                saveBtn.innerText = 'SAVING...';
                statusMsg.style.display = 'block';
                statusMsg.innerText = 'SAVING TO DATABASE...';

                const testiData = { client_name, status, review_text, is_selected_home };

                let res;
                if (editingTestimonialId) {
                    res = await sbClient.from('testimonials').update(testiData).eq('id', editingTestimonialId);
                } else {
                    res = await sbClient.from('testimonials').insert([testiData]);
                }

                if (res.error) throw res.error;

                statusMsg.innerText = 'SUCCESS!';
                setTimeout(() => {
                    closeAddTestiModal();
                    fetchTestimonials(true);
                    saveBtn.disabled = false;
                    statusMsg.style.display = 'none';
                }, 1000);

            } catch (err) {
                console.error('Testimonial save failed:', err);
                statusMsg.innerText = 'ERROR: ' + err.message;
                saveBtn.disabled = false;
            }
        });
    }

    window.editTestimonial = function(id, event) {
        if (event) event.stopPropagation();
        const item = window.testimonialsMap[id];
        if (!item) return;

        editingTestimonialId = id;
        document.getElementById('testimonialModalTitle').innerText = 'Edit Testimonial';
        document.getElementById('saveTestiBtn').innerText = 'SAVE CHANGES';
        
        document.getElementById('testiClient').value = item.client_name;
        document.getElementById('testiStatus').value = item.status || 'PUBLISHED';
        document.getElementById('testiText').value = item.review_text;
        
        const sel = document.getElementById('testiSelected');
        if (sel) sel.checked = item.is_selected_home || false;

        const modal = document.getElementById('addTestimonialModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 50);
        }
    };

    window.deleteTestimonial = async function(id, event) {
        if (event) event.stopPropagation();
        if (!confirm('Delete this testimonial permanently?')) return;

        try {
            const { error } = await sbClient.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            fetchTestimonials(true);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Delete failed: ' + err.message);
        }
    };

    window.approveTestimonial = async function(id, event) {
        if (event) event.stopPropagation();
        try {
            const { error } = await sbClient
                .from('testimonials')
                .update({ status: 'PUBLISHED' })
                .eq('id', id);

            if (error) throw error;
            fetchTestimonials(true);
        } catch (err) {
            console.error('Approval failed:', err);
            alert('Approval failed: ' + err.message);
        }
    };

    // Bulk Delete logic
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const checkedBoxes = document.querySelectorAll('.film-bulk-checkbox:checked');
            const idsToDelete = Array.from(checkedBoxes).map(cb => cb.value);
            
            if (idsToDelete.length === 0) return;

            if (confirm(`Delete ${idsToDelete.length} selected films and all their associated files permanently?`)) {
                deleteSelectedBtn.innerText = 'CLEANING STORAGE...';
                
                // 1. Collect all storage paths
                const allFilesToRemove = [];
                idsToDelete.forEach(id => {
                    const film = window.filmsMap[id];
                    if (film) {
                        const cp = getStoragePath(film.cover_image_url);
                        if (cp) allFilesToRemove.push(cp);
                        const vp = getStoragePath(film.video_url);
                        if (vp) allFilesToRemove.push(vp);
                    }
                });

                // 2. Batch remove from Storage
                if (allFilesToRemove.length > 0) {
                    await sbClient.storage.from('films_media').remove(allFilesToRemove);
                }

                deleteSelectedBtn.innerText = 'DELETING FROM DB...';
                // 3. Batch remove from Database
                await sbClient.from('films').delete().in('id', idsToDelete);
                
                deleteSelectedBtn.style.display = 'none';
                deleteSelectedBtn.innerHTML = '<span class="material-icons text-sm">delete</span> <span>DELETE SELECTED (<span id="selectedCount">0</span>)</span>';
                
                fetchFilms(true);
            }
        });
    }

    // Upload Film (New)
    const uploadFilmBtn = document.getElementById('uploadFilmBtn');
    if (uploadFilmBtn) {
        uploadFilmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            editingFilmId = null;
            
            const titleEl = document.getElementById('filmModalTitle');
            if(titleEl) titleEl.innerText = 'Upload New Film';
            
            const btnEl = document.getElementById('saveFilmBtn');
            if(btnEl) btnEl.innerText = 'UPLOAD FILM';

            // Clear HTML previews implicitly
            const lblC = document.getElementById('currentCoverLabel');
            if(lblC) lblC.classList.add('hidden');
            const prC = document.getElementById('currentCoverPreview');
            if(prC) prC.classList.add('hidden');
            const lblV = document.getElementById('currentVideoLabel');
            if(lblV) lblV.classList.add('hidden');
            const prV = document.getElementById('currentVideoPreview');
            if(prV) prV.classList.add('hidden');

            const modal = document.getElementById('addFilmModal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 50);
            }
        });
    }

    // Edit Film (Global)
    window.editFilm = function(id, event) {
        if(event) event.stopPropagation();
        const film = window.filmsMap[id];
        if(!film) return;
        
        editingFilmId = id;

        // Pre-fill form
        document.getElementById('addFilmCouple').value = film.couple_name || film.title || '';
        document.getElementById('addFilmCategory').value = film.category || 'WEDDING FILM';
        document.getElementById('addFilmStatus').value = film.status || 'PUBLISHED';
        
        const selectedCheckbox = document.getElementById('addFilmSelected');
        if (selectedCheckbox) {
            selectedCheckbox.checked = film.is_selected_work || false;
        }
        // File inputs cannot be pre-filled due to browser security
        
        const titleEl = document.getElementById('filmModalTitle');
        if(titleEl) titleEl.innerText = 'Edit Film';
        
        const btnEl = document.getElementById('saveFilmBtn');
        if(btnEl) btnEl.innerText = 'SAVE CHANGES';
        
        // Show current data helper texts
        const coverLabel = document.getElementById('currentCoverLabel');
        const coverPreview = document.getElementById('currentCoverPreview');
        if(coverPreview && coverLabel) {
            if(film.cover_image_url && film.cover_image_url !== 'assets/cinematic-frame.jpg') {
                coverLabel.classList.remove('hidden');
                coverPreview.classList.remove('hidden');
                coverPreview.innerHTML = `Current: <a href="${film.cover_image_url}" target="_blank" class="text-primary hover:underline">View Image</a>`;
            } else {
                coverLabel.classList.add('hidden');
                coverPreview.classList.add('hidden');
                coverPreview.innerText = '';
            }
        }
        
        const videoLabel = document.getElementById('currentVideoLabel');
        const videoPreview = document.getElementById('currentVideoPreview');
        if(videoPreview && videoLabel) {
            if(film.video_url) {
                videoLabel.classList.remove('hidden');
                videoPreview.classList.remove('hidden');
                videoPreview.innerHTML = `Current: <a href="${film.video_url}" target="_blank" class="text-primary hover:underline">View Video</a>`;
            } else {
                videoLabel.classList.add('hidden');
                videoPreview.classList.add('hidden');
                videoPreview.innerText = '';
            }
        }
        
        // Show Modal
        const modal = document.getElementById('addFilmModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 50);
        }
    };

    const addFilmModal = document.getElementById('addFilmModal');
    const closeFilmModalBtn = document.getElementById('closeFilmModalBtn');
    const cancelFilmBtn = document.getElementById('cancelFilmBtn');
    const newFilmForm = document.getElementById('newFilmForm');

    function closeAddFilmModal() {
        if (addFilmModal) {
            addFilmModal.classList.remove('active');
            setTimeout(() => {
                addFilmModal.style.display = 'none';
                if (newFilmForm) newFilmForm.reset();
                
                // Reset select explicitly if needed or rely on reset()
                const selectedCheckbox = document.getElementById('addFilmSelected');
                if (selectedCheckbox) selectedCheckbox.checked = false;

                const statusMsg = document.getElementById('uploadStatusMsg');
                if (statusMsg) {
                    statusMsg.style.display = 'none';
                    statusMsg.innerText = '';
                }
            }, 300);
        }
    }

    if (closeFilmModalBtn) closeFilmModalBtn.addEventListener('click', closeAddFilmModal);
    if (cancelFilmBtn) cancelFilmBtn.addEventListener('click', closeAddFilmModal);

    if (newFilmForm) {
        newFilmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!sbClient) return;

            const saveBtn = document.getElementById('saveFilmBtn');
            const statusMsg = document.getElementById('uploadStatusMsg');
            const originalText = saveBtn.innerText;

            if (statusMsg) {
                statusMsg.style.display = 'block';
                statusMsg.style.color = 'var(--color-primary)';
                statusMsg.innerText = 'INITIALIZING UPLOAD...';
            }
            saveBtn.innerText = 'UPLOADING...';
            saveBtn.disabled = true;

            const coupleName = document.getElementById('addFilmCouple').value;
            const title = coupleName; // Use Couple Name as Title
            const category = document.getElementById('addFilmCategory').value;
            const status = document.getElementById('addFilmStatus').value;
            const isFeatured = document.getElementById('addFilmSelected').checked;

            const coverInput = document.getElementById('addFilmCover');
            const videoInput = document.getElementById('addFilmVideo');

            try {
                // Limit Check: If user wants to feature this film, check how many are already featured
                if (isFeatured) {
                    const { count, error: countErr } = await sbClient
                        .from('films')
                        .select('*', { count: 'exact', head: true })
                        .eq('is_selected_work', true)
                        .not('id', 'eq', editingFilmId || '00000000-0000-0000-0000-000000000000'); // Exclude current film if editing

                    if (countErr) throw countErr;
                    if (count >= 4) {
                        throw new Error(`You can only feature a maximum of 4 films. Please unfeature another film first.`);
                    }
                }
                // If editing, start with the existing URLs so we don't clear them if the user didn't select new files
                let coverImageUrl = editingFilmId ? window.filmsMap[editingFilmId].cover_image_url : 'assets/cinematic-frame.jpg'; 
                let videoUrl = (editingFilmId && window.filmsMap[editingFilmId].video_url) ? window.filmsMap[editingFilmId].video_url : '';

                // 1. Upload Cover Image (if selected)
                if (coverInput && coverInput.files.length > 0) {
                    if (statusMsg) statusMsg.innerText = 'UPLOADING COVER IMAGE...';
                    const file = coverInput.files[0];
                    const fileName = `cover_${Date.now()}_${file.name}`;
                    const { data, error: uploadError } = await sbClient.storage
                        .from('films_media')
                        .upload(fileName, file);

                    if (uploadError) throw new Error("Cover Upload Failed: " + uploadError.message);

                    const { data: publicUrlData } = sbClient.storage
                        .from('films_media')
                        .getPublicUrl(fileName);
                    coverImageUrl = publicUrlData.publicUrl;
                }

                // 2. Upload Video File (if selected)
                if (videoInput && videoInput.files.length > 0) {
                    if (statusMsg) statusMsg.innerText = 'UPLOADING VIDEO (THIS CAN TAKE SEVERAL MINUTES)...';
                    const file = videoInput.files[0];
                    const fileName = `video_${Date.now()}_${file.name}`;
                    const { data, error: uploadError } = await sbClient.storage
                        .from('films_media')
                        .upload(fileName, file);

                    if (uploadError) throw new Error("Video Upload Failed: " + uploadError.message);

                    const { data: publicUrlData } = sbClient.storage
                        .from('films_media')
                        .getPublicUrl(fileName);
                    videoUrl = publicUrlData.publicUrl;
                }

                if (statusMsg) statusMsg.innerText = 'SAVING RECORD TO DATABASE...';

                // We construct the query body so we only update what is explicitly changed
                const insertData = {
                    title: title,
                    couple_name: coupleName,
                    category: category,
                    status: status,
                    is_selected_work: isFeatured
                };
                
                // Add created_at only if it's a new insert
                if(!editingFilmId) {
                    insertData.created_at = new Date().toISOString();
                    insertData.cover_image_url = coverImageUrl;
                    if(videoUrl) insertData.video_url = videoUrl;
                } else {
                    // It's an update. We only overwrite URL strings if text is found
                    // meaning they distinctly uploaded a new file overriding the cache.
                    if (coverInput && coverInput.files.length > 0) {
                        insertData.cover_image_url = coverImageUrl;
                    }
                    if (videoInput && videoInput.files.length > 0) {
                        insertData.video_url = videoUrl;
                    }
                }

                let error;
                if(editingFilmId) {
                    const res = await sbClient.from('films').update(insertData).eq('id', editingFilmId);
                    error = res.error;
                } else {
                    const res = await sbClient.from('films').insert([insertData]);
                    error = res.error;
                }

                if (error) throw error;
                closeAddFilmModal();
                fetchFilms(true);
            } catch (err) {
                console.error(err);
                if (statusMsg) {
                    statusMsg.style.color = 'var(--color-error)';
                    statusMsg.innerText = 'ERROR: ' + err.message;
                } else {
                    alert("Failed to insert film: " + err.message);
                }
            } finally {
                saveBtn.innerText = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // View Titles Mapping
    const viewTitles = {
        'dashboard': 'SAGAR DODDAMANI | <span class="tracking-widest font-sans text-sm font-medium">ADMIN</span>',
        'films': 'FILMS MANAGER',
        'albums': 'CLIENT ALBUMS MANAGER',
        'packages': 'PACKAGES MANAGER',
        'about': 'ABOUT PAGE MANAGER',
        'testimonials': 'TESTIMONIALS MANAGER',
        'enquiries': 'ENQUIRIES INBOX'
    };

    // Tab switching logic
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Get target view id
            const targetId = link.getAttribute('data-target');

            // Hide all views
            views.forEach(view => {
                view.style.display = 'none';
                view.classList.remove('fade-in');
            });

            // Show target view
            const targetView = document.getElementById(`view-${targetId}`);
            if (targetView) {
                targetView.style.display = 'block';
                // Trigger reflow to restart animation
                void targetView.offsetWidth;
                targetView.classList.add('fade-in');
            }

            // Update Topbar Title
            if (viewTitles[targetId] && topbarTitle) {
                topbarTitle.innerHTML = viewTitles[targetId];
            }

            // Show/Hide search bar based on view
            if (searchBar) {
                if (targetId === 'films' || targetId === 'albums') {
                    searchBar.style.display = 'flex';
                    const input = searchBar.querySelector('input');
                    if (input) input.placeholder = `Search ${targetId}...`;
                } else {
                    searchBar.style.display = 'none';
                }
            }

            // Fetch data if needed
            if (targetId === 'films') {
                fetchFilms(true);
            } else if (targetId === 'albums') {
                fetchAlbums(true);
            } else if (targetId === 'testimonials') {
                fetchTestimonials(true);
            } else if (targetId === 'packages') {
                fetchPackages(true);
            } else if (targetId === 'about') {
                fetchAboutProfile();
                fetchAboutValues();
            } else if (targetId === 'enquiries') {
                fetchEnquiries();
            }

            // On mobile, close sidebar after clicking
            if (window.innerWidth <= 768) {
                adminSidebar.classList.remove('open');
            }
        });
    });

    // Mobile menu toggle
    // The elements mobileMenuBtn and adminSidebar are already declared at the top.
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (mobileMenuBtn && adminSidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
        });
    }

    if (closeSidebarBtn && adminSidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            adminSidebar.classList.remove('open');
        });
    }

    // Logout logic moved to top

    // --- Modal Logic for Prototype Interactions ---
    const modal = document.getElementById('actionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const closeBtns = [
        document.getElementById('closeModalBtn'),
        document.getElementById('cancelModalBtn'),
        document.getElementById('confirmModalBtn')
    ];

    function showModal(title, message) {
        if (!modal) return;
        if (modalTitle) modalTitle.innerText = title;
        if (modalMessage) modalMessage.innerText = message;
        modal.classList.add('active');
    }

    function hideModal() {
        if (modal) modal.classList.remove('active');
    }

    closeBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', hideModal);
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }

    // Attach prototype click handlers to UI buttons (excluding integrated ones)
    const activeBtnIds = [
        '#mobileMenuBtn', '#closeSidebarBtn', '#uploadFilmBtn',
        '#cancelModalBtn', '#confirmModalBtn', '#saveFilmBtn',
        '#cancelFilmBtn', '#closeFilmModalBtn', '#loadMoreFilmsBtn',
        '#signOutBtn', '#topbarLogoutBtn', '#deleteSelectedBtn',
        '#createAlbumBtn', '#saveAlbumBtn', '#cancelAlbumBtn',
        '#closeAlbumModalBtn', '#loadMoreAlbumsBtn', '#deleteSelectedAlbumsBtn',
        '#doneManageImagesBtn', '#closeManageImagesBtn',
        '#addTestimonialBtn', '#saveTestiBtn', '#cancelTestiBtn',
        '#addPackageBtn', '#savePkgBtn', '#cancelPkgBtn', '#closePackageModalBtn',
        '#saveAboutProfileBtn', '#addAboutValueBtn', '#saveValueBtn', '#cancelValueBtn', '#closeValueModalBtn'
    ];
    document.querySelectorAll(`button:not(.modal-close):not([onclick])${activeBtnIds.map(id => `:not(${id})`).join('')}`).forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Extract meaningful action text from button
            let actionText = '';

            // Try to get text nodes directly
            Array.from(btn.childNodes).forEach(node => {
                if (node.nodeType === 3 && node.textContent.trim().length > 0) {
                    actionText += node.textContent.trim() + ' ';
                }
            });

            actionText = actionText.trim();

            // If no text, use the material icon name
            if (!actionText && btn.querySelector('.material-icons')) {
                let iconName = btn.querySelector('.material-icons').innerText.trim();
                // Map icon names to friendly actions
                const iconMap = {
                    'edit': 'Edit Item',
                    'delete': 'Delete Item',
                    'link': 'Share Link',
                    'notifications': 'View Notifications',
                    'settings': 'Admin Settings',
                    'mark_email_read': 'Mark as Read',
                    'archive': 'Archive Message'
                };
                actionText = iconMap[iconName] || iconName;
            }

            if (!actionText) {
                actionText = 'Action';
            }

            showModal(actionText.toUpperCase(), `You clicked the "${actionText}" button. Since this is a UI prototype, backend integration is not currently connected.`);
        });
    });

    // --- ABOUT MANAGER LOGIC ---
    const aboutTabs = document.querySelectorAll('#aboutTabs .tab-link');
    aboutTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.getAttribute('data-target');
            document.querySelectorAll('.tab-content-about').forEach(tc => tc.style.display = 'none');
            document.getElementById(`${target}-section`).style.display = 'block';
            aboutTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // --- Image Preview Logic ---
    const aboutPortraitFile = document.getElementById('aboutPortraitFile');
    if (aboutPortraitFile) {
        aboutPortraitFile.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('aboutPortraitPreview').src = e.target.result;
                    document.getElementById('aboutPortraitPreview').style.opacity = '1';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    async function fetchAboutProfile() {
        if (!sbClient) return;
        try {
            const { data, error } = await sbClient
                .from('about_profile')
                .select('*')
                .single();
            
            if (error) throw error;
            if (data) {
                document.getElementById('aboutName').value = data.name || '';
                document.getElementById('aboutSubName').value = data.sub_name || '';
                document.getElementById('aboutPortraitUrl').value = data.portrait_url || '';
                if (data.portrait_url) {
                    document.getElementById('aboutPortraitPreview').src = data.portrait_url;
                }
                document.getElementById('aboutBio').value = data.bio || '';
                document.getElementById('aboutStat1Val').value = data.stat1_val || '';
                document.getElementById('aboutStat1Label').value = data.stat1_label || '';
                document.getElementById('aboutStat2Val').value = data.stat2_val || '';
                document.getElementById('aboutStat2Label').value = data.stat2_label || '';
                document.getElementById('aboutManifesto').value = data.manifesto_quote || '';
            }
        } catch (err) {
            console.error('[About] Error fetching profile:', err);
        }
    }

    const profileForm = document.getElementById('aboutProfileForm');
    if (profileForm) {
        console.log('[About] Attaching submit listener to form...');
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[About] Form submission triggered');
            
            const status = document.getElementById('aboutProfileStatus');
            const submitBtn = document.getElementById('saveAboutProfileBtn');
            if (status) status.innerText = '';
            
            if (!sbClient) {
                if (status) {
                    status.style.color = 'var(--color-error)';
                    status.innerText = 'DATABASE NOT CONNECTED';
                }
                return;
            }

            try {
                if (submitBtn) {
                    submitBtn.innerText = 'SAVING...';
                    submitBtn.disabled = true;
                }
                if (status) status.innerText = 'SAVING...';

                let portraitUrl = document.getElementById('aboutPortraitUrl').value;
                
                // 1. Upload logic if file selected
                const fileInput = document.getElementById('aboutPortraitFile');
                if (fileInput && fileInput.files.length > 0) {
                    if (status) status.innerText = 'UPLOADING IMAGE...';
                    const file = fileInput.files[0];
                    const fileName = `portrait_${Date.now()}_${file.name}`;
                    
                    const { data: uploadData, error: uploadError } = await sbClient.storage
                        .from('films_media')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = sbClient.storage
                        .from('films_media')
                        .getPublicUrl(fileName);
                    
                    portraitUrl = publicUrlData.publicUrl;
                }

                const profileData = {
                    name: document.getElementById('aboutName').value.trim(),
                    sub_name: document.getElementById('aboutSubName').value.trim(),
                    portrait_url: portraitUrl,
                    bio: document.getElementById('aboutBio').value.trim(),
                    stat1_val: document.getElementById('aboutStat1Val').value.trim(),
                    stat1_label: document.getElementById('aboutStat1Label').value.trim(),
                    stat2_val: document.getElementById('aboutStat2Val').value.trim(),
                    stat2_label: document.getElementById('aboutStat2Label').value.trim(),
                    manifesto_quote: document.getElementById('aboutManifesto').value.trim(),
                    updated_at: new Date().toISOString()
                };

                console.log('[About] Executing Supabase update/insert', profileData);

                // Try to see if record exists
                const { data: current, error: checkError } = await sbClient.from('about_profile').select('id').maybeSingle();
                
                let error;
                if (current) {
                    console.log('[About] Updating existing profile id:', current.id);
                    const result = await sbClient.from('about_profile').update(profileData).eq('id', current.id);
                    error = result.error;
                } else {
                    console.log('[About] Inserting new profile');
                    const result = await sbClient.from('about_profile').insert([profileData]);
                    error = result.error;
                }

                if (error) throw error;
                
                if (status) {
                    status.style.color = '#2ecc71';
                    status.innerText = 'PROFILE UPDATED SUCCESSFULLY!';
                    setTimeout(() => { if(status) status.innerText = ''; }, 3000);
                }
            } catch (err) {
                console.error('[About] Save failed:', err);
                if (status) {
                    status.style.color = 'var(--color-error)';
                    status.innerText = 'SAVE FAILED: ' + err.message;
                }
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = 'SAVE CHANGES';
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // --- VALUES MANAGER ---
    let aboutValuesMap = {};
    async function fetchAboutValues() {
        const list = document.getElementById('aboutValuesList');
        if (!list || !sbClient) return;
        
        try {
            const { data, error } = await sbClient
                .from('about_values')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            aboutValuesMap = {};
            
            if (!data || data.length === 0) {
                list.innerHTML = '<div class="opacity-50 text-center py-12 tracking-widest uppercase text-sm">NO VALUES DEFINED</div>';
                return;
            }

            list.innerHTML = data.map(val => {
                aboutValuesMap[val.id] = val;
                return `
                    <div class="film-card fade-in visible">
                        <div class="film-info">
                            <div class="text-[10px] text-primary tracking-widest uppercase mb-1">CORE VALUE</div>
                            <h3 class="font-medium text-lg">${val.title} ${val.is_featured ? '<span class="text-xs text-primary opacity-60 ml-2">• FEATURED</span>' : ''}</h3>
                            <p class="text-sm opacity-50 mt-1 line-clamp-1">${val.description}</p>
                        </div>
                        <div class="flex gap-4 ml-auto px-6">
                            <button class="icon-btn-small" onclick="editAboutValue('${val.id}')" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                            <button class="icon-btn-small text-error" onclick="deleteAboutValue('${val.id}')" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('[About] Error fetching values:', err);
            list.innerHTML = '<div class="text-error text-center py-8">FAILED TO LOAD VALUES</div>';
        }
    }

    // Modal helpers for values
    const valueModal = document.getElementById('aboutValueModal');
    window.editAboutValue = (id) => {
        const val = aboutValuesMap[id];
        if (!val) return;
        
        document.getElementById('editingValueId').value = val.id;
        document.getElementById('valueTitle').value = val.title;
        document.getElementById('valueDescription').value = val.description || '';
        document.getElementById('valueFeatured').checked = val.is_featured || false;
        document.getElementById('valueModalTitle').innerText = 'Edit Core Value';
        valueModal.classList.add('active');
    };

    const addValBtn = document.getElementById('addAboutValueBtn');
    if (addValBtn) {
        addValBtn.onclick = () => {
            document.getElementById('aboutValueForm').reset();
            document.getElementById('editingValueId').value = '';
            document.getElementById('valueModalTitle').innerText = 'Add Core Value';
            valueModal.classList.add('active');
        };
    }

    const closeValueModalBtn = document.getElementById('closeValueModalBtn');
    const cancelValueBtn = document.getElementById('cancelValueBtn');
    if (closeValueModalBtn) closeValueModalBtn.onclick = () => valueModal.classList.remove('active');
    if (cancelValueBtn) cancelValueBtn.onclick = () => valueModal.classList.remove('active');

    const valueForm = document.getElementById('aboutValueForm');
    if (valueForm) {
        valueForm.onsubmit = async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveValueBtn');
            const status = document.getElementById('valueStatusMsg');
            const id = document.getElementById('editingValueId').value;
            
            try {
                saveBtn.disabled = true;
                status.innerText = 'SAVING...';
                
                const valData = {
                    title: document.getElementById('valueTitle').value.trim(),
                    description: document.getElementById('valueDescription').value.trim(),
                    is_featured: document.getElementById('valueFeatured').checked
                };

                let error;
                if (id) {
                    const result = await sbClient.from('about_values').update(valData).eq('id', id);
                    error = result.error;
                } else {
                    const result = await sbClient.from('about_values').insert([valData]);
                    error = result.error;
                }

                if (error) throw error;
                valueModal.classList.remove('active');
                fetchAboutValues();
            } catch (err) {
                console.error('[About] Error saving value:', err);
                status.style.color = 'var(--color-error)';
                status.innerText = 'FAILED: ' + err.message;
            } finally {
                saveBtn.disabled = false;
            }
        };
    }

    window.deleteAboutValue = async (id) => {
        if (!confirm('Are you sure you want to delete this core value?')) return;
        try {
            const { error } = await sbClient.from('about_values').delete().eq('id', id);
            if (error) throw error;
            fetchAboutValues();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    // --- Enquiries variables (must be before fetch calls) ---
    let enquiries = [];
    let activeEnquiryFilter = 'ALL';

    // --- INITIAL FETCH CYCLE ---
    fetchFilms();
    fetchEnquiries();
    fetchPackages();
    fetchAlbums();

    // Handle hash on load (optional direct linking to views)
    if (window.location.hash) {
        const hashTarget = window.location.hash.substring(1);
        const link = document.querySelector(`[data-target="${hashTarget}"]`);
        if (link) {
            link.click();
        }
    }

    // --- Enquiries Manager Logic ---

    async function fetchEnquiries() {
        if (!sbClient) return;
        const list = document.getElementById('enquiriesList');
        if (!list) return;

        try {
            list.innerHTML = `<div class="p-8 text-center opacity-40 uppercase text-[10px] tracking-widest">Loading Enquiries...</div>`;

            let query = sbClient.from('enquiries').select('*').order('created_at', { ascending: false });

            if (activeEnquiryFilter === 'UNREAD') query = query.eq('status', 'UNREAD');
            else if (activeEnquiryFilter === 'READ') query = query.eq('status', 'READ');
            else if (activeEnquiryFilter === 'ARCHIVED') query = query.eq('status', 'ARCHIVED');

            const { data, error } = await query;
            if (error) throw error;

            // Update Stats - Count UNREAD specifically for the dashboard stat
            const { count: unreadCount } = await sbClient.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'UNREAD');
            const eStat = document.getElementById('statPendingInquiries');
            if(eStat && unreadCount !== undefined) {
                eStat.innerHTML = `${unreadCount} ${unreadCount > 0 ? '<span class="badge badge-error ml-2">URGENT</span>' : ''}`;
            }

            enquiries = data || [];
            renderEnquiryList();
            renderDashboardEnquiries();
        } catch (err) {
            console.error('[Enquiries] Fetch error:', err);
            list.innerHTML = '<div class="text-error p-8 text-center">FAILED TO LOAD</div>';
        }
    }

    function renderEnquiryList() {
        const list = document.getElementById('enquiriesList');
        if (!list) return;

        if (enquiries.length === 0) {
            list.innerHTML = '<div class="p-12 text-center opacity-30 uppercase text-[10px] tracking-widest">No enquiries found</div>';
            return;
        }

        list.innerHTML = enquiries.map(enq => {
            const date = new Date(enq.created_at);
            const timeStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const isUnread = enq.status === 'UNREAD';
            const isActive = document.querySelector('.enquiry-item.active')?.getAttribute('data-id') === enq.id;

            return `
                <div class="enquiry-item ${isUnread ? 'unread' : ''} ${isActive ? 'active' : ''}" 
                     data-id="${enq.id}" onclick="showEnquiryDetails('${enq.id}')">
                    <div class="enquiry-item-meta">
                        <span>${enq.package_interest || 'ENQUIRY'}</span>
                        <span>${timeStr}</span>
                    </div>
                    <h4 class="enquiry-item-title font-serif">${enq.client_name}</h4>
                    <div class="enquiry-item-excerpt">${enq.message}</div>
                    ${isUnread ? '<div class="unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');
    }

    function renderDashboardEnquiries() {
        const list = document.getElementById('dashboardEnquiriesList');
        if (!list) return;

        // Take top 5 recent
        const recent = enquiries.slice(0, 5);

        if (recent.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="text-center py-8 opacity-40 uppercase tracking-widest text-[10px]">No new enquiries</td></tr>';
            return;
        }

        list.innerHTML = recent.map(enq => {
            const date = new Date(enq.created_at);
            const timeStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return `
                <tr>
                    <td>
                        <div class="font-medium text-white">${enq.client_name}</div>
                        <div class="text-[10px] text-primary tracking-widest uppercase mt-1 opacity-80">${enq.category || 'INQUIRY'}</div>
                    </td>
                    <td class="text-sm opacity-60">${timeStr}</td>
                    <td class="text-xs uppercase tracking-widest">${enq.package_interest || 'N/A'}</td>
                    <td><span class="badge badge-outline" style="font-size: 9px; padding: 0.2rem 0.5rem;">${enq.status}</span></td>
                </tr>
            `;
        }).join('');
    }

    window.showEnquiryDetails = async (id) => {
        const enq = enquiries.find(e => e.id === id);
        if (!enq) return;

        // Mark as READ in UI and DB immediately if UNREAD
        if (enq.status === 'UNREAD') {
            await sbClient.from('enquiries').update({ status: 'READ' }).eq('id', id);
            enq.status = 'READ';
            renderEnquiryList(); 
        }

        // Highlight active in list
        document.querySelectorAll('.enquiry-item').forEach(card => {
            card.classList.remove('active');
            if (card.getAttribute('data-id') === id) card.classList.add('active');
        });

        const details = document.getElementById('enquiryDetails');
        if (!details) return;

        const timeStr = new Date(enq.created_at).toLocaleString('en-IN', { 
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const reasonsStr = Array.isArray(enq.reasons) ? enq.reasons.join(', ') : (enq.package_interest || 'General Inquiry');

        details.innerHTML = `
            <div class="fade-in animate-slide-up h-full flex flex-col relative enquiry-details-inner p-12 md:p-16">
                <!-- New Flex Header for Actions -->
                <div class="flex justify-between items-start mb-10 w-full border-b border-outline pb-8">
                    <div class="flex flex-col">
                        <div class="text-primary text-[10px] tracking-[0.6em] uppercase mb-2 opacity-70">Enquiry Received</div>
                        <h2 class="font-serif text-2xl">${enq.client_name}</h2>
                    </div>
                    
                    <div class="flex gap-3 mt-2">
                        <button class="inbox-action-btn" onclick="updateEnquiryStatus('${enq.id}', '${enq.status === 'ARCHIVED' ? 'READ' : 'ARCHIVED'}')">
                            <span class="material-icons text-sm">${enq.status === 'ARCHIVED' ? 'unarchive' : 'archive'}</span>
                            <span class="text-[8px]">${enq.status === 'ARCHIVED' ? 'UNARCHIVE' : 'ARCHIVE'}</span>
                        </button>
                        <button class="inbox-action-btn delete-btn" onclick="deleteEnquiry('${enq.id}')">
                            <span class="material-icons text-sm">delete</span>
                            <span class="text-[8px]">DELETE</span>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto pr-4 mb-8 custom-scrollbar">
                    <div class="enquiry-form-grid">
                        <div class="enquiry-form-field">
                            <label class="enquiry-form-label">Email Address</label>
                            <div class="enquiry-form-value text-sm underline decoration-primary/20 underline-offset-4">${enq.email}</div>
                        </div>
                        <div class="enquiry-form-field">
                            <label class="enquiry-form-label">Phone Number</label>
                            <div class="enquiry-form-value text-sm">${enq.phone || 'Not Provided'}</div>
                        </div>
                        <div class="enquiry-form-field">
                            <label class="enquiry-form-label">Interest Package</label>
                            <div class="enquiry-form-value text-primary font-bold uppercase tracking-widest text-[10px]">${reasonsStr}</div>
                        </div>
                        <div class="enquiry-form-field">
                            <label class="enquiry-form-label">Date Received</label>
                            <div class="enquiry-form-value opacity-60 text-sm">${timeStr}</div>
                        </div>
                    </div>

                    <div class="enquiry-message-area mt-4">
                        <label class="enquiry-form-label mb-3 block opacity-50">Private Message</label>
                        <div class="enquiry-form-value leading-relaxed whitespace-pre-wrap" style="min-height: 200px; align-items: flex-start; padding: 1.5rem 1.75rem;">
                            ${enq.message}
                        </div>
                    </div>
                </div>

                <div class="mt-auto pt-8 border-t border-outline flex flex-wrap gap-4">
                    <a href="mailto:${enq.email}?subject=Regarding your enquiry - Sagar Doddamani" class="reply-btn reply-btn-email flex-1 justify-center">
                        <span class="material-icons">mail</span> SEND EMAIL
                    </a>
                    
                    ${enq.phone ? `
                    <a href="https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(enq.client_name)}, this is Sagar Doddamani regarding your enquiry for ${encodeURIComponent(reasonsStr)}." 
                       target="_blank" 
                       class="reply-btn reply-btn-whatsapp flex-1 justify-center">
                        <span class="material-icons">chat</span> WHATSAPP CHAT
                    </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    window.updateEnquiryStatus = async (id, status) => {
        try {
            const { error } = await sbClient.from('enquiries').update({ status }).eq('id', id);
            if (error) throw error;
            
            // Re-fetch to update list and details view
            await fetchEnquiries();
            if (status === 'ARCHIVED') {
                document.getElementById('enquiryDetails').innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full opacity-30 text-center">
                        <span class="material-icons text-5xl mb-4">mail_outline</span>
                        <p class="uppercase tracking-[0.3em] text-xs">Enquiry Archived</p>
                    </div>
                `;
            } else {
                showEnquiryDetails(id);
            }
        } catch (err) {
            alert('Update failed: ' + err.message);
        }
    };

    window.deleteEnquiry = async (id) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this enquiry?')) return;
        try {
            const { error } = await sbClient.from('enquiries').delete().eq('id', id);
            if (error) throw error;
            
            await fetchEnquiries();
            document.getElementById('enquiryDetails').innerHTML = `
                <div class="flex flex-col items-center justify-center h-full opacity-30 text-center">
                    <span class="material-icons text-5xl mb-4">delete_forever</span>
                    <p class="uppercase tracking-[0.3em] text-xs">Deleted</p>
                </div>
            `;
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    // Filter Tabs for Enquiries
    document.querySelectorAll('#enquiriesFilterTabs .tab-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('#enquiriesFilterTabs .tab-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            activeEnquiryFilter = link.getAttribute('data-filter');
            fetchEnquiries();
        };
    });
});
