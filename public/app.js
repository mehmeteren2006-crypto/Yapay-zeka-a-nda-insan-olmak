/* ============================================
   YAPAY ZEKA ÇAĞINDA İNSAN OLMAK
   Frontend JavaScript
   Theme · Form · Animations · API
   ============================================ */

(function () {
    'use strict';

    // === Theme System ===
    const ThemeManager = {
        init() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            this.setTheme(savedTheme);

            document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggle());
            document.getElementById('theme-toggle-mobile')?.addEventListener('click', () => this.toggle());
        },

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        },

        toggle() {
            const current = document.documentElement.getAttribute('data-theme');
            this.setTheme(current === 'light' ? 'dark' : 'light');
        }
    };

    // === Mobile Menu ===
    const MobileMenu = {
        init() {
            const btn = document.getElementById('mobile-menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (!btn || !menu) return;

            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                menu.classList.toggle('active');
                document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
            });

            // Close menu on link click
            menu.querySelectorAll('.mobile-link').forEach(link => {
                link.addEventListener('click', () => {
                    btn.classList.remove('active');
                    menu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    };

    // === Navbar Scroll Effect ===
    const NavScroll = {
        init() {
            const navbar = document.getElementById('navbar');
            if (!navbar) return;

            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        navbar.classList.toggle('scrolled', window.scrollY > 50);
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        }
    };

    // === Scroll Animations (Intersection Observer) ===
    const ScrollAnimations = {
        init() {
            const elements = document.querySelectorAll('.animate-on-scroll');
            if (!elements.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Stagger animation
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, index * 80);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px'
            });

            elements.forEach(el => observer.observe(el));
        }
    };

    // === Smooth Scroll for CTA ===
    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href');
                    const target = document.querySelector(targetId);
                    if (target) {
                        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 72;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    };

    // === Phone Number Formatting ===
    const PhoneFormatter = {
        init() {
            const phoneInput = document.getElementById('phone');
            if (!phoneInput) return;

            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);

                if (value.length >= 4 && value.length < 7) {
                    value = value.slice(0, 4) + ' ' + value.slice(4);
                } else if (value.length >= 7 && value.length < 9) {
                    value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7);
                } else if (value.length >= 9) {
                    value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7, 9) + ' ' + value.slice(9);
                }

                e.target.value = value;
            });
        }
    };

    // === Atatürk Konferans Salonu 400-Kişilik Koltuk Seçimi & Salon Yönetimi ===
    const HallManager = {
        totalCapacity: 400,
        registeredCount: 0,
        currentZoom: 1.0,
        selectedSeat: null,

        // Koltuk Haritası Konfigürasyonu (O sırasından A sırasına kadar)
        rowsOrder: ['O', 'N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],

        wingsConfig: {
            sol: {
                name: 'Sol Blok',
                containerId: 'hall-wing-left',
                rows: {
                    'O': [26, 25, 24, 23],
                    'N': [31, 30, 29, 28, 27, 26, 25],
                    'M': [34, 33, 32, 31, 30, 29, 28, 27, 26],
                    'L': [35, 34, 33, 32, 31, 30, 29, 28, 27, 26],
                    'K': [37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27],
                    'J': [38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27],
                    'H': [38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26],
                    'G': [37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25],
                    'F': [36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24],
                    'E': [35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23],
                    'D': [34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22],
                    'C': [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20],
                    'B': [28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18],
                    'A': [25, 24, 23, 22, 21, 20, 19, 18, 17, 16]
                }
            },
            orta: {
                name: 'Orta Blok',
                containerId: 'hall-wing-center',
                rows: {
                    'O': [22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
                    'N': [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
                    'M': [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
                    'L': [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
                    'K': [26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13],
                    'J': [26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14],
                    'H': [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14],
                    'G': [23, 22, 21, 20, 19, 18, 17, 16, 15, 14],
                    'F': [22, 21, 20, 19, 18, 17, 16, 15, 14],
                    'E': null, // Orta blokta geçiş koridoru (E sırası yok)
                    'D': [21, 20, 19, 18, 17, 16, 15, 14],
                    'C': [19, 18, 17, 16, 15, 14, 13],
                    'B': [17, 16, 15, 14, 13, 12],
                    'A': [15, 14, 13, 12, 11]
                }
            },
            sag: {
                name: 'Sağ Blok',
                containerId: 'hall-wing-right',
                rows: {
                    'O': [4, 3, 2, 1],
                    'N': [7, 6, 5, 4, 3, 2, 1],
                    'M': [9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'L': [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'K': [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'J': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'H': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'G': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'F': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'E': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'D': [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'C': [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'B': [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                    'A': [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
                }
            }
        },

        async init() {
            this.buildSeatingArena();
            this.bindEvents();
            await this.fetchStats();
            await this.fetchOccupiedSeats();
        },

        async fetchOccupiedSeats() {
            try {
                const res = await fetch('/api/occupied-seats');
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.success && Array.isArray(data.seats)) {
                    data.seats.forEach(seatStr => this.markSeatOccupied(seatStr));
                }
            } catch (err) {
                console.warn('Occupied seats yüklenemedi:', err);
            }
        },

        markSeatOccupied(seatString) {
            if (!seatString) return;
            const str = String(seatString).trim();
            if (!str || str === '-' || /otomatik/i.test(str)) return;

            let targetEl = null;

            // Wing tespiti
            let wingKey = 'orta';
            const lower = str.toLowerCase();
            if (lower.includes('sol')) wingKey = 'sol';
            else if (lower.includes('sağ') || lower.includes('sag')) wingKey = 'sag';

            // Row harfi tespiti (A-O) - Sıra G, SIRA G, Sira G vb.
            const rowMatch = str.match(/[Ss][ıIiİi][rR][aA]?[:\s]+([A-Oa-o])/i) || str.match(/\b([A-Oa-o])\b/);
            // Koltuk numarası tespiti - Koltuk 18, 18 vb.
            const numMatch = str.match(/[Kk]oltuk[:\s]*(\d+)/i) || str.match(/(\d+)/);

            if (rowMatch && numMatch) {
                const r = rowMatch[1].toUpperCase();
                const n = parseInt(numMatch[1], 10);
                targetEl = document.getElementById(`seat-${wingKey}-${r}-${n}`) ||
                           document.querySelector(`.hall-seat-pill[data-wing="${wingKey}"][data-row="${r}"][data-num="${n}"]`);
            }

            if (!targetEl) {
                targetEl = Array.from(document.querySelectorAll('.hall-seat-pill')).find(p => {
                    return p.dataset.seatKey && p.dataset.seatKey.toLowerCase() === lower;
                });
            }

            if (targetEl) {
                targetEl.classList.remove('seat-available');
                targetEl.classList.remove('seat-selected');
                targetEl.classList.add('seat-occupied');
                targetEl.title = `${targetEl.dataset.wingName} · Sıra ${targetEl.dataset.row}, Koltuk ${targetEl.dataset.num} (Dolu / Alındı)`;

                // Eğer kullanıcı bunu seçmişse ve sunucu bunu dolu olarak işaretlediyse seçimi temizle
                if (this.selectedSeat && this.selectedSeat === targetEl.dataset.seatKey) {
                    this.selectedSeat = null;
                    this.updateSelectionUI(null);
                }
            }
        },

        buildSeatingArena() {
            const container = document.getElementById('hall-arena-rows');
            if (!container) return;
            container.innerHTML = '';

            this.rowsOrder.forEach(rowLetter => {
                const solSeats = this.wingsConfig.sol.rows[rowLetter] || [];
                const ortaSeats = this.wingsConfig.orta.rows[rowLetter]; // null for E
                const sagSeats = this.wingsConfig.sag.rows[rowLetter] || [];

                const rowEl = document.createElement('div');
                rowEl.className = 'hall-unified-row';
                rowEl.dataset.row = rowLetter;

                // 1. Sol Dış Harf (Silik)
                const outerSolLabel = document.createElement('span');
                outerSolLabel.className = 'row-label row-label-outer';
                outerSolLabel.textContent = rowLetter;
                rowEl.appendChild(outerSolLabel);

                // 2. Sol Blok Koltukları (Sağa doğru koridora yaslı)
                const solWingEl = document.createElement('div');
                solWingEl.className = 'row-wing row-wing-sol';
                solSeats.forEach(num => {
                    solWingEl.appendChild(this.createSeatPill('sol', 'Sol Blok', rowLetter, num));
                });
                rowEl.appendChild(solWingEl);

                // 3. Sol Koridor Harfi (Sol ile Orta arası tek koridor harfi)
                const leftAisleLabel = document.createElement('span');
                leftAisleLabel.className = 'row-label row-label-aisle';
                leftAisleLabel.textContent = rowLetter;
                rowEl.appendChild(leftAisleLabel);

                // 4. Orta Blok Koltukları (Veya E sırası geçiş boşluğu)
                const ortaWingEl = document.createElement('div');
                ortaWingEl.className = 'row-wing row-wing-orta';
                if (ortaSeats === null) {
                    ortaWingEl.classList.add('row-passage-orta');
                } else if (ortaSeats && ortaSeats.length > 0) {
                    ortaSeats.forEach(num => {
                        ortaWingEl.appendChild(this.createSeatPill('orta', 'Orta Blok', rowLetter, num));
                    });
                }
                rowEl.appendChild(ortaWingEl);

                // 5. Sağ Koridor Harfi (Orta ile Sağ arası tek koridor harfi)
                const rightAisleLabel = document.createElement('span');
                rightAisleLabel.className = 'row-label row-label-aisle';
                rightAisleLabel.textContent = rowLetter;
                rowEl.appendChild(rightAisleLabel);

                // 6. Sağ Blok Koltukları (Sola doğru koridora yaslı)
                const sagWingEl = document.createElement('div');
                sagWingEl.className = 'row-wing row-wing-sag';
                sagSeats.forEach(num => {
                    sagWingEl.appendChild(this.createSeatPill('sag', 'Sağ Blok', rowLetter, num));
                });
                rowEl.appendChild(sagWingEl);

                // 7. Sağ Dış Harf (Silik)
                const outerSagLabel = document.createElement('span');
                outerSagLabel.className = 'row-label row-label-outer';
                outerSagLabel.textContent = rowLetter;
                rowEl.appendChild(outerSagLabel);

                container.appendChild(rowEl);
            });
        },

        createSeatPill(wingKey, wingName, rowLetter, num) {
            const seatPill = document.createElement('span');
            const seatKey = `${wingName} · Sıra ${rowLetter} · Koltuk ${num}`;

            seatPill.className = 'hall-seat-pill seat-available';
            seatPill.textContent = num;
            seatPill.id = `seat-${wingKey}-${rowLetter}-${num}`;
            seatPill.dataset.wing = wingKey;
            seatPill.dataset.wingName = wingName;
            seatPill.dataset.row = rowLetter;
            seatPill.dataset.num = num;
            seatPill.dataset.seatKey = seatKey;

            seatPill.title = `${wingName} · Sıra ${rowLetter}, Koltuk ${num} (Müsait - Seçmek İçin Tıklayın)`;
            seatPill.addEventListener('click', () => this.handleSeatClick(seatPill));
            return seatPill;
        },

        handleSeatClick(seatEl) {
            if (seatEl.classList.contains('seat-occupied')) return;

            const wing = seatEl.dataset.wingName;
            const row = seatEl.dataset.row;
            const num = seatEl.dataset.num;
            const seatKey = `${wing} · Sıra ${row} · Koltuk ${num}`;

            // Eğer zaten seçiliyse kaldır
            if (seatEl.classList.contains('seat-selected')) {
                seatEl.classList.remove('seat-selected');
                this.selectedSeat = null;
                this.updateSelectionUI(null);
                return;
            }

            // Önceki seçimi temizle
            document.querySelectorAll('.hall-seat-pill.seat-selected').forEach(s => s.classList.remove('seat-selected'));

            // Yeni seçimi aktifleştir
            seatEl.classList.add('seat-selected');
            this.selectedSeat = seatKey;
            this.updateSelectionUI(seatKey);
        },

        updateSelectionUI(seatKey) {
            const bar = document.getElementById('hall-selection-bar');
            const label = document.getElementById('selected-seat-label');
            const formInput = document.getElementById('selectedSeat');
            const formText = document.getElementById('form-selected-seat-text');
            const formWidget = document.getElementById('selected-seat-widget');

            if (seatKey) {
                if (bar) bar.style.display = 'flex';
                if (label) label.textContent = seatKey;
                if (formInput) formInput.value = seatKey;
                if (formText) formText.textContent = seatKey;
                if (formWidget) formWidget.classList.add('has-seat');
            } else {
                if (bar) bar.style.display = 'none';
                if (label) label.textContent = '--';
                if (formInput) formInput.value = '';
                if (formText) formText.textContent = 'Henüz koltuk seçilmedi (İsteğe bağlı)';
                if (formWidget) formWidget.classList.remove('has-seat');
            }
        },

        bindEvents() {
            // Zoom Kontrolleri
            const zoomInBtn = document.getElementById('hall-zoom-in');
            const zoomOutBtn = document.getElementById('hall-zoom-out');
            const zoomResetBtn = document.getElementById('hall-zoom-reset');
            const scaleContainer = document.getElementById('hall-arena-scale');

            const applyZoom = () => {
                if (scaleContainer) {
                    scaleContainer.style.transform = `scale(${this.currentZoom})`;
                }
            };

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    this.currentZoom = Math.min(1.45, +(this.currentZoom + 0.12).toFixed(2));
                    applyZoom();
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    this.currentZoom = Math.max(0.68, +(this.currentZoom - 0.12).toFixed(2));
                    applyZoom();
                });
            }

            if (zoomResetBtn) {
                zoomResetBtn.addEventListener('click', () => {
                    this.currentZoom = 1.0;
                    applyZoom();
                });
            }

            // Seçimi Kaldır Butonu
            const clearBtn = document.getElementById('btn-clear-seat');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    document.querySelectorAll('.hall-seat-pill.seat-selected').forEach(s => s.classList.remove('seat-selected'));
                    this.selectedSeat = null;
                    this.updateSelectionUI(null);
                });
            }

            // Ana Sayfa Butonu
            const homeBtn = document.getElementById('hall-btn-home');
            if (homeBtn) {
                homeBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Bilet Sorgula Butonu & Modalı
            this.initTicketQueryModal();
        },

        initTicketQueryModal() {
            const queryBtn = document.getElementById('hall-btn-query');
            const modal = document.getElementById('ticket-query-modal');
            const closeBtn = document.getElementById('close-ticket-query-modal');
            const form = document.getElementById('ticket-query-form');
            const input = document.getElementById('ticket-search-input');
            const statusArea = document.getElementById('ticket-query-status');
            const resultCard = document.getElementById('ticket-result-card');

            if (!modal) return;

            const openModal = (e) => {
                if (e) e.preventDefault();
                modal.classList.add('active');
                modal.classList.add('visible');
                document.body.style.overflow = 'hidden';
                if (statusArea) { statusArea.style.display = 'none'; statusArea.textContent = ''; }
                if (resultCard) resultCard.style.display = 'none';
                if (input) { input.value = ''; setTimeout(() => input.focus(), 150); }
            };

            const closeModal = (e) => {
                if (e) e.preventDefault();
                modal.classList.remove('active');
                modal.classList.remove('visible');
                document.body.style.overflow = '';
            };

            if (queryBtn) queryBtn.addEventListener('click', openModal);
            if (closeBtn) closeBtn.addEventListener('click', closeModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(e);
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && (modal.classList.contains('active') || modal.classList.contains('visible'))) {
                    closeModal(e);
                }
            });

            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const q = (input?.value || '').trim();
                    if (!q || q.length < 3) {
                        if (statusArea) {
                            statusArea.style.display = 'block';
                            statusArea.className = 'ticket-status-area ticket-status-error';
                            statusArea.textContent = 'Lütfen aramak için en az 3 karakter giriniz.';
                        }
                        return;
                    }

                    if (statusArea) {
                        statusArea.style.display = 'block';
                        statusArea.className = 'ticket-status-area ticket-status-loading';
                        statusArea.textContent = 'Bilet ve koltuk kaydınız sorgulanıyor...';
                    }
                    if (resultCard) resultCard.style.display = 'none';

                    try {
                        const res = await fetch(`/api/bilet-sorgula?q=${encodeURIComponent(q)}`);
                        const data = await res.json();

                        if (res.ok && data.success && data.ticket) {
                            if (statusArea) statusArea.style.display = 'none';

                            const t = data.ticket;
                            const nameEl = document.getElementById('res-ticket-name');
                            const typeEl = document.getElementById('res-ticket-type');
                            const deptEl = document.getElementById('res-ticket-dept');
                            const busEl = document.getElementById('res-ticket-bus');
                            const seatEl = document.getElementById('res-ticket-seat');

                            if (nameEl) nameEl.textContent = t.name || '-';
                            if (typeEl) typeEl.textContent = t.participantType || 'Katılımcı';
                            if (deptEl) deptEl.textContent = t.department || 'Genel';
                            if (busEl) busEl.textContent = t.busNeeded || 'Hayır';
                            if (seatEl) seatEl.textContent = t.seat || 'Orta Blok · Sıra G · Koltuk 18';

                            if (resultCard) resultCard.style.display = 'block';

                            // Eğer sorgulanan bilette koltuk varsa haritada da dolu gösterilmesini sağla
                            if (t.seat) {
                                HallManager.markSeatOccupied(t.seat);
                            }
                        } else {
                            if (statusArea) {
                                statusArea.style.display = 'block';
                                statusArea.className = 'ticket-status-area ticket-status-error';
                                statusArea.textContent = data.message || 'Belirtilen bilgilerle eşleşen bir kayıt bulunamadı.';
                            }
                        }
                    } catch (err) {
                        if (statusArea) {
                            statusArea.style.display = 'block';
                            statusArea.className = 'ticket-status-area ticket-status-error';
                            statusArea.textContent = 'Sorgulama sırasında bağlantı hatası oluştu. Lütfen tekrar deneyiniz.';
                        }
                    }
                });
            }
        },

        async fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.success) {
                    this.registeredCount = data.registered || 0;
                    this.updateStatsUI(data);
                }
            } catch (err) {
                console.warn('Stats yüklenemedi:', err);
            }
        },

        updateStatsUI(data) {
            const regEl = document.getElementById('hall-count-registered');
            const remEl = document.getElementById('hall-count-remaining');
            const pctEl = document.getElementById('hall-count-percent');
            const barEl = document.getElementById('hall-progress-bar');
            const badgeEl = document.getElementById('hall-progress-badge');

            const registered = data.registered || 0;
            const remaining = data.remaining !== undefined ? data.remaining : Math.max(0, 400 - registered);
            const percent = data.fillPercentage !== undefined ? data.fillPercentage : Math.round((registered / 400) * 100);

            if (regEl) this.animateNumber(regEl, registered);
            if (remEl) this.animateNumber(remEl, remaining);
            if (pctEl) this.animateNumber(pctEl, percent);

            if (barEl) {
                barEl.style.width = `${Math.min(100, Math.max(2, percent))}%`;
            }

            if (badgeEl) {
                if (percent >= 90) {
                    badgeEl.textContent = 'Son Kontenjanlar!';
                    badgeEl.style.color = '#ef4444';
                    badgeEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    badgeEl.style.background = 'rgba(239, 68, 68, 0.12)';
                } else if (percent >= 50) {
                    badgeEl.textContent = '%50+ Dolu';
                    badgeEl.style.color = '#f59e0b';
                    badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    badgeEl.style.background = 'rgba(245, 158, 11, 0.12)';
                } else {
                    badgeEl.textContent = 'Kayıtlar Açık';
                }
            }
        },

        animateNumber(element, target) {
            const duration = 800;
            const start = parseInt(element.textContent, 10) || 0;
            const range = target - start;
            const startTime = performance.now();

            const update = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.round(start + range * (1 - Math.pow(1 - progress, 2)));
                element.textContent = current;
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = target;
                }
            };

            requestAnimationFrame(update);
        }
    };

    // === Registration Form Management ===
    const RegistrationForm = {
        form: null,
        submitBtn: null,
        successMsg: null,
        turnstileToken: null,

        init() {
            this.form = document.getElementById('registration-form');
            this.submitBtn = document.getElementById('submit-btn');
            this.successMsg = document.getElementById('success-message');
            if (!this.form) return;

            this.initParticipantType();
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Real-time validation on blur
            this.form.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) {
                        this.validateField(field);
                    }
                });
            });
        },

        initParticipantType() {
            const pills = document.querySelectorAll('.participant-type-pill');
            const studentFields = document.getElementById('student-fields');
            const professionalFields = document.getElementById('professional-fields');
            const deptInput = document.getElementById('department');
            const gradeSelect = document.getElementById('grade');
            const uniInput = document.getElementById('university');
            const profInput = document.getElementById('profession');
            const compInput = document.getElementById('company');
            const fieldInput = document.getElementById('fieldOfWork');

            const setType = (type) => {
                const isStudent = (type === 'Öğrenci');
                if (studentFields && professionalFields) {
                    if (isStudent) {
                        studentFields.style.display = 'grid';
                        professionalFields.style.display = 'none';

                        deptInput?.setAttribute('required', '');
                        gradeSelect?.setAttribute('required', '');
                        uniInput?.setAttribute('required', '');

                        profInput?.removeAttribute('required');
                        compInput?.removeAttribute('required');
                        fieldInput?.removeAttribute('required');

                        // Clear error states on hidden fields
                        [profInput, compInput, fieldInput].forEach(f => {
                            if (f) {
                                f.classList.remove('error');
                                const err = document.getElementById(`${f.name}-error`);
                                if (err) { err.textContent = ''; err.classList.remove('visible'); }
                            }
                        });
                    } else {
                        studentFields.style.display = 'none';
                        professionalFields.style.display = 'grid';

                        deptInput?.removeAttribute('required');
                        gradeSelect?.removeAttribute('required');
                        uniInput?.removeAttribute('required');

                        profInput?.setAttribute('required', '');
                        compInput?.setAttribute('required', '');
                        fieldInput?.setAttribute('required', '');

                        // Clear error states on hidden fields
                        [deptInput, gradeSelect, uniInput].forEach(f => {
                            if (f) {
                                f.classList.remove('error');
                                const err = document.getElementById(`${f.name}-error`);
                                if (err) { err.textContent = ''; err.classList.remove('visible'); }
                            }
                        });
                    }
                }
            };

            pills.forEach(pill => {
                pill.addEventListener('click', () => {
                    pills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    const radio = pill.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        setType(radio.value);
                    }
                });
            });

            // Başlangıç durumu
            const checkedRadio = document.querySelector('input[name="participantType"]:checked');
            if (checkedRadio) setType(checkedRadio.value);
        },

        validateField(field) {
            const errorEl = document.getElementById(`${field.name}-error`);
            let isValid = true;
            let message = '';

            // Remove previous states
            field.classList.remove('error', 'success');
            if (errorEl) errorEl.textContent = '';

            if (field.hasAttribute('required') && !field.value.trim()) {
                isValid = false;
                message = 'Bu alan zorunludur';
            } else if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                    message = 'Geçerli bir e-posta adresi girin';
                }
            } else if (field.name === 'phone' && field.value) {
                const phoneDigits = field.value.replace(/\D/g, '');
                if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                    isValid = false;
                    message = 'Geçerli bir telefon numarası girin';
                }
            }

            if (!isValid) {
                field.classList.add('error');
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.classList.add('visible');
                }
            } else if (field.value) {
                field.classList.add('success');
            }

            return isValid;
        },

        validateForm() {
            let isValid = true;
            const requiredFields = this.form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                // Görünür olmayan alanları atla
                if (field.offsetParent === null && field.type !== 'radio' && field.type !== 'checkbox') {
                    return;
                }

                if (field.type === 'radio') {
                    // Check radio group
                    const radioGroup = this.form.querySelectorAll(`input[name="${field.name}"]`);
                    const checked = Array.from(radioGroup).some(r => r.checked);
                    const errorEl = document.getElementById(`${field.name}-error`);
                    if (!checked) {
                        isValid = false;
                        if (errorEl) {
                            errorEl.textContent = 'Lütfen bir seçenek belirleyin';
                            errorEl.classList.add('visible');
                        }
                    }
                } else if (field.type === 'checkbox') {
                    const errorEl = document.getElementById(`${field.name}-error`);
                    if (!field.checked) {
                        isValid = false;
                        if (errorEl) {
                            errorEl.textContent = 'Bu onayı vermeniz gerekmektedir';
                            errorEl.classList.add('visible');
                        }
                    }
                } else {
                    if (!this.validateField(field)) {
                        isValid = false;
                    }
                }
            });

            return isValid;
        },

        async handleSubmit(e) {
            e.preventDefault();

            if (!this.validateForm()) {
                // Scroll to first error
                const firstError = this.form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Show loading state
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;

            const selectedTypeRadio = this.form.querySelector('input[name="participantType"]:checked');
            const pType = selectedTypeRadio ? selectedTypeRadio.value : 'Öğrenci';
            const isStudent = (pType === 'Öğrenci');

            const formData = {
                participantType: pType,
                firstName: this.form.firstName.value.trim(),
                lastName: this.form.lastName.value.trim(),
                email: this.form.email.value.trim(),
                phone: this.form.phone.value.trim(),
                department: isStudent ? this.form.department.value.trim() : (this.form.fieldOfWork?.value.trim() || 'Genel'),
                grade: isStudent ? this.form.grade.value : pType,
                university: isStudent ? this.form.university.value.trim() : (this.form.company?.value.trim() || 'Kurumsal'),
                profession: !isStudent ? (this.form.profession?.value.trim() || '') : '',
                company: !isStudent ? (this.form.company?.value.trim() || '') : '',
                fieldOfWork: !isStudent ? (this.form.fieldOfWork?.value.trim() || '') : '',
                city: this.form.city.value.trim(),
                busNeeded: this.form.busNeeded.value,
                dietaryNeeds: this.form.dietaryNeeds.value.trim(),
                aiExperience: this.form.aiExperience.value,
                previousEvents: this.form.previousEvents?.value || '',
                expectations: this.form.expectations.value.trim(),
                questions: this.form.questions.value.trim(),
                hearAbout: this.form.hearAbout.value,
                selectedSeat: this.form.selectedSeat?.value || '',
                turnstileToken: this.turnstileToken || ''
            };

            try {
                const response = await fetch('/api/kayit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Show success message
                    this.form.style.display = 'none';
                    this.successMsg.classList.add('visible');
                    this.successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Canlı salon istatistiklerini ve koltuk doluluklarını güncelle
                    HallManager.fetchStats();
                    if (result.selectedSeat) {
                        HallManager.markSeatOccupied(result.selectedSeat);
                    }
                    HallManager.fetchOccupiedSeats();
                } else {
                    throw new Error(result.message || 'Bir hata oluştu');
                }
            } catch (error) {
                alert(error.message || 'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
                this.submitBtn.classList.remove('loading');
                this.submitBtn.disabled = false;
            }
        }
    };

    // === Turnstile Callback ===
    window.onTurnstileSuccess = function (token) {
        RegistrationForm.turnstileToken = token;
    };

    // === KVKK Modal ===
    const KvkkModal = {
        init() {
            const openBtn = document.getElementById('open-kvkk-modal');
            const modal = document.getElementById('kvkk-modal');
            const closeBtn = document.getElementById('close-kvkk-modal');
            const acceptBtn = document.getElementById('accept-kvkk-btn');
            const kvkkCheckbox = document.getElementById('kvkk');

            if (!modal) return;

            const open = (e) => {
                if (e) e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            };

            const close = () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            };

            if (openBtn) {
                openBtn.addEventListener('click', open);
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', close);
            }

            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    if (kvkkCheckbox) {
                        kvkkCheckbox.checked = true;
                        kvkkCheckbox.dispatchEvent(new Event('change'));
                    }
                    close();
                });
            }

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    close();
                }
            });
        }
    };

    // === Initialize Everything ===
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
        MobileMenu.init();
        NavScroll.init();
        ScrollAnimations.init();
        SmoothScroll.init();
        PhoneFormatter.init();
        HallManager.init();
        RegistrationForm.init();
        KvkkModal.init();
    });

})();
