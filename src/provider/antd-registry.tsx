// components/AntdRegistry.tsx
'use client'; // <-- ต้องมี 'use client'

import React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';
import "@ant-design/v5-patch-for-react-19";

const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = createCache();
  useServerInsertedHTML(() => {
    // ตรวจสอบว่า `cache` ไม่เป็น null/undefined ก่อนใช้ `extractStyle`
    if (cache) {
        return (
            <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
        );
    }
    return null; // หรือจัดการเคสนี้ตามความเหมาะสม
  });
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};

export default AntdRegistry; // <-- ต้อง export default