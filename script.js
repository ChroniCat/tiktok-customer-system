// TikTok Customer System JavaScript - 增强防刷版
class SecureCustomerSystem {
    constructor() {
        this.currentLang = 'en';
        this.customers = [];
        this.formStartTime = null;
        this.minFormTime = 15000; // 最小表单填写时间 15秒（增强）
        this.maxSubmissions = 10; // 每分钟最大提交次数
        this.encryptionKey = null;
        this.formTimer = null;
        this.countdownTimer = null;
        this.behaviorScore = 0; // 行为评分
        this.mouseMovements = [];
        this.keystrokes = [];
        this.focusEvents = [];
        this.deviceFingerprint = null;
        
        this.translations = {
            en: {
                'main-title': 'Customer Information Form',
                'main-subtitle': 'Please fill in your information to receive exclusive offers',
                'label-name': 'Full Name',
                'label-email': 'Email Address',
                'label-phone': 'Phone Number',
                'label-country': 'Country',
                'label-city': 'City',
                'label-interest': 'Purchase Interest',
                'option-select-country': 'Select your country',
                'option-select-interest': 'Select your interest',
                'option-electronics': 'Electronics',
                'option-fashion': 'Fashion',
                'option-beauty': 'Beauty & Cosmetics',
                'option-home': 'Home & Garden',
                'option-sports': 'Sports & Fitness',
                'option-books': 'Books & Education',
                'option-other': 'Other',
                'submit-btn': 'Submit Information',
                'success-title': 'Thank You!',
                'success-text': 'Your information has been submitted successfully. Our customer service team will contact you soon with exclusive offers!',
                'submit-another': 'Submit Another Form',
                'security-title': '🔒 Security Notice',
                'security-text': 'This form is protected against automated submissions. Please fill out carefully.',
                'submission-text': 'Submissions today:',
                'rate-limit-title': '⏰ Submission Limit Reached',
                'rate-limit-text': 'You have reached the maximum number of submissions. Please wait before submitting again.',
                'countdown-text': 'Next submission available in:',
                'behavior-warning': '⚠️ Suspicious activity detected. Please slow down and fill the form naturally.',
                'form-too-fast': '🚫 Form submitted too quickly. Please take time to review your information.',
                'honeypot-detected': '🤖 Automated submission detected. Please try again.',
                'timer-text': 'Filling time:'
            },
            fr: {
                'main-title': 'Formulaire d\'Information Client',
                'main-subtitle': 'Veuillez remplir vos informations pour recevoir des offres exclusives',
                'label-name': 'Nom Complet',
                'label-email': 'Adresse Email',
                'label-phone': 'Numéro de Téléphone',
                'label-country': 'Pays',
                'label-city': 'Ville',
                'label-interest': 'Intérêt d\'Achat',
                'option-select-country': 'Sélectionnez votre pays',
                'option-select-interest': 'Sélectionnez votre intérêt',
                'option-electronics': 'Électronique',
                'option-fashion': 'Mode',
                'option-beauty': 'Beauté & Cosmétiques',
                'option-home': 'Maison & Jardin',
                'option-sports': 'Sports & Fitness',
                'option-books': 'Livres & Éducation',
                'option-other': 'Autre',
                'submit-btn': 'Soumettre les Informations',
                'success-title': 'Merci !',
                'success-text': 'Vos informations ont été soumises avec succès. Notre équipe de service client vous contactera bientôt avec des offres exclusives !',
                'submit-another': 'Soumettre un Autre Formulaire',
                'security-title': '🔒 Notice de Sécurité',
                'security-text': 'Ce formulaire est protégé contre les soumissions automatisées. Veuillez remplir avec soin.',
                'submission-text': 'Soumissions aujourd\'hui:',
                'rate-limit-title': '⏰ Limite de Soumission Atteinte',
                'rate-limit-text': 'Vous avez atteint le nombre maximum de soumissions. Veuillez attendre avant de soumettre à nouveau.',
                'countdown-text': 'Prochaine soumission disponible dans:',
                'behavior-warning': '⚠️ Activité suspecte détectée. Veuillez ralentir et remplir le formulaire naturellement.',
                'form-too-fast': '🚫 Formulaire soumis trop rapidement. Veuillez prendre le temps de vérifier vos informations.',
                'honeypot-detected': '🤖 Soumission automatisée détectée. Veuillez réessayer.',
                'timer-text': 'Temps de remplissage:'
            }
        };
        
        this.init();
    }

    init() {
        this.generateDeviceFingerprint();
        this.setupEventListeners();
        this.setupBehaviorTracking();
        this.loadLanguage();
        this.initEncryption();
        this.loadEncryptedCustomerData();
        this.recordFormStartTime();
        this.updateSubmissionProgress();
        this.startFormTimer();
    }

    // 生成设备指纹
    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL(),
            timestamp: Date.now(),
            memory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };
        
        this.deviceFingerprint = btoa(JSON.stringify(fingerprint));
    }

    // 设置行为追踪
    setupBehaviorTracking() {
        let mouseMoveCount = 0;
        let lastMouseMove = 0;
        
        // 鼠标移动追踪
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseMove > 50) { // 限制频率
                this.mouseMovements.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: now
                });
                mouseMoveCount++;
                lastMouseMove = now;
                
                // 保持数组大小
                if (this.mouseMovements.length > 100) {
                    this.mouseMovements.shift();
                }
            }
        });
        
        // 键盘输入追踪
        document.addEventListener('keydown', (e) => {
            this.keystrokes.push({
                key: e.key.length === 1 ? 'char' : 'special',
                timestamp: Date.now(),
                target: e.target.id || e.target.name
            });
            
            // 保持数组大小
            if (this.keystrokes.length > 200) {
                this.keystrokes.shift();
            }
        });
        
        // 焦点事件追踪
        document.addEventListener('focusin', (e) => {
            if (e.target.closest('form')) {
                this.focusEvents.push({
                    element: e.target.id || e.target.name,
                    timestamp: Date.now()
                });
                
                // 保持数组大小
                if (this.focusEvents.length > 50) {
                    this.focusEvents.shift();
                }
            }
        });
        
        // 定期评估行为
        setInterval(() => {
            this.evaluateBehavior();
        }, 10000);
    }

    // 评估用户行为
    evaluateBehavior() {
        let score = 0;
        const now = Date.now();
        
        // 检查鼠标移动
        const recentMouse = this.mouseMovements.filter(m => now - m.timestamp < 30000);
        if (recentMouse.length < 5) {
            score -= 20; // 很少的鼠标移动
        }
        
        // 检查键盘输入模式
        const recentKeys = this.keystrokes.filter(k => now - k.timestamp < 30000);
        if (recentKeys.length > 0) {
            const intervals = [];
            for (let i = 1; i < recentKeys.length; i++) {
                intervals.push(recentKeys[i].timestamp - recentKeys[i-1].timestamp);
            }
            
            // 检查输入间隔是否过于规律（可能是机器人）
            if (intervals.length > 5) {
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
                
                if (variance < 100) { // 间隔过于规律
                    score -= 30;
                }
            }
        }
        
        // 检查表单填写顺序
        const formFields = ['name', 'email', 'phone', 'country', 'city', 'interest'];
        const focusSequence = this.focusEvents.map(f => f.element).filter(e => formFields.includes(e));
        
        // 如果跳跃式填写，减分
        let sequentialFills = 0;
        for (let i = 1; i < focusSequence.length; i++) {
            const currentIndex = formFields.indexOf(focusSequence[i]);
            const prevIndex = formFields.indexOf(focusSequence[i-1]);
            if (currentIndex === prevIndex + 1) {
                sequentialFills++;
            }
        }
        
        if (sequentialFills < focusSequence.length * 0.5) {
            score -= 15; // 非顺序填写
        }
        
        this.behaviorScore = Math.max(-100, Math.min(100, score));
        
        // 显示警告
        if (this.behaviorScore < -40) {
            this.showBehaviorWarning();
        }
    }

    // 显示行为警告
    showBehaviorWarning() {
        if (document.querySelector('.behavior-warning')) return; // 避免重复显示
        
        const warningDiv = document.createElement('div');
        warningDiv.className = 'rate-limit-warning behavior-warning';
        warningDiv.innerHTML = `
            <strong>${this.getTranslation('behavior-warning')}</strong><br>
            <small>行为评分: ${this.behaviorScore}</small>
        `;
        
        const form = document.getElementById('customerForm');
        form.parentNode.insertBefore(warningDiv, form);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.remove();
            }
        }, 8000);
    }

    // 开始表单计时器
    startFormTimer() {
        const timerElement = document.getElementById('form-timer');
        const timerCount = document.getElementById('timer-count');
        const timerText = document.getElementById('timer-text');
        
        timerText.innerHTML = `${this.getTranslation('timer-text')} <span id="timer-count">0</span>s`;
        timerElement.style.display = 'block';
        
        this.formTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.formStartTime) / 1000);
            document.getElementById('timer-count').textContent = elapsed;
        }, 1000);
    }

    // 更新提交进度显示
    updateSubmissionProgress() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        let submissions = JSON.parse(localStorage.getItem('submission_times') || '[]');
        submissions = submissions.filter(time => time > oneMinuteAgo);
        
        const progressContainer = document.getElementById('submission-progress');
        const countDisplay = document.getElementById('submission-count-display');
        const fillBar = document.getElementById('submission-fill');
        
        if (submissions.length > 0) {
            progressContainer.style.display = 'block';
            countDisplay.textContent = `${submissions.length}/${this.maxSubmissions}`;
            
            const percentage = (submissions.length / this.maxSubmissions) * 100;
            fillBar.style.width = `${percentage}%`;
            
            // 接近限制时变红
            if (percentage > 70) {
                fillBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
            } else {
                fillBar.style.background = 'linear-gradient(90deg, #10b981, #3b82f6)';
            }
        }
    }

    // 初始化加密
    async initEncryption() {
        try {
            let storedKey = localStorage.getItem('encryption_key_v2');
            if (!storedKey) {
                this.encryptionKey = await this.generateEncryptionKey();
                localStorage.setItem('encryption_key_v2', await this.exportKey(this.encryptionKey));
            } else {
                this.encryptionKey = await this.importKey(storedKey);
            }
        } catch (error) {
            console.error('加密初始化失败:', error);
            this.encryptionKey = null;
        }
    }

    // 生成加密密钥
    async generateEncryptionKey() {
        return await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // 导出密钥
    async exportKey(key) {
        const exported = await crypto.subtle.exportKey('jwk', key);
        return JSON.stringify(exported);
    }

    // 导入密钥
    async importKey(keyData) {
        const keyJwk = JSON.parse(keyData);
        return await crypto.subtle.importKey(
            'jwk',
            keyJwk,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // 加密数据
    async encryptData(data) {
        if (!this.encryptionKey) {
            return JSON.stringify(data);
        }

        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                dataBuffer
            );

            return JSON.stringify({
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv),
                version: 2
            });
        } catch (error) {
            console.error('数据加密失败:', error);
            return JSON.stringify(data);
        }
    }

    // 解密数据
    async decryptData(encryptedData) {
        if (!this.encryptionKey || typeof encryptedData !== 'string') {
            return typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData;
        }

        try {
            const data = JSON.parse(encryptedData);
            if (!data.encrypted || !data.iv) {
                return JSON.parse(encryptedData);
            }

            const encryptedBuffer = new Uint8Array(data.encrypted);
            const iv = new Uint8Array(data.iv);
            
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                encryptedBuffer
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('数据解密失败:', error);
            try {
                return JSON.parse(encryptedData);
            } catch {
                return [];
            }
        }
    }

    // 加载加密的客户数据
    async loadEncryptedCustomerData() {
        try {
            const encryptedData = localStorage.getItem('customers_encrypted_v2') || 
                                  localStorage.getItem('customers_encrypted') || 
                                  localStorage.getItem('customers');
            if (encryptedData) {
                this.customers = await this.decryptData(encryptedData);
            }
            localStorage.removeItem('customers');
            localStorage.removeItem('customers_encrypted');
        } catch (error) {
            console.error('加载客户数据失败:', error);
            this.customers = [];
        }
    }

    // 保存加密的客户数据
    async saveEncryptedCustomerData() {
        try {
            const encryptedData = await this.encryptData(this.customers);
            localStorage.setItem('customers_encrypted_v2', encryptedData);
        } catch (error) {
            console.error('保存客户数据失败:', error);
        }
    }

    // 记录表单开始时间
    recordFormStartTime() {
        this.formStartTime = Date.now();
    }

    // 检查提交频率限制（增强版）
    checkSubmissionRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        let submissions = JSON.parse(localStorage.getItem('submission_times') || '[]');
        submissions = submissions.filter(time => time > oneMinuteAgo);
        
        if (submissions.length >= this.maxSubmissions) {
            const nextAllowedTime = Math.ceil((submissions[0] + 60000 - now) / 1000);
            this.showRateLimitError(nextAllowedTime);
            throw new Error(`提交频率过快，请在 ${nextAllowedTime} 秒后重试`);
        }
        
        submissions.push(now);
        localStorage.setItem('submission_times', JSON.stringify(submissions));
        
        return true;
    }

    // 显示频率限制错误（带倒计时）
    showRateLimitError(waitSeconds) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rate-limit-error';
        errorDiv.innerHTML = `
            <strong>${this.getTranslation('rate-limit-title')}</strong><br>
            <p>${this.getTranslation('rate-limit-text')}</p>
            <div class="countdown-display">
                <div>${this.getTranslation('countdown-text')}</div>
                <div id="countdown-timer">${waitSeconds}</div>
            </div>
        `;
        
        const form = document.getElementById('customerForm');
        const existingError = document.querySelector('.rate-limit-error');
        if (existingError) {
            existingError.remove();
        }
        
        form.classList.add('form-disabled');
        form.parentNode.insertBefore(errorDiv, form);
        
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 开始倒计时
        let remainingTime = waitSeconds;
        const countdownElement = document.getElementById('countdown-timer');
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(() => {
            remainingTime--;
            if (countdownElement) {
                countdownElement.textContent = remainingTime;
            }
            
            if (remainingTime <= 0) {
                clearInterval(this.countdownTimer);
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
                form.classList.remove('form-disabled');
                this.updateSubmissionProgress();
            }
        }, 1000);
    }

    // 检查表单时间（增强版）
    checkFormTiming() {
        if (!this.formStartTime) {
            throw new Error('表单时间异常，请刷新页面重试');
        }
        
        const fillTime = Date.now() - this.formStartTime;
        
        if (fillTime < this.minFormTime) {
            this.showFormError(this.getTranslation('form-too-fast'));
            throw new Error(`表单填写速度过快，请仔细核对信息`);
        }
        
        // 检查是否填写时间过短但字段很多
        const filledFields = this.getFilledFieldsCount();
        const expectedMinTime = filledFields * 2000; // 每个字段预期2秒
        
        if (fillTime < expectedMinTime) {
            this.showFormError(this.getTranslation('form-too-fast'));
            throw new Error('填写时间与内容不匹配');
        }
        
        return true;
    }

    // 获取已填写字段数量
    getFilledFieldsCount() {
        const requiredFields = ['name', 'email', 'phone', 'country', 'city', 'interest'];
        return requiredFields.filter(field => {
            const element = document.getElementById(field);
            return element && element.value && element.value.trim() !== '';
        }).length;
    }

    // 检查蜜罐字段（增强版）
    checkHoneypot() {
        const honeypotFields = ['website', 'company', 'position', 'verification'];
        
        for (const fieldName of honeypotFields) {
            const field = document.getElementById(fieldName);
            if (field && field.value && field.value.trim() !== '') {
                this.showFormError(this.getTranslation('honeypot-detected'));
                throw new Error('检测到异常行为，提交被拒绝');
            }
        }
        
        return true;
    }

    // 综合安全检查
    performSecurityCheck() {
        // 检查行为评分
        if (this.behaviorScore < -50) {
            throw new Error('行为模式异常，请重新填写');
        }
        
        // 检查设备指纹变化
        const currentFingerprint = this.deviceFingerprint;
        const storedFingerprint = localStorage.getItem('device_fingerprint');
        
        if (storedFingerprint && storedFingerprint !== currentFingerprint) {
            console.warn('设备指纹发生变化');
        }
        
        localStorage.setItem('device_fingerprint', currentFingerprint);
        
        // 检查表单交互次数
        const minInteractions = 8; // 最少交互次数
        const totalInteractions = this.focusEvents.length + Math.floor(this.keystrokes.length / 10);
        
        if (totalInteractions < minInteractions) {
            throw new Error('表单交互不足，请仔细填写');
        }
        
        return true;
    }

    setupEventListeners() {
        // 语言切换
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLanguage(e.target.dataset.lang);
            });
        });

        // 表单提交（增强安全检查）
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 提交另一份表单
        document.getElementById('submit-another').addEventListener('click', () => {
            this.hideSuccessMessage();
            this.resetForm();
        });
        
        // 页面离开时清理
        window.addEventListener('beforeunload', () => {
            if (this.formTimer) clearInterval(this.formTimer);
            if (this.countdownTimer) clearInterval(this.countdownTimer);
        });
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred-language', lang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.updateTexts();
    }

    updateTexts() {
        const translations = this.translations[this.currentLang];
        
        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translations[key];
                } else if (key === 'timer-text') {
                    const timerCount = document.getElementById('timer-count');
                    const currentCount = timerCount ? timerCount.textContent : '0';
                    element.innerHTML = `${translations[key]} <span id="timer-count">${currentCount}</span>s`;
                } else {
                    element.textContent = translations[key];
                }
            }
        });
    }

    getTranslation(key) {
        return this.translations[this.currentLang][key] || key;
    }

    loadLanguage() {
        const savedLang = localStorage.getItem('preferred-language') || 'en';
        this.switchLanguage(savedLang);
    }

    handleFormSubmit() {
        const formData = this.getFormData();
        
        try {
            // 多重安全检查
            this.checkHoneypot();
            this.checkFormTiming();
            this.performSecurityCheck();
            this.checkSubmissionRateLimit();
            
            if (this.validateForm(formData)) {
                // 添加安全元数据
                formData.securityMeta = {
                    behaviorScore: this.behaviorScore,
                    deviceFingerprint: this.deviceFingerprint,
                    fillTime: Date.now() - this.formStartTime,
                    interactions: this.focusEvents.length,
                    mouseMoves: this.mouseMovements.length,
                    keystrokes: this.keystrokes.length
                };
                
                this.saveCustomer(formData);
                this.sendEmail(formData);
                this.showSuccessMessage();
                this.recordFormStartTime();
                this.updateSubmissionProgress();
            }
        } catch (error) {
            this.showFormError(error.message);
        }
    }

    // 显示表单错误（增强版）
    showFormError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rate-limit-error';
        errorDiv.style.cssText = `
            background: linear-gradient(135deg, #fef2f2, #f87171);
            color: #dc2626;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 25px;
            border: 2px solid #ef4444;
            text-align: center;
            font-weight: 600;
            animation: shake 0.5s ease-in-out;
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
        `;
        errorDiv.innerHTML = `<strong>🚫 提交失败</strong><br><p>${message}</p>`;
        
        const form = document.getElementById('customerForm');
        const existingError = document.querySelector('.rate-limit-error');
        if (existingError) {
            existingError.remove();
        }
        form.parentNode.insertBefore(errorDiv, form);
        
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 8秒后自动隐藏
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }

    getFormData() {
        return {
            id: Date.now(),
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            country: document.getElementById('country').value,
            city: document.getElementById('city').value.trim(),
            interest: document.getElementById('interest').value,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            language: this.currentLang
        };
    }

    validateForm(data) {
        let isValid = true;
        
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
            const error = group.querySelector('.error');
            if (error) error.remove();
        });

        const requiredFields = ['name', 'email', 'phone', 'country', 'city', 'interest'];
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                this.showFieldError(field, this.getErrorMessage('required'));
                isValid = false;
            }
        });

        if (data.email && !this.isValidEmail(data.email)) {
            this.showFieldError('email', this.getErrorMessage('invalid-email'));
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('has-error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    getErrorMessage(type) {
        const messages = {
            en: {
                'required': 'This field is required',
                'invalid-email': 'Please enter a valid email address'
            },
            fr: {
                'required': 'Ce champ est obligatoire',
                'invalid-email': 'Veuillez entrer une adresse email valide'
            }
        };
        
        return messages[this.currentLang][type];
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async saveCustomer(customer) {
        this.customers.push(customer);
        await this.saveEncryptedCustomerData();
        
        window.dispatchEvent(new CustomEvent('customerAdded', {
            detail: customer
        }));
    }

    sendEmail(data) {
        const emailConfig = {
            serviceId: 'YOUR_EMAILJS_SERVICE_ID',
            templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
        };

        const templateParams = {
            to_email: 'your-email@example.com',
            customer_name: data.name,
            customer_email: data.email,
            customer_phone: data.phone,
            customer_country: data.country,
            customer_city: data.city,
            customer_interest: data.interest,
            submission_time: new Date(data.submittedAt).toLocaleString(),
            language: data.language,
            security_score: data.securityMeta ? data.securityMeta.behaviorScore : 'N/A',
            fill_time: data.securityMeta ? Math.floor(data.securityMeta.fillTime / 1000) : 'N/A'
        };

        if (window.emailjs && emailConfig.serviceId !== 'YOUR_EMAILJS_SERVICE_ID') {
            window.emailjs.send(
                emailConfig.serviceId,
                emailConfig.templateId,
                templateParams,
                emailConfig.publicKey
            ).then(
                (response) => {
                    console.log('邮件发送成功:', response);
                },
                (error) => {
                    console.error('邮件发送失败:', error);
                }
            );
        } else {
            console.log('EmailJS配置待设置，客户信息:', templateParams);
        }
    }

    showSuccessMessage() {
        document.getElementById('success-message').style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.style.overflow = 'hidden';
    }

    hideSuccessMessage() {
        document.getElementById('success-message').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    resetForm() {
        document.getElementById('customerForm').reset();
        
        // 清理状态
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
            const error = group.querySelector('.error');
            if (error) error.remove();
        });
        
        const formError = document.querySelector('.rate-limit-error, .behavior-warning');
        if (formError) formError.remove();
        
        document.getElementById('customerForm').classList.remove('form-disabled');
        
        // 重置追踪数据
        this.mouseMovements = [];
        this.keystrokes = [];
        this.focusEvents = [];
        this.behaviorScore = 0;
        
        this.recordFormStartTime();
        this.updateSubmissionProgress();
    }

    // 获取统计数据
    getStats() {
        const total = this.customers.length;
        const pending = this.customers.filter(c => c.status === 'pending').length;
        const couponSent = this.customers.filter(c => c.status === 'coupon_sent').length;
        const completed = this.customers.filter(c => c.status === 'completed').length;
        
        return { total, pending, couponSent, completed };
    }

    // 导出功能保持不变
    exportToCSV() {
        if (this.customers.length === 0) {
            alert('No customer data to export');
            return;
        }

        const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'City', 'Interest', 'Status', 'Submitted At', 'Language', 'Behavior Score', 'Fill Time (s)'];
        const csvContent = [
            headers.join(','),
            ...this.customers.map(customer => [
                customer.id,
                `"${customer.name}"`,
                customer.email,
                `"${customer.phone}"`,
                customer.country,
                `"${customer.city}"`,
                customer.interest,
                customer.status,
                customer.submittedAt,
                customer.language,
                customer.securityMeta ? customer.securityMeta.behaviorScore : 'N/A',
                customer.securityMeta ? Math.floor(customer.securityMeta.fillTime / 1000) : 'N/A'
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'secure-customers.csv', 'text/csv');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// 初始化安全系统
window.customerSystem = new SecureCustomerSystem();

// 全局导出函数，供管理页面使用
window.exportCustomerData = {
    toCSV: () => window.customerSystem.exportToCSV(),
    getStats: () => window.customerSystem.getStats(),
    getCustomers: async () => {
        await window.customerSystem.loadEncryptedCustomerData();
        return window.customerSystem.customers;
    },
    updateCustomerStatus: async (id, status) => {
        const customer = window.customerSystem.customers.find(c => c.id === id);
        if (customer) {
            customer.status = status;
            await window.customerSystem.saveEncryptedCustomerData();
            return true;
        }
        return false;
    },
    // 安全相关的导出功能
    getSecurityReport: () => {
        const customers = window.customerSystem.customers.filter(c => c.securityMeta);
        return {
            totalSecureSubmissions: customers.length,
            averageBehaviorScore: customers.reduce((sum, c) => sum + (c.securityMeta.behaviorScore || 0), 0) / customers.length || 0,
            averageFillTime: customers.reduce((sum, c) => sum + (c.securityMeta.fillTime || 0), 0) / customers.length || 0,
            suspiciousSubmissions: customers.filter(c => c.securityMeta.behaviorScore < -30).length
        };
    },
    backupData: async () => {
        try {
            await window.customerSystem.loadEncryptedCustomerData();
            const backupData = {
                customers: window.customerSystem.customers,
                exportedAt: new Date().toISOString(),
                version: '3.0.0-secure',
                securityReport: window.exportCustomerData.getSecurityReport()
            };
            
            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `secure-customer-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('数据备份失败:', error);
            return false;
        }
    },
    restoreData: async (file) => {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            if (!backupData.customers || !Array.isArray(backupData.customers)) {
                throw new Error('无效的备份文件格式');
            }
            
            if (confirm('恢复数据将覆盖现有数据，是否继续？')) {
                window.customerSystem.customers = backupData.customers;
                await window.customerSystem.saveEncryptedCustomerData();
                alert('数据恢复成功！');
                window.location.reload();
            }
            return true;
        } catch (error) {
            console.error('数据恢复失败:', error);
            alert('数据恢复失败: ' + error.message);
            return false;
        }
    },
    clearData: async () => {
        if (confirm('此操作将清除所有客户数据，不可恢复！是否继续？')) {
            if (confirm('请再次确认，是否真的要清除所有数据？')) {
                window.customerSystem.customers = [];
                await window.customerSystem.saveEncryptedCustomerData();
                localStorage.removeItem('submission_times');
                localStorage.removeItem('device_fingerprint');
                alert('数据清理完成！');
                window.location.reload();
            }
        }
    }
};