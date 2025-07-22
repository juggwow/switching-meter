// src/components/ThemeToggle.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons'; // Icon สำหรับโหมดสว่าง/มืด
import { useTheme } from 'next-themes'; // นำเข้า useTheme จาก next-themes

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme(); // ดึง theme state จาก next-themes
  const [mounted, setMounted] = useState(false); // ใช้เพื่อจัดการ Hydration Mismatch

  // useEffect จะรันเฉพาะฝั่ง Client เท่านั้น
  useEffect(() => {
    setMounted(true); // เมื่อ component mount บน Client แล้ว ให้ตั้งค่า mounted เป็น true
  }, []);

  // ถ้ายังไม่ mounted (คือตอน SSR หรือตอน Render ครั้งแรกสุดบน Client)
  // ให้แสดงปุ่ม Placeholder หรืออะไรก็ได้ที่ไม่ใช่ปุ่มจริง เพื่อหลีกเลี่ยง Hydration Error
  if (!mounted) {
    return (
      <Button
        type="text"
        icon={<SunOutlined style={{ color: 'white', fontSize: '20px' }} />} // แสดงไอคอนเริ่มต้น (เช่น ดวงอาทิตย์)
        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        disabled // ปิดการใช้งานชั่วคราว
        aria-label="Toggle theme placeholder"
      />
    );
  }

  // เมื่อ mounted แล้ว ค่อยแสดงปุ่มจริง
  // resolvedTheme จะเป็น 'light' หรือ 'dark'
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="text"
      // เปลี่ยน icon ตามโหมด: ถ้าเป็น Dark -> แสดง Sun (เปลี่ยนเป็น Light), ถ้าเป็น Light -> แสดง Moon (เปลี่ยนเป็น Dark)
      icon={isDark ? <SunOutlined style={{fontSize: '20px' }} /> : <MoonOutlined style={{fontSize: '20px' }} />}
      // เมื่อคลิก ให้สลับธีม
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label="Toggle theme" // สำหรับ Accessibility
    />
  );
}