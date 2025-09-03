// 纯JavaScript本地QR码生成器
class LocalQRCode {
    constructor() {
        // QR码版本信息 (Version 1 = 21x21)
        this.version = 1;
        this.size = 21;
        this.errorCorrection = 'M'; // M = 15% error correction
        
        // 数据容量表 (Version 1, Error Correction Level M)
        this.dataCapacity = {
            numeric: 20,
            alphanumeric: 16,
            byte: 14
        };
        
        // 格式信息
        this.formatInfo = {
            'L': [0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976],
            'M': [0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0],
            'Q': [0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED],
            'H': [0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B]
        };
        
        // 初始化模块矩阵
        this.modules = [];
        this.reserved = [];
        this.initMatrix();
    }
    
    initMatrix() {
        // 创建21x21的矩阵
        for (let i = 0; i < this.size; i++) {
            this.modules[i] = new Array(this.size).fill(false);
            this.reserved[i] = new Array(this.size).fill(false);
        }
        
        // 放置定位图案 (Position Detection Pattern)
        this.addPositionDetectionPattern(0, 0);
        this.addPositionDetectionPattern(0, this.size - 7);
        this.addPositionDetectionPattern(this.size - 7, 0);
        
        // 添加分离符
        this.addSeparators();
        
        // 添加定时图案 (Timing Pattern)
        this.addTimingPatterns();
        
        // 添加暗模块 (Dark Module)
        this.modules[4 * this.version + 9][8] = true;
        this.reserved[4 * this.version + 9][8] = true;
    }
    
    addPositionDetectionPattern(x, y) {
        // 7x7的定位图案
        const pattern = [
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1]
        ];
        
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (x + i < this.size && y + j < this.size) {
                    this.modules[x + i][y + j] = pattern[i][j] === 1;
                    this.reserved[x + i][y + j] = true;
                }
            }
        }
    }
    
    addSeparators() {
        // 添加分离符（白色边框）
        const separators = [
            {x: 0, y: 7, width: 8, height: 1},
            {x: 7, y: 0, width: 1, height: 7},
            {x: 0, y: this.size-8, width: 8, height: 1},
            {x: 7, y: this.size-7, width: 1, height: 7},
            {x: this.size-8, y: 0, width: 1, height: 8},
            {x: this.size-8, y: 7, width: 8, height: 1}
        ];
        
        separators.forEach(sep => {
            for (let i = 0; i < sep.height; i++) {
                for (let j = 0; j < sep.width; j++) {
                    if (sep.x + j < this.size && sep.y + i < this.size) {
                        this.modules[sep.x + j][sep.y + i] = false;
                        this.reserved[sep.x + j][sep.y + i] = true;
                    }
                }
            }
        });
    }
    
    addTimingPatterns() {
        // 水平和垂直定时图案
        for (let i = 8; i < this.size - 8; i++) {
            this.modules[6][i] = (i % 2) === 0;
            this.modules[i][6] = (i % 2) === 0;
            this.reserved[6][i] = true;
            this.reserved[i][6] = true;
        }
    }
    
    encodeData(text) {
        // 简化的字节编码模式
        const mode = 0x4; // 字节模式
        const length = text.length;
        
        // 构建数据比特流
        let data = '';
        
        // 模式指示符 (4 bits)
        data += this.toBinary(mode, 4);
        
        // 字符数指示符 (8 bits for byte mode in version 1)
        data += this.toBinary(length, 8);
        
        // 数据
        for (let i = 0; i < text.length; i++) {
            data += this.toBinary(text.charCodeAt(i), 8);
        }
        
        // 添加终止符
        const maxBits = 104; // Version 1, Level M的数据容量
        const remainingBits = maxBits - data.length;
        data += '0'.repeat(Math.min(4, remainingBits));
        
        // 填充到字节边界
        while (data.length % 8 !== 0) {
            data += '0';
        }
        
        // 添加填充字节
        const paddingBytes = ['11101100', '00010001'];
        let paddingIndex = 0;
        while (data.length < maxBits) {
            data += paddingBytes[paddingIndex % 2];
            paddingIndex++;
        }
        
        return data.substring(0, maxBits);
    }
    
    toBinary(num, length) {
        return num.toString(2).padStart(length, '0');
    }
    
    generateErrorCorrection(data) {
        // 简化的纠错码生成 (使用Reed-Solomon但简化实现)
        // Version 1, Level M: 10个纠错码字
        const errorCodewords = 10;
        const dataBytes = [];
        
        // 将二进制数据转换为字节
        for (let i = 0; i < data.length; i += 8) {
            const byte = data.substring(i, i + 8);
            dataBytes.push(parseInt(byte, 2));
        }
        
        // 简化的纠错码（实际应用中需要完整的Reed-Solomon算法）
        const errorBytes = [];
        for (let i = 0; i < errorCodewords; i++) {
            let checksum = 0;
            for (let j = 0; j < dataBytes.length; j++) {
                checksum ^= dataBytes[j];
            }
            errorBytes.push((checksum + i * 17) % 256);
        }
        
        // 组合数据和纠错码
        const allBytes = [...dataBytes, ...errorBytes];
        let result = '';
        for (const byte of allBytes) {
            result += this.toBinary(byte, 8);
        }
        
        return result;
    }
    
    placeData(data) {
        let bitIndex = 0;
        let direction = -1; // -1 = up, 1 = down
        
        // 从右下角开始，按Z字形放置数据
        for (let col = this.size - 1; col > 0; col -= 2) {
            if (col === 6) col--; // 跳过定时图案列
            
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < 2; j++) {
                    const x = col - j;
                    const y = direction === -1 ? (this.size - 1 - i) : i;
                    
                    if (!this.reserved[y][x] && bitIndex < data.length) {
                        this.modules[y][x] = data[bitIndex] === '1';
                        bitIndex++;
                    }
                }
            }
            direction *= -1;
        }
    }
    
    addFormatInfo() {
        // 添加格式信息 (错误纠正级别M, 掩码图案0)
        const formatBits = this.formatInfo['M'][0];
        const formatStr = this.toBinary(formatBits, 15);
        
        // 放置格式信息位
        for (let i = 0; i < 6; i++) {
            this.modules[8][i] = formatStr[i] === '1';
            this.modules[this.size - 1 - i][8] = formatStr[i] === '1';
        }
        
        this.modules[8][7] = formatStr[6] === '1';
        this.modules[8][8] = formatStr[7] === '1';
        this.modules[7][8] = formatStr[8] === '1';
        
        for (let i = 9; i < 15; i++) {
            this.modules[14 - i][8] = formatStr[i] === '1';
            this.modules[8][this.size - 15 + i] = formatStr[i] === '1';
        }
    }
    
    generate(text) {
        // 重置矩阵
        this.initMatrix();
        
        // 编码数据
        const encodedData = this.encodeData(text);
        
        // 生成纠错码
        const dataWithEC = this.generateErrorCorrection(encodedData);
        
        // 放置数据
        this.placeData(dataWithEC);
        
        // 添加格式信息
        this.addFormatInfo();
        
        return this.modules;
    }
    
    renderToCanvas(canvas, modules, cellSize = 10) {
        const ctx = canvas.getContext('2d');
        canvas.width = this.size * cellSize;
        canvas.height = this.size * cellSize;
        
        // 清空画布 (白色背景)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制QR码模块
        ctx.fillStyle = '#000000';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (modules[y][x]) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        
        return canvas;
    }
}

// 导出供全局使用
window.LocalQRCode = LocalQRCode;
