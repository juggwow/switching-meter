// src/components/layout/Navbar.tsx
'use client'; // เป็น Client Component เพราะอาจมี interactive elements เช่น menu

import React from 'react';
import { Layout, Menu, Button, Space, theme, Badge } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons'; // เพิ่ม BellOutlined, UserOutlined
import Link from 'next/link';
import ThemeToggle from './theme-toggle';

const { Header } = Layout;

interface NavbarProps {
  appName?: string;
  userName?: string;
  notificationCount?: number;
}

export default function Navbar({
  appName = "Smart Switching", // Default app name
  userName = "สวัสดี, คุณสบายดี", // Default user name
  notificationCount = 3, // Default notification count
}: NavbarProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken(); // ใช้ Ant Design theme token

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px', // Padding ซ้ายขวา
        height: 64, // ความสูงมาตรฐานของ Header
        backgroundColor: colorBgContainer,
      }}
    >
      {/* Logo / App Name */}
      <div className="flex-shrink-0">
        <Link href="/" className="text-xl font-semibold whitespace-nowrap">
          {appName}
        </Link>
      </div>

      {/* User Info and Notifications */}
      <Space size="middle">
        {/* Notification Bell */}
        <ThemeToggle/>
        <Badge count={notificationCount} offset={[0, 0]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '20px' }} />}
            onClick={() => console.log("Notifications clicked")}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Badge>

        {/* User Name */}
        <span className=" text-base font-medium whitespace-nowrap hidden sm:inline">
          {userName}
        </span>
        {/* User Avatar/Icon (optional) */}
        <Button
          type="text"
          icon={<UserOutlined style={{ fontSize: '20px' }} />}
          onClick={() => console.log("User profile clicked")}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Space>
    </Header>
  );
}