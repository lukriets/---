@echo off
setlocal enabledelayedexpansion

rem === Настройка ===
rem Укажите прямую ссылку на zip-архив репозитория.
rem Пример для GitHub:
rem https://github.com/USER/REPO/archive/refs/heads/main.zip
set "REPO_ZIP_URL="

if "%REPO_ZIP_URL%"=="" (
  echo [ОШИБКА] Укажите ссылку в переменной REPO_ZIP_URL внутри файла download.bat
  echo Пример: https://github.com/USER/REPO/archive/refs/heads/main.zip
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "TMP_DIR=%SCRIPT_DIR%_tmp_download"
set "ZIP_PATH=%TMP_DIR%\repo.zip"

if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%"

echo Скачивание архива...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '%REPO_ZIP_URL%' -OutFile '%ZIP_PATH%'"
if errorlevel 1 (
  echo [ОШИБКА] Не удалось скачать архив.
  exit /b 1
)

echo Распаковка...
powershell -NoProfile -Command "Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%TMP_DIR%' -Force"
if errorlevel 1 (
  echo [ОШИБКА] Не удалось распаковать архив.
  exit /b 1
)

for /d %%D in ("%TMP_DIR%\*") do set "EXTRACT_DIR=%%~fD"

if not defined EXTRACT_DIR (
  echo [ОШИБКА] Не найдено распакованной папки.
  exit /b 1
)

echo Копирование файлов в папку скрипта...
powershell -NoProfile -Command "Copy-Item -Path '%EXTRACT_DIR%\*' -Destination '%SCRIPT_DIR%' -Recurse -Force"
if errorlevel 1 (
  echo [ОШИБКА] Не удалось скопировать файлы.
  exit /b 1
)

rmdir /s /q "%TMP_DIR%"

echo Готово!
endlocal
