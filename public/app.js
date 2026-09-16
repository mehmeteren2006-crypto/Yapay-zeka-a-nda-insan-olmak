/* ============================================
   YAPAY ZEKA ÇAĞINDA İNSAN OLMAK
   Frontend JavaScript
   Theme · Form · Animations · API
   ============================================ */

(function() {
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

    // === Form Validation & Submission ===
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

            const formData = {
                firstName: this.form.firstName.value.trim(),
                lastName: this.form.lastName.value.trim(),
                email: this.form.email.value.trim(),
                phone: this.form.phone.value.trim(),
                department: this.form.department.value.trim(),
                grade: this.form.grade.value,
                university: this.form.university.value.trim(),
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
    window.onTurnstileSuccess = function(token) {
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
        RegistrationForm.init();
        KvkkModal.init();
    });

})();
