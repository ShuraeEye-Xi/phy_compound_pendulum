# 部署指南

## GitHub Pages 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub账号，创建一个新的仓库
2. 仓库名称建议使用：`phy_compound_pendulum`
3. 选择为公开仓库（Public）
4. 不需要初始化README、.gitignore或license，因为我们已经有了这些文件

### 2. 将本地仓库连接到GitHub

在项目目录下执行以下命令（将YOUR_USERNAME替换为你的GitHub用户名）

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/phy_compound_pendulum.git
# 设置主分支
git branch -M main
# 推送代码到远程仓库
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

1. 打开GitHub仓库页面
2. 点击 Settings 标签
3. 找到左侧菜单中的 Pages
4. 在Source部分选择 "Deploy from a branch"
5. 选择 "gh-pages" 分支和 "/ (root)" 文件夹
6. 点击Save

### 5. 访问网站

部署成功后，你可以通过以下网址访问网站：
```
https://YOUR_USERNAME.github.io/phy_compound_pendulum/
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建项目

```bash
npm run build
```

构建后的文件会保存在dist目录中。