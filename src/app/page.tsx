// src/app/page.tsx
'use client'; // เป็น Client Component เพราะมี Interactive elements

import React from 'react';
import { Card, Col, Row, Typography, Space } from 'antd';
import {
  InboxOutlined, // สำหรับ "เบิกมิเตอร์ใหม่" (กล่องพัสดุ)
  ToolOutlined, // สำหรับ "ติดตั้ง/สับเปลี่ยนมิเตอร์" (เครื่องมือ)
  CheckCircleOutlined, // สำหรับ "ตรวจสอบสถานะมิเตอร์" (ติ๊กถูก)
  SettingOutlined, // สำหรับ "ตั้งค่า/อื่นๆ" (เฟือง)
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

// ข้อมูลสำหรับแต่ละ Card
const dashboardItems = [
  {
    icon: <InboxOutlined />,
    title: "เบิกมิเตอร์ใหม่",
    description: "บันทึกข้อมูลการเบิกมิเตอร์",
    link: "/picker", // ลิงก์ไปยังหน้า Form เบิกมิเตอร์ใหม่ของคุณ
  },
  {
    icon: <ToolOutlined />,
    title: "ติดตั้ง/สับเปลี่ยนมิเตอร์",
    description: "บันทึกข้อมูลการติดตั้งมิเตอร์",
    link: "/installation", // ลิงก์ไปยังหน้า Form ติดตั้ง/สับเปลี่ยน (สมมติว่าเป็น /installation/new)
  },
  {
    icon: <CheckCircleOutlined />,
    title: "ตรวจสอบสถานะมิเตอร์",
    description: "ดูสถานะและประวัติมิเตอร์",
    link: "/list", // ลิงก์ไปยังหน้าตาราง MeterList ของคุณ
  },
  {
    icon: <SettingOutlined />,
    title: "ตั้งค่า / อื่นๆ",
    description: "จัดการการตั้งค่าระบบ",
    link: "/", // ลิงก์ไปยังหน้าตั้งค่า (สมมติว่าเป็น /settings)
  },
];

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto mt-10"> {/* ปรับ padding และ background color */}
      <Row gutter={[12, 12]} justify="center" align="middle"> {/* จัดให้อยู่กึ่งกลางหน้า */}
        {dashboardItems.map((item, index) => (
          <Col key={index} xs={24} sm={12} > {/* Responsive columns */}
            <Link href={item.link} passHref>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                  {item.icon}
                </div>
                <Title level={5} style={{ marginBottom: '4px' }}>
                  {item.title}
                </Title>
                <Text type="secondary">
                  {item.description}
                </Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}