@echo off
echo 开始部署复合摆实验到GitHub Pages...

echo.
echo 1. 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo 2. 提交本地更改...
git add .
git commit -m "Update: %date% %time%"
git push origin main

echo.
echo 3. 部署到GitHub Pages...
call npm run deploy
if %errorlevel% neq 0 (
    echo 部署失败！
    pause
    exit /b 1
)

echo.
echo 部署完成！
echo 您的网站将在几分钟后在以下地址可用：
echo https://YOUR_USERNAME.github.io/phy_compound_pendulum/
echo.
echo 请将YOUR_USERNAME替换为您的GitHub用户名
pause