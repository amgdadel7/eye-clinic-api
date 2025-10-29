# تشغيل البيانات الافتراضية لخمس عيادات
Write-Host "تشغيل البيانات الافتراضية لخمس عيادات..." -ForegroundColor Green
Write-Host ""

# التحقق من وجود XAMPP
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    Write-Host "خطأ: لم يتم العثور على XAMPP MySQL" -ForegroundColor Red
    Write-Host "تأكد من تثبيت XAMPP في المسار الافتراضي" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# تشغيل البيانات الافتراضية
Write-Host "تشغيل البيانات الافتراضية..." -ForegroundColor Yellow
try {
    & $mysqlPath -u root -p -e "SOURCE run_sample_data.sql;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "تم تشغيل البيانات الافتراضية بنجاح! ✓" -ForegroundColor Green
        Write-Host "تم إنشاء بيانات لخمس عيادات مع جميع البيانات المطلوبة" -ForegroundColor Green
    } else {
        throw "خطأ في تشغيل MySQL"
    }
} catch {
    Write-Host ""
    Write-Host "حدث خطأ أثناء تشغيل البيانات الافتراضية" -ForegroundColor Red
    Write-Host "تأكد من:" -ForegroundColor Yellow
    Write-Host "1. تشغيل XAMPP" -ForegroundColor Yellow
    Write-Host "2. صحة كلمة مرور MySQL" -ForegroundColor Yellow
    Write-Host "3. وجود قاعدة البيانات" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "اضغط Enter للخروج"

