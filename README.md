# 🏫 Kru J Classroom

ระบบติดตามงานนักเรียนออนไลน์ สำหรับครูและนักเรียน

## วิธี Deploy บน Vercel (ไม่ต้องใช้ Terminal)

### ขั้นตอนที่ 1: เตรียมไฟล์
1. แตกไฟล์ ZIP นี้ออกมา
2. จะได้โฟลเดอร์ชื่อ `kru-j-classroom`

### ขั้นตอนที่ 2: ใส่ API Key
เปิดไฟล์ `.env.local` แล้วแก้ไข:
```
NEXT_PUBLIC_SUPABASE_URL=https://ceislniajoqzmgbxmvip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ใส่_publishable_key_ของคุณครูที่นี่
```

### ขั้นตอนที่ 3: สร้าง Storage Bucket ใน Supabase
1. ไปที่ Supabase → Storage
2. กด "New bucket" → ตั้งชื่อ `assignments`
3. เปิด "Public bucket" → กด Save

### ขั้นตอนที่ 4: Upload ไปที่ GitHub
1. สมัคร github.com
2. กด "New repository" → ตั้งชื่อ `kru-j-classroom`
3. ลาก/วางโฟลเดอร์ทั้งหมดขึ้นไป
4. กด "Commit changes"

### ขั้นตอนที่ 5: Deploy บน Vercel
1. ไปที่ vercel.com → Login ด้วย GitHub
2. กด "Add New Project" → เลือก repo `kru-j-classroom`
3. ไปที่ "Environment Variables" ใส่:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL ของคุณครู
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Key ของคุณครู
4. กด Deploy → รอ 2-3 นาที
5. ได้ลิงก์เว็บแล้ว! แชร์ให้นักเรียนได้เลย

## การใช้งาน

### ครู
- Login ด้วยรหัสที่สร้างในระบบ (role: teacher)
- สร้างงาน เลือกห้องเรียน กำหนดวันส่ง
- ตรวจงาน ให้คะแนน เขียน feedback
- ดูรายชื่อนักเรียนที่ยังไม่ส่ง

### นักเรียน
- Login ด้วยรหัสนักเรียน
- ดูงานที่ต้องส่ง
- อัปโหลดไฟล์ PDF/Word/รูปภาพ
- ดูคะแนนและ feedback

### เพิ่มนักเรียนเข้าระบบ
ไปที่ Dashboard ครู → แท็บ "จัดการผู้ใช้" → กรอกข้อมูลนักเรียน

## บัญชีทดสอบ
สร้างผ่านแท็บ "จัดการผู้ใช้" ในหน้าครู
