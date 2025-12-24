@echo off
echo Installing Poppulo Headless Player as Windows Service...
echo.
echo This will:
echo - Install the service to auto-start on boot
echo - Set production environment variables
echo - Start the service immediately
echo.
pause

cd /d "%~dp0"
node install-service.js

echo.
echo Installation complete!
echo.
echo Service Management:
echo - Start: net start "Poppulo Headless Player"
echo - Stop:  net stop "Poppulo Headless Player"  
echo - View:  services.msc
echo.
pause