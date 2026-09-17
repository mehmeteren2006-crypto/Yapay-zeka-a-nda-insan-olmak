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

    // === Atatürk Konferans Salonu 400-Kapasite & Sanal Oturma Planı ===
    const HallManager = {
        totalCapacity: 400,
        registeredCount: 0,

        async init() {
            this.renderSeats();
            await this.fetchStats();
        },

        async fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.success) {
                    this.registeredCount = data.registered || 0;
                    this.updateUI(data);
                }
            } catch (err) {
                console.warn('Stats yüklenemedi:', err);
            }
        },

        updateUI(data) {
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
                    badgeEl.textContent = '🔥 Son Kontenjanlar!';
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

            // Koltuk doluluklarını güncelle
            this.updateSeatsOccupancy(registered);
        },

        animateNumber(element, target) {
            const duration = 900;
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
        },

        renderSeats() {
            // 1. VIP Sırası (20 Koltuk)
            const vipContainer = document.getElementById('vip-seats-grid');
            if (vipContainer && vipContainer.children.length === 0) {
                for (let i = 1; i <= 20; i++) {
                    const dot = document.createElement('span');
                    dot.className = 'seat-dot seat-dot-vip';
                    dot.title = `Protokol & Onur Konuğu · Koltuk VIP-${i}`;
                    vipContainer.appendChild(dot);
                }
            }

            // 2. Blok A (Sol Tribün - 130 Koltuk: 10 sıra x 13 koltuk)
            const blockA = document.getElementById('block-a-seats');
            if (blockA && blockA.children.length === 0) {
                this.buildBlockSeats(blockA, 'Blok A', 10, 13);
            }

            // 3. Blok B (Orta Tribün - 120 Koltuk: 10 sıra x 12 koltuk)
            const blockB = document.getElementById('block-b-seats');
            if (blockB && blockB.children.length === 0) {
                this.buildBlockSeats(blockB, 'Blok B', 10, 12);
            }

            // 4. Blok C (Sağ Tribün - 130 Koltuk: 10 sıra x 13 koltuk)
            const blockC = document.getElementById('block-c-seats');
            if (blockC && blockC.children.length === 0) {
                this.buildBlockSeats(blockC, 'Blok C', 10, 13);
            }
        },

        buildBlockSeats(container, blockName, rows, cols) {
            let seatNum = 1;
            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    const dot = document.createElement('span');
                    dot.className = 'seat-dot seat-dot-empty';
                    dot.dataset.block = blockName;
                    dot.dataset.seat = seatNum;
                    dot.dataset.row = r;
                    dot.dataset.col = c;
                    dot.title = `${blockName} · Sıra ${r}, Koltuk ${c} — Durum: Müsait`;
                    container.appendChild(dot);
                    seatNum++;
                }
            }
        },

        updateSeatsOccupancy(registeredCount) {
            // 380 normal koltuk arasında registeredCount kadarını doldur
            const allAudienceSeats = document.querySelectorAll('.hall-blocks-grid .seat-dot');
            let filledIndex = 0;

            allAudienceSeats.forEach((seat) => {
                const block = seat.dataset.block;
                const row = seat.dataset.row;
                const col = seat.dataset.col;

                if (filledIndex < registeredCount) {
                    seat.classList.remove('seat-dot-empty');
                    seat.classList.add('seat-dot-filled');
                    seat.title = `${block} · Sıra ${row}, Koltuk ${col} — Durum: Dolu (Kayıtlı Katılımcı)`;
                    filledIndex++;
                } else {
                    seat.classList.remove('seat-dot-filled');
                    seat.classList.add('seat-dot-empty');
                    seat.title = `${block} · Sıra ${row}, Koltuk ${col} — Durum: Müsait (Başvuruya Açık)`;
                }
            });
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

                    // Canlı salon istatistiklerini güncelle
                    HallManager.fetchStats();
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
