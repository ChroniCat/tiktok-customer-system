// TikTok Customer System JavaScript
class CustomerSystem {
    constructor() {
        this.currentLang = 'en';
        this.customers = JSON.parse(localStorage.getItem('customers') || '[]');
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
                'admin-link-text': 'Customer Service Portal'
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
                'admin-link-text': 'Portail Service Client'
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLanguage();
        this.registerServiceWorker();
    }

    setupEventListeners() {
        // 语言切换
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLanguage(e.target.dataset.lang);
            });
        });

        // 表单提交
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 提交另一份表单
        document.getElementById('submit-another').addEventListener('click', () => {
            this.hideSuccessMessage();
            this.resetForm();
        });
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred-language', lang);
        
        // 更新按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // 更新页面文本
        this.updateTexts();
    }

    updateTexts() {
        const translations = this.translations[this.currentLang];
        
        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
    }

    loadLanguage() {
        const savedLang = localStorage.getItem('preferred-language') || 'en';
        this.switchLanguage(savedLang);
    }

    handleFormSubmit() {
        const formData = this.getFormData();
        
        if (this.validateForm(formData)) {
            this.saveCustomer(formData);
            this.sendEmail(formData);
            this.showSuccessMessage();
        }
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
        
        // 清除之前的错误
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
            const error = group.querySelector('.error');
            if (error) error.remove();
        });

        // 验证必填字段
        const requiredFields = ['name', 'email', 'phone', 'country', 'city', 'interest'];
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                this.showFieldError(field, this.getErrorMessage('required'));
                isValid = false;
            }
        });

        // 验证邮箱格式
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

    saveCustomer(customer) {
        this.customers.push(customer);
        localStorage.setItem('customers', JSON.stringify(this.customers));
        
        // 触发存储事件，通知其他页面
        window.dispatchEvent(new CustomEvent('customerAdded', {
            detail: customer
        }));
    }

    sendEmail(data) {
        // EmailJS配置 - 用户需要替换这些值
        const emailConfig = {
            serviceId: 'YOUR_EMAILJS_SERVICE_ID',
            templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
        };

        // 邮件模板参数
        const templateParams = {
            to_email: 'your-email@example.com', // 替换为您的邮箱
            customer_name: data.name,
            customer_email: data.email,
            customer_phone: data.phone,
            customer_country: data.country,
            customer_city: data.city,
            customer_interest: data.interest,
            submission_time: new Date(data.submittedAt).toLocaleString(),
            language: data.language
        };

        // 如果EmailJS已配置，发送邮件
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
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
    }

    hideSuccessMessage() {
        document.getElementById('success-message').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    resetForm() {
        document.getElementById('customerForm').reset();
        
        // 清除错误状态
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
            const error = group.querySelector('.error');
            if (error) error.remove();
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then((registration) => {
                        console.log('Service Worker 注册成功:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('Service Worker 注册失败:', error);
                    });
            });
        }
    }

    // 获取统计数据（供管理页面使用）
    getStats() {
        const total = this.customers.length;
        const pending = this.customers.filter(c => c.status === 'pending').length;
        const couponSent = this.customers.filter(c => c.status === 'coupon_sent').length;
        const completed = this.customers.filter(c => c.status === 'completed').length;
        
        return { total, pending, couponSent, completed };
    }

    // 导出数据为CSV
    exportToCSV() {
        if (this.customers.length === 0) {
            alert('No customer data to export');
            return;
        }

        const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'City', 'Interest', 'Status', 'Submitted At', 'Language'];
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
                customer.language
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'customers.csv', 'text/csv');
    }

    // 导出数据为Excel
    exportToExcel() {
        if (this.customers.length === 0) {
            alert('No customer data to export');
            return;
        }

        // 简单的Excel XML格式
        const excelContent = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Customers">
<Table>
<Row>
<Cell><Data ss:Type="String">ID</Data></Cell>
<Cell><Data ss:Type="String">Name</Data></Cell>
<Cell><Data ss:Type="String">Email</Data></Cell>
<Cell><Data ss:Type="String">Phone</Data></Cell>
<Cell><Data ss:Type="String">Country</Data></Cell>
<Cell><Data ss:Type="String">City</Data></Cell>
<Cell><Data ss:Type="String">Interest</Data></Cell>
<Cell><Data ss:Type="String">Status</Data></Cell>
<Cell><Data ss:Type="String">Submitted At</Data></Cell>
<Cell><Data ss:Type="String">Language</Data></Cell>
</Row>
${this.customers.map(customer => `<Row>
<Cell><Data ss:Type="Number">${customer.id}</Data></Cell>
<Cell><Data ss:Type="String">${customer.name}</Data></Cell>
<Cell><Data ss:Type="String">${customer.email}</Data></Cell>
<Cell><Data ss:Type="String">${customer.phone}</Data></Cell>
<Cell><Data ss:Type="String">${customer.country}</Data></Cell>
<Cell><Data ss:Type="String">${customer.city}</Data></Cell>
<Cell><Data ss:Type="String">${customer.interest}</Data></Cell>
<Cell><Data ss:Type="String">${customer.status}</Data></Cell>
<Cell><Data ss:Type="String">${customer.submittedAt}</Data></Cell>
<Cell><Data ss:Type="String">${customer.language}</Data></Cell>
</Row>`).join('')}
</Table>
</Worksheet>
</Workbook>`;

        this.downloadFile(excelContent, 'customers.xls', 'application/vnd.ms-excel');
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

// 初始化系统
window.customerSystem = new CustomerSystem();

// 全局导出函数，供管理页面使用
window.exportCustomerData = {
    toCSV: () => window.customerSystem.exportToCSV(),
    toExcel: () => window.customerSystem.exportToExcel(),
    getStats: () => window.customerSystem.getStats(),
    getCustomers: () => window.customerSystem.customers,
    updateCustomerStatus: (id, status) => {
        const customer = window.customerSystem.customers.find(c => c.id === id);
        if (customer) {
            customer.status = status;
            localStorage.setItem('customers', JSON.stringify(window.customerSystem.customers));
            return true;
        }
        return false;
    }
};
