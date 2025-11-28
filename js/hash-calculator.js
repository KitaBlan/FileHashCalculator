/**
 * 哈希计算核心逻辑模块
 * 负责处理各种哈希算法的计算
 */

// 哈希计算器对象
const HashCalculator = {
    /**
     * 检查浏览器是否支持Web Crypto API
     * @returns {boolean} 是否支持
     */
    isCryptoSupported() {
        return typeof window.crypto !== 'undefined' && typeof window.crypto.subtle !== 'undefined';
    },

    /**
     * 将ArrayBuffer转换为十六进制字符串
     * @param {ArrayBuffer} buffer - ArrayBuffer对象
     * @param {string} format - 结果格式 ('lowercase' 或 'uppercase')
     * @returns {string} 十六进制字符串
     */
    bufferToHex(buffer, format = 'lowercase') {
        const bytes = new Uint8Array(buffer);
        let hex = '';
        
        for (let i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
        }
        
        return format === 'uppercase' ? hex.toUpperCase() : hex;
    },

    /**
     * 计算文件的哈希值
     * @param {File} file - 要计算哈希的文件
     * @param {string} algorithm - 哈希算法名称
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 计算结果
     */
    async calculateHash(file, algorithm, options = {}) {
        const { 
            chunkSize = SettingsManager.get('chunkSize'),
            onProgress = null,
            hmacKey = null
        } = options;

        return new Promise(async (resolve, reject) => {
            try {
                // 检查算法是否支持
                if (!this.isAlgorithmSupported(algorithm)) {
                    reject(new Error(`不支持的算法: ${algorithm}`));
                    return;
                }

                const startTime = Date.now();
                let processedBytes = 0;
                const reader = new FileReader();
                
                // 处理HMAC算法
                if (algorithm.startsWith('hmac-')) {
                    const hashAlgo = algorithm.substring(5); // 提取HMAC后的哈希算法
                    const result = await this.calculateHMAC(file, hashAlgo, hmacKey, {
                        chunkSize,
                        onProgress: (progress) => {
                            if (onProgress) {
                                onProgress(progress);
                            }
                        }
                    });
                    resolve(result);
                    return;
                }

                // 创建哈希对象
                const hashBuffer = await this.createHashInstance(algorithm);
                
                // 处理小文件（直接读取整个文件）
                if (file.size <= chunkSize) {
                    reader.onload = async (e) => {
                        try {
                            const arrayBuffer = e.target.result;
                            await this.updateHash(hashBuffer, arrayBuffer);
                            const hash = await this.finalizeHash(hashBuffer);
                            
                            if (onProgress) {
                                onProgress({
                                    processed: file.size,
                                    total: file.size,
                                    percentage: 100
                                });
                            }
                            
                            resolve({
                                algorithm,
                                hash: this.bufferToHex(hash, SettingsManager.get('resultFormat')),
                                duration: Date.now() - startTime
                            });
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error('文件读取失败'));
                    };
                    
                    reader.readAsArrayBuffer(file);
                    return;
                }

                // 处理大文件（分块读取）
                let offset = 0;
                
                const processChunk = async () => {
                    const chunk = file.slice(offset, offset + chunkSize);
                    
                    reader.onload = async (e) => {
                        try {
                            const arrayBuffer = e.target.result;
                            await this.updateHash(hashBuffer, arrayBuffer);
                            
                            processedBytes += arrayBuffer.byteLength;
                            offset += arrayBuffer.byteLength;
                            
                            // 计算进度
                            const percentage = Math.round((processedBytes / file.size) * 100);
                            
                            if (onProgress) {
                                onProgress({
                                    processed: processedBytes,
                                    total: file.size,
                                    percentage
                                });
                            }
                            
                            // 处理下一个块或完成
                            if (offset < file.size) {
                                processChunk();
                            } else {
                                const hash = await this.finalizeHash(hashBuffer);
                                
                                resolve({
                                    algorithm,
                                    hash: this.bufferToHex(hash, SettingsManager.get('resultFormat')),
                                    duration: Date.now() - startTime
                                });
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error('文件读取失败'));
                    };
                    
                    reader.readAsArrayBuffer(chunk);
                };
                
                // 开始处理第一个块
                processChunk();
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * 同时计算多个哈希算法
     * @param {File} file - 要计算哈希的文件
     * @param {Array<string>} algorithms - 哈希算法名称数组
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 包含所有算法计算结果的对象
     */
    async calculateMultipleHashes(file, algorithms, options = {}) {
        const results = {};
        const startTime = Date.now();
        
        // 计算每个算法的哈希值
        for (const algorithm of algorithms) {
            try {
                const result = await this.calculateHash(file, algorithm, {
                    ...options,
                    onProgress: (progress) => {
                        // 只使用第一个算法的进度回调
                        if (algorithm === algorithms[0] && options.onProgress) {
                            options.onProgress(progress);
                        }
                    }
                });
                
                results[algorithm] = result.hash;
            } catch (error) {
                console.error(`计算 ${algorithm} 哈希失败:`, error);
                results[algorithm] = `计算失败: ${error.message}`;
            }
        }
        
        return {
            filename: file.name,
            size: file.size,
            hashValues: results,
            duration: Date.now() - startTime
        };
    },

    /**
     * 创建哈希实例
     * @param {string} algorithm - 哈希算法名称
     * @returns {Promise<Object>} 哈希对象
     */
    async createHashInstance(algorithm) {
        if (!this.isCryptoSupported()) {
            // 如果浏览器不支持Web Crypto API，使用JS实现
            return this.createJsHashInstance(algorithm);
        }

        // 映射算法名称到Web Crypto API名称
        const cryptoAlgoMap = {
            'sha1': 'SHA-1',
            'sha256': 'SHA-256',
            'sha512': 'SHA-512'
        };

        const cryptoAlgo = cryptoAlgoMap[algorithm];
        
        if (cryptoAlgo) {
            return {
                algorithm: cryptoAlgo,
                type: 'crypto',
                buffer: null
            };
        } else {
            // 对于不支持的算法（如MD5），使用JS实现
            return this.createJsHashInstance(algorithm);
        }
    },

    /**
     * 使用JavaScript实现创建哈希实例
     * @param {string} algorithm - 哈希算法名称
     * @returns {Object} 哈希对象
     */
    createJsHashInstance(algorithm) {
        // 这里只实现MD5，其他算法可以根据需要添加
        if (algorithm === 'md5') {
            return {
                algorithm: 'MD5',
                type: 'js',
                state: this.md5Init()
            };
        }
        
        throw new Error(`不支持的算法: ${algorithm}`);
    },

    /**
     * 更新哈希对象
     * @param {Object} hashObj - 哈希对象
     * @param {ArrayBuffer} data - 要添加的数据
     * @returns {Promise<void>}
     */
    async updateHash(hashObj, data) {
        if (hashObj.type === 'crypto') {
            // 使用Web Crypto API
            if (!hashObj.buffer) {
                hashObj.buffer = data;
            } else {
                // 合并ArrayBuffer
                const newBuffer = new Uint8Array(hashObj.buffer.byteLength + data.byteLength);
                newBuffer.set(new Uint8Array(hashObj.buffer));
                newBuffer.set(new Uint8Array(data), hashObj.buffer.byteLength);
                hashObj.buffer = newBuffer.buffer;
            }
        } else if (hashObj.type === 'js') {
            // 使用JavaScript实现
            if (hashObj.algorithm === 'MD5') {
                hashObj.state = this.md5Update(hashObj.state, new Uint8Array(data));
            }
        }
    },

    /**
     * 完成哈希计算
     * @param {Object} hashObj - 哈希对象
     * @returns {Promise<ArrayBuffer>} 哈希结果
     */
    async finalizeHash(hashObj) {
        if (hashObj.type === 'crypto') {
            // 使用Web Crypto API
            const hashBuffer = await crypto.subtle.digest(hashObj.algorithm, hashObj.buffer);
            return hashBuffer;
        } else if (hashObj.type === 'js') {
            // 使用JavaScript实现
            if (hashObj.algorithm === 'MD5') {
                const hashBytes = this.md5Final(hashObj.state);
                return hashBytes.buffer;
            }
        }
        
        throw new Error('未知的哈希对象类型');
    },

    /**
     * 计算HMAC
     * @param {File} file - 要计算HMAC的文件
     * @param {string} algorithm - 基础哈希算法
     * @param {string} key - HMAC密钥
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 计算结果
     */
    async calculateHMAC(file, algorithm, key, options = {}) {
        const { chunkSize = SettingsManager.get('chunkSize'), onProgress = null } = options;
        
        // 如果没有提供密钥，使用空字符串
        const hmacKey = key || '';
        
        // 将密钥转换为ArrayBuffer
        const encoder = new TextEncoder();
        const keyBuffer = encoder.encode(hmacKey);
        
        // 映射算法名称
        const cryptoAlgoMap = {
            'md5': 'MD5',
            'sha1': 'SHA-1',
            'sha256': 'SHA-256'
        };
        
        const cryptoAlgo = cryptoAlgoMap[algorithm];
        
        if (!cryptoAlgo) {
            throw new Error(`不支持的HMAC算法: ${algorithm}`);
        }
        
        // 创建HMAC密钥
        const hmacKeyObj = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: `HMAC`, hash: cryptoAlgo },
            false,
            ['sign']
        );
        
        // 读取整个文件
        const fileBuffer = await this.readFileAsArrayBuffer(file, {
            chunkSize,
            onProgress
        });
        
        // 计算HMAC
        const startTime = Date.now();
        const hmacBuffer = await crypto.subtle.sign(
            'HMAC',
            hmacKeyObj,
            fileBuffer
        );
        
        return {
            algorithm: `hmac-${algorithm}`,
            hash: this.bufferToHex(hmacBuffer, SettingsManager.get('resultFormat')),
            duration: Date.now() - startTime
        };
    },

    /**
     * 读取文件为ArrayBuffer
     * @param {File} file - 要读取的文件
     * @param {Object} options - 选项
     * @returns {Promise<ArrayBuffer>} 文件内容
     */
    async readFileAsArrayBuffer(file, options = {}) {
        const { chunkSize = SettingsManager.get('chunkSize'), onProgress = null } = options;
        
        return new Promise((resolve, reject) => {
            // 处理小文件
            if (file.size <= chunkSize) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    if (onProgress) {
                        onProgress({
                            processed: file.size,
                            total: file.size,
                            percentage: 100
                        });
                    }
                    resolve(e.target.result);
                };
                
                reader.onerror = () => {
                    reject(new Error('文件读取失败'));
                };
                
                reader.readAsArrayBuffer(file);
                return;
            }
            
            // 处理大文件
            let offset = 0;
            const chunks = [];
            const reader = new FileReader();
            
            const readNextChunk = () => {
                const chunk = file.slice(offset, offset + chunkSize);
                
                reader.onload = (e) => {
                    chunks.push(e.target.result);
                    offset += chunk.size;
                    
                    if (onProgress) {
                        const percentage = Math.round((offset / file.size) * 100);
                        onProgress({
                            processed: offset,
                            total: file.size,
                            percentage
                        });
                    }
                    
                    if (offset < file.size) {
                        readNextChunk();
                    } else {
                        // 合并所有块
                        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
                        const result = new Uint8Array(totalSize);
                        
                        let currentOffset = 0;
                        chunks.forEach(chunk => {
                            result.set(new Uint8Array(chunk), currentOffset);
                            currentOffset += chunk.byteLength;
                        });
                        
                        resolve(result.buffer);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('文件读取失败'));
                };
                
                reader.readAsArrayBuffer(chunk);
            };
            
            readNextChunk();
        });
    },

    /**
     * 检查算法是否支持
     * @param {string} algorithm - 算法名称
     * @returns {boolean} 是否支持
     */
    isAlgorithmSupported(algorithm) {
        const supportedAlgorithms = [
            'md5',
            'sha1',
            'sha256',
            'sha512',
            'hmac-md5',
            'hmac-sha1',
            'hmac-sha256'
        ];
        
        return supportedAlgorithms.includes(algorithm);
    },

    /**
     * MD5算法实现
     * 以下是MD5算法的JavaScript实现
     */
    
    // MD5初始状态
    md5Init() {
        return {
            state: new Uint32Array([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476]),
            count: 0,
            buffer: new Uint8Array(64)
        };
    },
    
    // MD5更新
    md5Update(state, data) {
        const { state: hash, count, buffer } = state;
        let bufferIndex = (count >> 3) & 0x3F;
        let bitsProcessed = 0;
        
        // 更新计数器
        state.count += data.length << 3;
        
        // 处理现有缓冲区
        if (bufferIndex > 0) {
            const needed = Math.min(data.length, 64 - bufferIndex);
            buffer.set(data.subarray(0, needed), bufferIndex);
            bufferIndex += needed;
            bitsProcessed = needed;
            
            if (bufferIndex === 64) {
                this.md5Transform(hash, buffer);
                bufferIndex = 0;
            }
        }
        
        // 处理完整的块
        while (bitsProcessed + 64 <= data.length) {
            this.md5Transform(hash, data.subarray(bitsProcessed, bitsProcessed + 64));
            bitsProcessed += 64;
        }
        
        // 保存剩余数据到缓冲区
        if (bitsProcessed < data.length) {
            buffer.set(data.subarray(bitsProcessed), 0);
            state.buffer = buffer;
        }
        
        return state;
    },
    
    // MD5完成
    md5Final(state) {
        const { state: hash, count, buffer } = state;
        let bufferIndex = (count >> 3) & 0x3F;
        
        // 添加填充
        buffer[bufferIndex++] = 0x80;
        
        // 如果没有足够的空间添加长度，则添加一个额外的块
        if (bufferIndex > 56) {
            while (bufferIndex < 64) {
                buffer[bufferIndex++] = 0;
            }
            this.md5Transform(hash, buffer);
            bufferIndex = 0;
        }
        
        // 填充0
        while (bufferIndex < 56) {
            buffer[bufferIndex++] = 0;
        }
        
        // 添加长度（小端序）
        const lengthBytes = new Uint8Array(8);
        new DataView(lengthBytes.buffer).setUint32(0, count & 0xFFFFFFFF, true);
        new DataView(lengthBytes.buffer).setUint32(4, (count / 0x100000000) & 0xFFFFFFFF, true);
        buffer.set(lengthBytes, 56);
        
        // 处理最后一个块
        this.md5Transform(hash, buffer);
        
        // 将哈希值转换为字节数组（小端序）
        const result = new Uint8Array(16);
        for (let i = 0; i < 4; i++) {
            result[i * 4] = hash[i] & 0xFF;
            result[i * 4 + 1] = (hash[i] >> 8) & 0xFF;
            result[i * 4 + 2] = (hash[i] >> 16) & 0xFF;
            result[i * 4 + 3] = (hash[i] >> 24) & 0xFF;
        }
        
        return result;
    },
    
    // MD5变换
    md5Transform(state, block) {
        const x = new Uint32Array(16);
        
        // 将块转换为32位整数（小端序）
        for (let i = 0; i < 16; i++) {
            x[i] = (block[i * 4] & 0xFF) |
                   ((block[i * 4 + 1] & 0xFF) << 8) |
                   ((block[i * 4 + 2] & 0xFF) << 16) |
                   ((block[i * 4 + 3] & 0xFF) << 24);
        }
        
        let a = state[0];
        let b = state[1];
        let c = state[2];
        let d = state[3];
        
        // 第一轮
        a = this.md5FF(a, b, c, d, x[0], 7, 0xD76AA478);
        d = this.md5FF(d, a, b, c, x[1], 12, 0xE8C7B756);
        c = this.md5FF(c, d, a, b, x[2], 17, 0x242070DB);
        b = this.md5FF(b, c, d, a, x[3], 22, 0xC1BDCEEE);
        a = this.md5FF(a, b, c, d, x[4], 7, 0xF57C0FAF);
        d = this.md5FF(d, a, b, c, x[5], 12, 0x4787C62A);
        c = this.md5FF(c, d, a, b, x[6], 17, 0xA8304613);
        b = this.md5FF(b, c, d, a, x[7], 22, 0xFD469501);
        a = this.md5FF(a, b, c, d, x[8], 7, 0x698098D8);
        d = this.md5FF(d, a, b, c, x[9], 12, 0x8B44F7AF);
        c = this.md5FF(c, d, a, b, x[10], 17, 0xFFFF5BB1);
        b = this.md5FF(b, c, d, a, x[11], 22, 0x895CD7BE);
        a = this.md5FF(a, b, c, d, x[12], 7, 0x6B901122);
        d = this.md5FF(d, a, b, c, x[13], 12, 0xFD987193);
        c = this.md5FF(c, d, a, b, x[14], 17, 0xA679438E);
        b = this.md5FF(b, c, d, a, x[15], 22, 0x49B40821);
        
        // 第二轮
        a = this.md5GG(a, b, c, d, x[1], 5, 0xF61E2562);
        d = this.md5GG(d, a, b, c, x[6], 9, 0xC040B340);
        c = this.md5GG(c, d, a, b, x[11], 14, 0x265E5A51);
        b = this.md5GG(b, c, d, a, x[0], 20, 0xE9B6C7AA);
        a = this.md5GG(a, b, c, d, x[5], 5, 0xD62F105D);
        d = this.md5GG(d, a, b, c, x[10], 9, 0x02441453);
        c = this.md5GG(c, d, a, b, x[15], 14, 0xD8A1E681);
        b = this.md5GG(b, c, d, a, x[4], 20, 0xE7D3FBC8);
        a = this.md5GG(a, b, c, d, x[9], 5, 0x21E1CDE6);
        d = this.md5GG(d, a, b, c, x[14], 9, 0xC33707D6);
        c = this.md5GG(c, d, a, b, x[3], 14, 0xF4D50D87);
        b = this.md5GG(b, c, d, a, x[8], 20, 0x455A14ED);
        a = this.md5GG(a, b, c, d, x[13], 5, 0xA9E3E905);
        d = this.md5GG(d, a, b, c, x[2], 9, 0xFCEFA3F8);
        c = this.md5GG(c, d, a, b, x[7], 14, 0x676F02D9);
        b = this.md5GG(b, c, d, a, x[12], 20, 0x8D2A4C8A);
        
        // 第三轮
        a = this.md5HH(a, b, c, d, x[5], 4, 0xFFFA3942);
        d = this.md5HH(d, a, b, c, x[8], 11, 0x8771F681);
        c = this.md5HH(c, d, a, b, x[11], 16, 0x6D9D6122);
        b = this.md5HH(b, c, d, a, x[14], 23, 0xFDE5380C);
        a = this.md5HH(a, b, c, d, x[1], 4, 0xA4BEEA44);
        d = this.md5HH(d, a, b, c, x[4], 11, 0x4BDECFA9);
        c = this.md5HH(c, d, a, b, x[7], 16, 0xF6BB4B60);
        b = this.md5HH(b, c, d, a, x[10], 23, 0xBEBFBC70);
        a = this.md5HH(a, b, c, d, x[13], 4, 0x289B7EC6);
        d = this.md5HH(d, a, b, c, x[0], 11, 0xEAA127FA);
        c = this.md5HH(c, d, a, b, x[3], 16, 0xD4EF3085);
        b = this.md5HH(b, c, d, a, x[6], 23, 0x04881D05);
        a = this.md5HH(a, b, c, d, x[9], 4, 0xD9D4D039);
        d = this.md5HH(d, a, b, c, x[12], 11, 0xE6DB99E5);
        c = this.md5HH(c, d, a, b, x[15], 16, 0x1FA27CF8);
        b = this.md5HH(b, c, d, a, x[2], 23, 0xC4AC5665);
        
        // 第四轮
        a = this.md5II(a, b, c, d, x[0], 6, 0xF4292244);
        d = this.md5II(d, a, b, c, x[7], 10, 0x432AFF97);
        c = this.md5II(c, d, a, b, x[14], 15, 0xAB9423A7);
        b = this.md5II(b, c, d, a, x[5], 21, 0xFC93A039);
        a = this.md5II(a, b, c, d, x[12], 6, 0x655B59C3);
        d = this.md5II(d, a, b, c, x[3], 10, 0x8F0CCC92);
        c = this.md5II(c, d, a, b, x[10], 15, 0xFFEFF47D);
        b = this.md5II(b, c, d, a, x[1], 21, 0x85845DD1);
        a = this.md5II(a, b, c, d, x[8], 6, 0x6FA87E4F);
        d = this.md5II(d, a, b, c, x[15], 10, 0xFE2CE6E0);
        c = this.md5II(c, d, a, b, x[6], 15, 0xA3014314);
        b = this.md5II(b, c, d, a, x[13], 21, 0x4E0811A1);
        a = this.md5II(a, b, c, d, x[4], 6, 0xF7537E82);
        d = this.md5II(d, a, b, c, x[11], 10, 0xBD3AF235);
        c = this.md5II(c, d, a, b, x[2], 15, 0x2AD7D2BB);
        b = this.md5II(b, c, d, a, x[9], 21, 0xEB86D391);
        
        // 更新状态
        state[0] += a;
        state[1] += b;
        state[2] += c;
        state[3] += d;
    },
    
    // MD5辅助函数
    md5FF(a, b, c, d, x, s, t) {
        a += ((b & c) | (~b & d)) + x + t;
        return ((a << s) | (a >>> (32 - s))) + b;
    },

    md5GG(a, b, c, d, x, s, t) {
        a += ((b & d) | (c & ~d)) + x + t;
        return ((a << s) | (a >>> (32 - s))) + b;
    },

    md5HH(a, b, c, d, x, s, t) {
        a += (b ^ c ^ d) + x + t;
        return ((a << s) | (a >>> (32 - s))) + b;
    },

    md5II(a, b, c, d, x, s, t) {
        a += (c ^ (b | ~d)) + x + t;
        return ((a << s) | (a >>> (32 - s))) + b;
    }
};