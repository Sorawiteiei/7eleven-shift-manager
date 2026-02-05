# 📱 สร้างแอป Android - คู่มือ

## 📋 Requirements

ก่อนสร้างไฟล์ APK คุณต้องติดตั้ง:

1. **Android Studio** - [ดาวน์โหลด](https://developer.android.com/studio)
2. **Java JDK 17+** - [ดาวน์โหลด](https://adoptium.net/)

## 🚀 ขั้นตอนการสร้าง APK

### ขั้นตอนที่ 1: Sync โค้ดเว็บไปยัง Android

```bash
npm run cap:sync
```

### ขั้นตอนที่ 2: เปิด Project ใน Android Studio

```bash
npm run cap:open:android
```

หรือเปิด Android Studio แล้วเลือก:
- File > Open
- เลือกโฟลเดอร์: `7eleven-shift-app/android`

### ขั้นตอนที่ 3: Build APK

ใน Android Studio:

1. รอให้ Gradle sync เสร็จ (อาจใช้เวลา 2-5 นาที)
2. เลือก **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. รอ build เสร็จ
4. คลิก **locate** เพื่อหาไฟล์ APK

ไฟล์ APK จะอยู่ที่:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### ขั้นตอนที่ 4: ติดตั้งบนมือถือ Android

1. คัดลอกไฟล์ `app-debug.apk` ไปยังมือถือ
2. เปิดไฟล์ APK บนมือถือ
3. อนุญาต "Unknown Sources" ถ้าระบบถาม
4. ติดตั้งแอป

## 🔧 การสร้าง Release APK (สำหรับลง Play Store)

### สร้าง Signing Key

```bash
keytool -genkey -v -keystore 7eleven-shift.keystore -alias 7eleven -keyalg RSA -keysize 2048 -validity 10000
```

### ตั้งค่า Signing

สร้างไฟล์ `android/app/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=7eleven
storeFile=../7eleven-shift.keystore
```

### Build Release APK

ใน Android Studio:
1. Build > Generate Signed Bundle / APK
2. เลือก APK
3. ใส่ข้อมูล Keystore
4. เลือก release
5. Build

## 📱 การทดสอบบน Emulator

1. เปิด Android Studio
2. Device Manager > Create Device
3. เลือก Pixel 6 หรือ device อื่น
4. ดาวน์โหลด System Image (แนะนำ API 34)
5. กด Run เพื่อทดสอบแอป

## 🔄 การอัพเดทแอป

เมื่อแก้ไขโค้ดเว็บ ให้รัน:

```bash
npm run cap:sync
npm run cap:open:android
```

แล้ว Build APK ใหม่

## ⚠️ ข้อควรรู้

### Server Address

ถ้าแอปต้องเชื่อมต่อกับ Backend Server คุณต้อง:

1. **Deploy Server** ไปยัง Cloud (เช่น Railway, Render, Heroku)
2. **หรือใช้ localhost** - ใช้ IP ของคอมพิวเตอร์แทน `localhost`

### การตั้งค่า Server URL

แก้ไขไฟล์ `frontend/js/auth.js`:
```javascript
// เปลี่ยนจาก
const API_URL = 'http://localhost:3000/api';

// เป็น
const API_URL = 'https://your-server.com/api';
// หรือ
const API_URL = 'http://192.168.1.xxx:3000/api';  // IP ของคอมพิวเตอร์
```

## 📞 Support

หากมีปัญหา ให้ตรวจสอบ:
- Android Studio Logcat สำหรับ errors
- Console ใน Chrome DevTools (chrome://inspect)
