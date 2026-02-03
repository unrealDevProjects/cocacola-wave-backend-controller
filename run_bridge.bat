@echo off
setlocal

rem Directorio del bat
set BASEDIR=%~dp0
cd /d "%BASEDIR%"

rem Archivo JS
set SCRIPT=%BASEDIR%bridge.js

if not exist "%SCRIPT%" (
    echo ERROR: bridge.js no encontrado
    echo %SCRIPT%
    exit /b 1
)

rem Ejecutar Node (ruta absoluta si no está en PATH)
where node >nul 2>&1
if errorlevel 1 (
    echo Node no se encuentra en PATH
    exit /b 1
)

node "%SCRIPT%"