// provider/antd-config-provider.tsx (เดิมคือ components/AntdConfigProviderWrapper.tsx)
'use client'

import {App, ConfigProvider, theme } from 'antd';
import React, { useState, useEffect, createContext, ReactNode } from 'react';
// Import useTheme hook จาก next-themes
import { useTheme } from 'next-themes';
import "@ant-design/v5-patch-for-react-19";

// ThemeContext นี้ยังคงมีประโยชน์ถ้าคุณต้องการ access isDarkMode ในคอมโพเนนต์อื่น ๆ ที่ใช้ Ant Design
interface ThemeContextType {
  isDarkMode: boolean; // ตอนนี้ isDarkMode จะสะท้อนจาก next-themes
  // toggleTheme: () => void; // ไม่จำเป็นต้องมีแล้ว ถ้าใช้ next-themes เป็นตัว toggle หลัก
}
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);



export default function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  if (typeof  window === "undefined"){
    return <>
        {children}   
    </>
  }
  const { theme: nextTheme, resolvedTheme } = useTheme(); // ใช้ useTheme จาก next-themes

  // isDarkMode ควรจะสะท้อนตาม resolvedTheme ของ next-themes
  // resolvedTheme จะเป็น 'light' หรือ 'dark'
  const isDarkMode = resolvedTheme === 'dark';

  // ลบ useEffect ที่จัดการ document.body.className ออกไป เพราะ next-themes จะเป็นผู้จัดการ
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     document.body.className = isDarkMode ? 'dark-mode-bg' : 'light-mode-bg';
  //   }
  // }, [isDarkMode]);

  // ถ้าคุณยังต้องการให้คอมโพเนนต์ Ant Design ของคุณเปลี่ยนตาม Dark Mode
  // ConfigProvider ยังคงจำเป็น
  console.log('resolve theme', resolvedTheme)
  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <ConfigProvider
        theme={{
          // ใช้ isDarkMode ที่ได้จาก next-themes มากำหนด algorithm ของ Ant Design
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}