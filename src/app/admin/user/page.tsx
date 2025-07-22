// src/app/admin/users/page.tsx
import React from 'react';
import { App } from 'antd'; // นำเข้า App Component เพื่อใช้ Message Context
import UserListComponent from '@/component/user/user-list';

export const metadata = {
  title: 'จัดการผู้ใช้งาน - แอดมิน',
  description: 'หน้าสำหรับผู้ดูแลระบบในการจัดการผู้ใช้งาน',
};

export default function AdminUsersPage() {
  return (
    // App Component ของ Ant Design จำเป็นสำหรับ Message/Notification/Modal Context
    // ต้องครอบ Client Component ที่ใช้ Hook เหล่านี้
    <App>
      <UserListComponent />
    </App>
  );
}