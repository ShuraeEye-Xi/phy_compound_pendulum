# 部署指南

## GitHub Pages 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub，创建一个新的仓库
2. 仓库名建议使用：`phy_compound_pendulum`
3. 设置为公开仓库（Public）
4. 不要初始化README、.gitignore或license（因为我们已经有了）

### 2. 连接本地仓库到GitHub

在项目根目录执行以下命令（替换YOUR_USERNAME为您的GitHub用户名）：

```bash
git remote add origin https://github.com/YOUR_USERNAME/phy_compound_pendulum.git
git branch -M main
git push -u origin main
```

### 3. 部署到GitHub Pages

```bash
npm run deploy
```

这个命令会：
- 自动构建项目（npm run build）
- 将构建结果推送到gh-pages分支
- GitHub会自动从gh-pages分支部署网站

### 4. 配置GitHub Pages

1. 进入GitHub仓库页面
2. 点击 Settings 标签
3. 在左侧菜单找到 Pages
4. 在Source部分选择 "Deploy from a branch"
5. 选择 "gh-pages" 分支和 "/ (root)" 文件夹
6. 点击Save

### 5. 访问网站

部署完成后，您的网站将在以下地址可用：
```
https://YOUR_USERNAME.github.io/phy_compound_pendulum/
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 更新部署

每次修改代码后，只需要运行：
```bash
git add .
git commit -m "更新描述"
git push origin main
npm run deploy
```

## 注意事项

1. 确保vite.config.js中的base路径设置正确：`base: '/phy_compound_pendulum/'`
2. 如果仓库名不同，需要相应修改base路径
3. 首次部署可能需要几分钟才能生效
4. 确保GitHub仓库是公开的，否则GitHub Pages无法使用

## 故障排除

### 如果网站无法访问：
1. 检查GitHub Pages设置是否正确
2. 确认gh-pages分支是否存在且有内容
3. 检查vite.config.js中的base路径是否正确

### 如果样式或资源加载失败：
1. 检查base路径配置
2. 确认所有资源路径都是相对路径

### 如果部署失败：
1. 检查npm run build是否成功
2. 确认有gh-pages依赖包
3. 检查Git配置是否正确