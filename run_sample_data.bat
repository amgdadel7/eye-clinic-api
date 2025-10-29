@echo off
echo تشغيل البيانات الافتراضية لخمس عيادات...
echo.

REM التحقق من وجود XAMPP
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo خطأ: لم يتم العثور على XAMPP MySQL
    echo تأكد من تثبيت XAMPP في المسار الافتراضي
    pause
    exit /b 1
)

REM تشغيل البيانات الافتراضية
echo تشغيل البيانات الافتراضية...
"C:\xampp\mysql\bin\mysql.exe" -u root -p < run_sample_data.sql

if %errorlevel% equ 0 (
    echo.
    echo تم تشغيل البيانات الافتراضية بنجاح! ✓
    echo تم إنشاء بيانات لخمس عيادات مع جميع البيانات المطلوبة
) else (
    echo.
    echo حدث خطأ أثناء تشغيل البيانات الافتراضية
    echo تأكد من:
    echo 1. تشغيل XAMPP
    echo 2. صحة كلمة مرور MySQL
    echo 3. وجود قاعدة البيانات
)

echo.
pause

