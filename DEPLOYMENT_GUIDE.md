# GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建GitHub仓库
```bash
# 登录GitHub，点击 "New repository"
# Repository name: tiktok-customer-system
# Description: TikTok直播间客户信息收集系统
# Public ✓
# Add README file ✓
```

### 2. 上传文件
```bash
# 方式一：命令行
git clone https://github.com/YOUR_USERNAME/tiktok-customer-system.git
cd tiktok-customer-system

# 将github-pages-deploy目录下所有文件复制到仓库根目录
cp -r /path/to/github-pages-deploy/* ./

git add .
git commit -m "部署TikTok客户信息收集系统"
git push origin main
```

```bash
# 方式二：直接上传
# 在GitHub仓库页面点击 "uploading an existing file"
# 拖拽上传所有文件
# 提交更改
```

### 3. 启用GitHub Pages
```bash
# 仓库设置
1. 进入仓库 Settings 页面
2. 滚动到 "Pages" 部分
3. Source: "Deploy from a branch"
4. Branch: "main"
5. Folder: "/ (root)"
6. 点击 "Save"
```

### 4. 访问网站
```
网站地址: https://YOUR_USERNAME.github.io/tiktok-customer-system
管理后台: https://YOUR_USERNAME.github.io/tiktok-customer-system/admin
```

## 自定义域名配置

### DNS设置
```dns
# A记录指向GitHub Pages
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @  
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153

# CNAME记录指向www子域名
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

### 更新CNAME文件
```bash
# 编辑CNAME文件，替换为您的域名
echo "your-domain.com" > CNAME
git add CNAME
git commit -m "添加自定义域名"
git push
```

## 全球访问优化

### Cloudflare加速（推荐）
```bash
1. 注册Cloudflare账户
2. 添加您的域名
3. 更改域名的Nameservers
4. 在Cloudflare中启用：
   - Auto Minify (CSS, JS, HTML)
   - Brotli Compression
   - Always Use HTTPS
   - Browser Cache TTL: 1 month
```

### 非洲访问优化
```bash
# 推荐设置
- 使用.com或.org域名（解析速度更快）
- 启用Cloudflare CDN
- 设置正确的缓存策略
- 优化图片格式（WebP）
```

## 常见问题解决

### 部署失败
```bash
# 检查清单
1. 确认所有文件已上传
2. 检查仓库是否为Public
3. 检查Pages设置中的Branch
4. 等待几分钟再访问
```

### 路由问题
```bash
# 直接访问/admin返回404
# 原因：GitHub Pages不支持服务器端路由
# 解决：已提供404.html重定向处理
```

### 自定义域名问题
```bash
# DNS解析需要时间
# 等待时间：最多48小时
# 检查工具：https://www.whatsmydns.net/
```

## 性能监控

### 工具推荐
```bash
1. Google PageSpeed Insights
   - 测试网址：https://pagespeed.web.dev/
   
2. GTmetrix  
   - 测试网址：https://gtmetrix.com/
   
3. WebPageTest
   - 测试网址：https://www.webpagetest.org/
```

### 目标指标
```bash
- 加载时间：< 3秒
- 首屏渲染：< 1.5秒
- 最大内容绘制：< 2.5秒
- 累积布局偏移：< 0.1
```