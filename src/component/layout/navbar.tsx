// src/components/layout/Navbar.tsx
"use client";

import "@ant-design/v5-patch-for-react-19";
import React from "react";
import {
  Layout,
  Button,
  Space,
  theme,
  Badge,
  Avatar,
  Dropdown,
  Menu,
  MenuProps,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { ItemType } from "antd/es/menu/interface";
import MenuBar from "./menu";

const { Header } = Layout;

interface NavbarProps {
  appName?: string;
}

const items: MenuProps["items"] = [
  {
    key: "profile",
    label: (
      <Link href="/profile">
        <Space>
          <UserOutlined />
          ข้อมูลส่วนตัว
        </Space>
      </Link>
    ),
  },
  // Conditionally include this item. Filter out 'false' later.
  {
    key: "manage-users",
    label: (
      <Link href="/admin/users">
        <Space>
          <TeamOutlined />
          จัดการผู้ใช้งาน
        </Space>
      </Link>
    ),
  },
  {
    key: "settings",
    label: (
      <Link href="/settings">
        <Space>
          <SettingOutlined />
          ตั้งค่า
        </Space>
      </Link>
    ),
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    label: (
      <Space>
        <LogoutOutlined />
        ออกจากระบบ
      </Space>
    ),
    onClick: () => signOut({ callbackUrl: "/auth/login" }),
    danger: true,
  },
];

export default function Navbar({ appName = "Smart Switching" }: NavbarProps) {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isAdmin = isAuthenticated && session.user?.role === UserRole.ADMIN;

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 64,
        backgroundColor: "#1890ff",
      }}
    >
      {/* Logo / App Name */}
      <div className="flex-shrink-0">
        {/* <MenuBar /> */}
        <Link
          href="/"
          className="text-white text-xl font-semibold whitespace-nowrap"
        >
          {appName}
        </Link>
      </div>

      {/* User Info and Notifications */}
      <Space size="middle">
        {/* Theme Toggle Button */}

        {isAuthenticated ? (
          <>
            {/* Notification Bell (แสดงเมื่อ Login แล้ว) */}
            <Badge count={3} offset={[0, 0]}>
              <Button
                type="text"
                icon={
                  <BellOutlined style={{ color: "white", fontSize: "20px" }} />
                }
                onClick={() => console.log("Notifications clicked")}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Notifications"
              />
            </Badge>

            {/* User Dropdown */}
            {/* <Dropdown menu={{ items: items }} placement="bottomRight" arrow> 
              <Button
                type="text"
                style={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px',
                  color: 'white',
                }}
              >
                <Space>
                  {session.user?.image ? (
                    <Avatar src={session.user.image} size="small" />
                  ) : (
                    <Avatar icon={<UserOutlined />} size="small" />
                  )}
                  <span className="text-base font-medium whitespace-nowrap hidden sm:inline">
                    {session.user?.username || 'ผู้ใช้งาน'}
                  </span>
                </Space>
              </Button>
            </Dropdown> */}
            <Dropdown menu={{ items }}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  {session.user?.image ? (
                    <Avatar src={session.user.image} size="small" />
                  ) : (
                    <Avatar icon={<UserOutlined />} size="small" />
                  )}
                  <span className="text-base font-medium whitespace-nowrap hidden sm:inline">
                    {session.user?.username || 'ผู้ใช้งาน'}
                  </span>
                </Space>
              </a>
            </Dropdown>
          </>
        ) : (
          // แสดงปุ่ม Login เมื่อยังไม่ได้ Login
          <Link href="/auth/login">
            <Button type="text" style={{ color: "white" }}>
              เข้าสู่ระบบ
            </Button>
          </Link>
        )}
      </Space>
    </Header>
  );
}
