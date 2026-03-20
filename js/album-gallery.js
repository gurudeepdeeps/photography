document.addEventListener('DOMContentLoaded', () => {
    // Album Data - Mock collections for each client
    const albumData = {
        'elena-julian': {
            title: 'Elena & Julian',
            date: 'October 12, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_80naCijI5-ex90eo6FDIVbzWnTiaojPVIhTSixpVaA7NUc6SAY-K20W6hh9zsgodU24i_Lqqw68VPEODZMVcph3u1bU-DN4lamrOEzvLLKlTX6-CglkQlufqqbmc8r5_T1VhTMW9RxTwWgIr7ShM-P0aNuMGepo_ftK11HPwxgfhQ1Ep3P2lvUXx3XT9xE8YZOGC1w1Hep4RZrfWlRRim_QNyvwJrauXNDm2YQvz2KpJ3Lz2DFVNGunSczhiZZvzj5RrZdoYNaB',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCadDFmWv5kx5QY13bV2ILbAs9C9zfZuyHikyxuzmYvv4KDI0-Elb7DjipfxmBQoCIbyIr5rZgeC8etF-38j2Ks_dMtKrl9KPQzj6zfHZ2gItOlIRGBAz1qEeydin6Jzhx16aYtY1DGPr6-g0zgha0__mWsYJqvl9FanzuKVwcbmgK0V_qyR2f4ysEikLZ4FMW3HR52LjMeFJnluTaaut7LEckEcZZ0-ozRP52uYTfYvl0Yilk03goupfKF6Oe5_z9vLbuFvd2dDRON',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru'
            ]
        },
        'sophia-marcus': {
            title: 'Sophia & Marcus',
            date: 'September 24, 2023',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCadDFmWv5kx5QY13bV2ILbAs9C9zfZuyHikyxuzmYvv4KDI0-Elb7DjipfxmBQoCIbyIr5rZgeC8etF-38j2Ks_dMtKrl9KPQzj6zfHZ2gItOlIRGBAz1qEeydin6Jzhx16aYtY1DGPr6-g0zgha0__mWsYJqvl9FanzuKVwcbmgK0V_qyR2f4ysEikLZ4FMW3HR52LjMeFJnluTaaut7LEckEcZZ0-ozRP52uYTfYvl0Yilk03goupfKF6Oe5_z9vLbuFvd2dDRON',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru'
            ]
        },
        'isabella-david': {
            title: 'Isabella & David',
            date: 'June 15, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBcg72GJAQeo-OxC2Pv5V8AzSbFVCkQjo6WIicLAAd7BDKyWNMF0IdqBIVT8O39ixDFwQ8wD0u-QaGrA1DZXVeUwjioXjd-UObqxdxkmgPCTI1ruhisaYoORlDQzYcwzSm_s8Lc8MO5eOU47Nq6zTnpPqzFTy6h2mNM6I2cbUpUYT9hH1vL0lvHwYifE9TGKZMY7ftOmm3X5xZL9VS21HOIfnwfuXiK-VyfEw9046I3OH_BEFH0a6SecTQyHY8W54cDwfxWMhIdabx6'
            ]
        },
        'maya-aarav': {
            title: 'Maya & Aarav',
            date: 'March 08, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBcg72GJAQeo-OxC2Pv5V8AzSbFVCkQjo6WIicLAAd7BDKyWNMF0IdqBIVT8O39ixDFwQ8wD0u-QaGrA1DZXVeUwjioXjd-UObqxdxkmgPCTI1ruhisaYoORlDQzYcwzSm_s8Lc8MO5eOU47Nq6zTnpPqzFTy6h2mNM6I2cbUpUYT9hH1vL0lvHwYifE9TGKZMY7ftOmm3X5xZL9VS21HOIfnwfuXiK-VyfEw9046I3OH_BEFH0a6SecTQyHY8W54cDwfxWMhIdabx6',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru'
            ]
        },
        'nora-leo': {
            title: 'Nora & Leo',
            date: 'December 15, 2023',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru'
            ]
        },
        'grace-harry': {
            title: 'Grace & Harry',
            date: 'February 20, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBcg72GJAQeo-OxC2Pv5V8AzSbFVCkQjo6WIicLAAd7BDKyWNMF0IdqBIVT8O39ixDFwQ8wD0u-QaGrA1DZXVeUwjioXjd-UObqxdxkmgPCTI1ruhisaYoORlDQzYcwzSm_s8Lc8MO5eOU47Nq6zTnpPqzFTy6h2mNM6I2cbUpUYT9hH1vL0lvHwYifE9TGKZMY7ftOmm3X5xZL9VS21HOIfnwfuXiK-VyfEw9046I3OH_BEFH0a6SecTQyHY8W54cDwfxWMhIdabx6'
            ]
        },
        'zara-liam': {
            title: 'Zara & Liam',
            date: 'January 05, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_80naCijI5-ex90eo6FDIVbzWnTiaojPVIhTSixpVaA7NUc6SAY-K20W6hh9zsgodU24i_Lqqw68VPEODZMVcph3u1bU-DN4lamrOEzvLLKlTX6-CglkQlufqqbmc8r5_T1VhTMW9RxTwWgIr7ShM-P0aNuMGepo_ftK11HPwxgfhQ1Ep3P2lvUXx3XT9xE8YZOGC1w1Hep4RZrfWlRRim_QNyvwJrauXNDm2YQvz2KpJ3Lz2DFVNGunSczhiZZvzj5RrZdoYNaB'
            ]
        },
        'clara-ethan': {
            title: 'Clara & Ethan',
            date: 'April 14, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCadDFmWv5kx5QY13bV2ILbAs9C9zfZuyHikyxuzmYvv4KDI0-Elb7DjipfxmBQoCIbyIr5rZgeC8etF-38j2Ks_dMtKrl9KPQzj6zfHZ2gItOlIRGBAz1qEeydin6Jzhx16aYtY1DGPr6-g0zgha0__mWsYJqvl9FanzuKVwcbmgK0V_qyR2f4ysEikLZ4FMW3HR52LjMeFJnluTaaut7LEckEcZZ0-ozRP52uYTfYvl0Yilk03goupfKF6Oe5_z9vLbuFvd2dDRON'
            ]
        },
        'siena-luca': {
            title: 'Siena & Luca',
            date: 'May 05, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ_80naCijI5-ex90eo6FDIVbzWnTiaojPVIhTSixpVaA7NUc6SAY-K20W6hh9zsgodU24i_Lqqw68VPEODZMVcph3u1bU-DN4lamrOEzvLLKlTX6-CglkQlufqqbmc8r5_T1VhTMW9RxTwWgIr7ShM-P0aNuMGepo_ftK11HPwxgfhQ1Ep3P2lvUXx3XT9xE8YZOGC1w1Hep4RZrfWlRRim_QNyvwJrauXNDm2YQvz2KpJ3Lz2DFVNGunSczhiZZvzj5RrZdoYNaB'
            ]
        },
        'luna-sol': {
            title: 'Luna & Sol',
            date: 'July 12, 2023',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCadDFmWv5kx5QY13bV2ILbAs9C9zfZuyHikyxuzmYvv4KDI0-Elb7DjipfxmBQoCIbyIr5rZgeC8etF-38j2Ks_dMtKrl9KPQzj6zfHZ2gItOlIRGBAz1qEeydin6Jzhx16aYtY1DGPr6-g0zgha0__mWsYJqvl9FanzuKVwcbmgK0V_qyR2f4ysEikLZ4FMW3HR52LjMeFJnluTaaut7LEckEcZZ0-ozRP52uYTfYvl0Yilk03goupfKF6Oe5_z9vLbuFvd2dDRON'
            ]
        },
        'aria-silas': {
            title: 'Aria & Silas',
            date: 'September 30, 2023',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDT5u5PFHZdeEwKp4zytfp1dqnaeDYV11CvpoveY065-AkaKkQyaB42zbniR6oCWTb45aY397VgdUS-MtlAUPwBQRQLZaqbgHBWA4aoMidbGiGTwUgEmC8jQk5hUA2C44wfV8mlKm_O-fNMIBx-IS15d2spc053tDCRyHgYrr7A_M-7IZKLmX2vH0T6tzFOLPqhYi7qt5CkQiR_E819W_r8ToJ3yxliby0FWx7E5nJUhS5a3HHg2TZe9K-yuz8fF6LXwMLsxbPVb-Ru'
            ]
        },
        'jade-orion': {
            title: 'Jade & Orion',
            date: 'June 22, 2024',
            images: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBcg72GJAQeo-OxC2Pv5V8AzSbFVCkQjo6WIicLAAd7BDKyWNMF0IdqBIVT8O39ixDFwQ8wD0u-QaGrA1DZXVeUwjioXjd-UObqxdxkmgPCTI1ruhisaYoORlDQzYcwzSm_s8Lc8MO5eOU47Nq6zTnpPqzFTy6h2mNM6I2cbUpUYT9hH1vL0lvHwYifE9TGKZMY7ftOmm3X5xZL9VS21HOIfnwfuXiK-VyfEw9046I3OH_BEFH0a6SecTQyHY8W54cDwfxWMhIdabx6'
            ]
        }
    };

    let currentAlbum = null;
    let currentIndex = 0;

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    const openLightbox = (albumId) => {
        const album = albumData[albumId];
        if (!album) return;

        currentAlbum = album;
        currentIndex = 0;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const updateLightbox = () => {
        lightboxImg.src = currentAlbum.images[currentIndex];
        lightboxTitle.textContent = currentAlbum.title;
        lightboxCounter.textContent = `Image ${currentIndex + 1} of ${currentAlbum.images.length}`;
        
        // Hide/Show navigation if there's only one image
        if (currentAlbum.images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    const nextImage = () => {
        if (!currentAlbum) return;
        currentIndex = (currentIndex + 1) % currentAlbum.images.length;
        updateLightbox();
    };

    const prevImage = () => {
        if (!currentAlbum) return;
        currentIndex = (currentIndex - 1 + currentAlbum.images.length) % currentAlbum.images.length;
        updateLightbox();
    };

    // Use event delegation for the buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-album]');
        if (btn) {
            e.preventDefault();
            const albumId = btn.getAttribute('data-album');
            openLightbox(albumId);
        }
    });

    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            nextImage(); // Swipe Left -> Next
        } else if (touchEndX > touchStartX + swipeThreshold) {
            prevImage(); // Swipe Right -> Prev
        }
    };

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', nextImage);
    prevBtn.addEventListener('click', prevImage);

    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
        }
    });
});
