/**
 * 数据安全模块 - Security Manager
 * 提供AES加密存储、数据备份恢复、二次确认等安全功能
 * @author AI Assistant
 * @date 2025-09-09
 */

class SecurityManager {
    constructor() {
        this.keyName = 'security_key';
        this.encryptedPrefix = 'enc_';
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // GCM模式推荐12字节IV
    }

    /**
     * 初始化安全管理器
     */
    async init() {
        try {
            await this.ensureCryptoKey();
            console.log('✅ 安全管理器初始化成功');
        } catch (error) {
            console.error('❌ 安全管理器初始化失败:', error);
            throw new Error('安全模块初始化失败，请刷新页面重试');
        }
    }

    /**
     * 确保加密密钥存在
     */
    async ensureCryptoKey() {
        try {
            const storedKey = localStorage.getItem(this.keyName);
            if (storedKey) {
                this.cryptoKey = await this.importKey(storedKey);
            } else {
                this.cryptoKey = await this.generateKey();
                await this.storeKey();
            }
        } catch (error) {
            console.error('密钥处理失败:', error);
            throw new Error('加密密钥初始化失败');
        }
    }

    /**
     * 生成新的AES加密密钥
     */
    async generateKey() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: this.algorithm,
                    length: this.keyLength
                },
                true, // 可导出
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('密钥生成失败:', error);
            throw new Error('无法生成加密密钥');
        }
    }

    /**
     * 存储密钥到localStorage
     */
    async storeKey() {
        try {
            const exportedKey = await window.crypto.subtle.exportKey('raw', this.cryptoKey);
            const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
            localStorage.setItem(this.keyName, keyBase64);
        } catch (error) {
            console.error('密钥存储失败:', error);
            throw new Error('无法保存加密密钥');
        }
    }

    /**
     * 从Base64导入密钥
     */
    async importKey(keyBase64) {
        try {
            const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
            return await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: this.algorithm },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('密钥导入失败:', error);
            throw new Error('无法导入加密密钥');
        }
    }

    /**
     * 加密数据
     * @param {string} plaintext - 明文数据
     * @returns {string} - 加密后的Base64字符串
     */
    async encrypt(plaintext) {
        try {
            if (!this.cryptoKey) {
                await this.ensureCryptoKey();
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);
            const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));

            const ciphertext = await window.crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                this.cryptoKey,
                data
            );

            // 将IV和密文合并
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('数据加密失败:', error);
            throw new Error('数据加密失败，请重试');
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedData - 加密的Base64字符串
     * @returns {string} - 解密后的明文
     */
    async decrypt(encryptedData) {
        try {
            if (!this.cryptoKey) {
                await this.ensureCryptoKey();
            }

            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const iv = combined.slice(0, this.ivLength);
            const ciphertext = combined.slice(this.ivLength);

            const plaintext = await window.crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                this.cryptoKey,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(plaintext);
        } catch (error) {
            console.error('数据解密失败:', error);
            throw new Error('数据解密失败，可能数据已损坏');
        }
    }

    /**
     * 安全存储数据到localStorage（加密）
     * @param {string} key - 存储键
     * @param {any} value - 要存储的值
     */
    async secureStore(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            const encrypted = await this.encrypt(jsonString);
            localStorage.setItem(this.encryptedPrefix + key, encrypted);
            console.log(`✅ 数据已安全存储: ${key}`);
        } catch (error) {
            console.error('安全存储失败:', error);
            throw new Error(`数据存储失败: ${error.message}`);
        }
    }

    /**
     * 从localStorage安全读取数据（解密）
     * @param {string} key - 存储键
     * @returns {any} - 解密后的数据
     */
    async secureRetrieve(key) {
        try {
            const encrypted = localStorage.getItem(this.encryptedPrefix + key);
            if (!encrypted) {
                return null;
            }

            const decrypted = await this.decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('安全读取失败:', error);
            throw new Error(`数据读取失败: ${error.message}`);
        }
    }

    /**
     * 删除安全存储的数据
     * @param {string} key - 存储键
     */
    secureRemove(key) {
        try {
            localStorage.removeItem(this.encryptedPrefix + key);
            console.log(`✅ 安全数据已删除: ${key}`);
        } catch (error) {
            console.error('数据删除失败:', error);
            throw new Error(`数据删除失败: ${error.message}`);
        }
    }

    /**
     * 二次确认对话框
     * @param {string} message - 确认消息
     * @param {string} title - 对话框标题
     * @returns {Promise<boolean>} - 用户确认结果
     */
    async doubleConfirm(message, title = '安全确认') {
        return new Promise((resolve) => {
            // 创建模态对话框
            const modal = document.createElement('div');
            modal.className = 'security-modal';
            modal.innerHTML = `
                <div class="security-modal-overlay">
                    <div class="security-modal-content">
                        <div class="security-modal-header">
                            <h3>🔒 ${title}</h3>
                        </div>
                        <div class="security-modal-body">
                            <p>${message}</p>
                            <p class="security-warning">⚠️ 此操作无法撤销，请确认您了解操作后果</p>
                        </div>
                        <div class="security-modal-footer">
                            <button class="btn-cancel" id="cancelBtn">取消</button>
                            <button class="btn-confirm" id="confirmBtn">确认执行</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .security-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                }
                .security-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .security-modal-content {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 500px;
                    min-width: 300px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }
                .security-modal-header h3 {
                    margin: 0 0 15px 0;
                    color: #d63384;
                    font-size: 18px;
                }
                .security-modal-body p {
                    margin: 10px 0;
                    color: #333;
                    line-height: 1.5;
                }
                .security-warning {
                    color: #856404;
                    background: #fff3cd;
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid #ffecb5;
                    font-size: 14px;
                }
                .security-modal-footer {
                    margin-top: 20px;
                    text-align: right;
                }
                .btn-cancel, .btn-confirm {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                .btn-confirm {
                    background: #dc3545;
                    color: white;
                }
                .btn-cancel:hover {
                    background: #545b62;
                }
                .btn-confirm:hover {
                    background: #bb2d3b;
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(modal);

            // 绑定事件
            const cancelBtn = modal.querySelector('#cancelBtn');
            const confirmBtn = modal.querySelector('#confirmBtn');

            const cleanup = () => {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // ESC键取消
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', handleEsc);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    /**
     * 数据备份功能
     * @param {string} filename - 备份文件名（可选）
     */
    async backupData(filename = null) {
        try {
            const confirm = await this.doubleConfirm(
                '即将导出所有加密数据到本地文件。请确认您要进行数据备份操作？',
                '数据备份确认'
            );

            if (!confirm) {
                console.log('用户取消了数据备份');
                return false;
            }

            // 收集所有加密数据
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {}
            };

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.encryptedPrefix)) {
                    const originalKey = key.replace(this.encryptedPrefix, '');
                    const encryptedValue = localStorage.getItem(key);
                    backupData.data[originalKey] = encryptedValue;
                }
            }

            // 创建下载链接
            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `backup_${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ 数据备份完成');
            this.showMessage('数据备份成功！文件已下载到本地', 'success');
            return true;

        } catch (error) {
            console.error('数据备份失败:', error);
            this.showMessage(`数据备份失败: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 数据恢复功能
     * @param {File} file - 备份文件
     */
    async restoreData(file) {
        try {
            const confirm = await this.doubleConfirm(
                '即将从备份文件恢复数据，这将覆盖现有的所有数据。请确认您要进行数据恢复操作？',
                '数据恢复确认'
            );

            if (!confirm) {
                console.log('用户取消了数据恢复');
                return false;
            }

            const fileContent = await this.readFileAsText(file);
            const backupData = JSON.parse(fileContent);

            // 验证备份文件格式
            if (!backupData.data || !backupData.timestamp) {
                throw new Error('备份文件格式无效');
            }

            // 清除现有加密数据
            const existingKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.encryptedPrefix)) {
                    existingKeys.push(key);
                }
            }
            existingKeys.forEach(key => localStorage.removeItem(key));

            // 恢复数据
            for (const [key, value] of Object.entries(backupData.data)) {
                localStorage.setItem(this.encryptedPrefix + key, value);
            }

            console.log('✅ 数据恢复完成');
            this.showMessage(`数据恢复成功！恢复了${Object.keys(backupData.data).length}项数据`, 'success');
            return true;

        } catch (error) {
            console.error('数据恢复失败:', error);
            this.showMessage(`数据恢复失败: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 读取文件内容
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 数据清理功能
     */
    async cleanupData() {
        try {
            const confirm = await this.doubleConfirm(
                '即将清除所有存储的加密数据，包括密钥和客户信息。此操作不可逆，请确认您要进行数据清理？',
                '数据清理确认'
            );

            if (!confirm) {
                console.log('用户取消了数据清理');
                return false;
            }

            // 收集所有需要删除的键
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.encryptedPrefix) || key === this.keyName) {
                    keysToDelete.push(key);
                }
            }

            // 删除所有相关数据
            keysToDelete.forEach(key => localStorage.removeItem(key));

            // 重置密钥
            this.cryptoKey = null;

            console.log('✅ 数据清理完成');
            this.showMessage(`数据清理成功！清除了${keysToDelete.length}项数据`, 'success');
            return true;

        } catch (error) {
            console.error('数据清理失败:', error);
            this.showMessage(`数据清理失败: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 获取存储统计信息
     */
    getStorageStats() {
        try {
            let encryptedCount = 0;
            let totalSize = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.encryptedPrefix)) {
                    encryptedCount++;
                    totalSize += localStorage.getItem(key).length;
                }
            }

            return {
                encryptedItems: encryptedCount,
                totalItems: localStorage.length,
                approximateSize: this.formatBytes(totalSize * 2), // UTF-16近似
                hasKey: !!localStorage.getItem(this.keyName)
            };
        } catch (error) {
            console.error('获取存储统计失败:', error);
            return null;
        }
    }

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 显示用户消息
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `security-message security-message-${type}`;
        messageDiv.innerHTML = `
            <div class="security-message-content">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .security-message {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                max-width: 400px;
                padding: 12px 16px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                animation: slideInRight 0.3s ease-out;
            }
            .security-message-success {
                background: #d1edff;
                color: #0c63e4;
                border: 1px solid #b8daff;
            }
            .security-message-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .security-message-info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(messageDiv);

        // 3秒后自动删除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
                document.head.removeChild(style);
            }
        }, 3000);
    }

    /**
     * 健康检查
     */
    async healthCheck() {
        const health = {
            cryptoSupport: !!window.crypto?.subtle,
            keyExists: !!localStorage.getItem(this.keyName),
            keyValid: false,
            storageAvailable: true,
            timestamp: new Date().toISOString()
        };

        try {
            // 测试加密解密
            if (this.cryptoKey || await this.ensureCryptoKey()) {
                const testData = 'health_check_test';
                const encrypted = await this.encrypt(testData);
                const decrypted = await this.decrypt(encrypted);
                health.keyValid = decrypted === testData;
            }
        } catch (error) {
            health.error = error.message;
        }

        try {
            // 测试localStorage
            const testKey = 'health_test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            health.storageAvailable = false;
            health.storageError = error.message;
        }

        return health;
    }
}

// 创建全局实例
const securityManager = new SecurityManager();

// 导出类和实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, securityManager };
} else if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
    window.securityManager = securityManager;
}

console.log('🔒 Security Manager 模块已加载');