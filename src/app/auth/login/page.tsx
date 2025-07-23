// src/app/auth/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, App, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react'; // นำเข้า signIn function
import { useRouter, useSearchParams } from 'next/navigation'; // สำหรับ Router และ Query Params
import { Suspense } from 'react'
import Link from 'next/link';

const { Title, Text } = Typography;

function LoginPage(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const {data:session} = useSession()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ดึง callbackUrl จาก Query Params (ถ้ามี)
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const onFinish = async (values: any) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false, // ไม่ให้ NextAuth redirect อัตโนมัติ เราจะจัดการเอง
        username: values.username,
        password: values.password,
      });

      if (result?.error) {
        // มี Error เกิดขึ้นจากการ Login
        setError(result.error);
        message.error(`เข้าสู่ระบบไม่สำเร็จ: ${result.error}`);
      } else {
        // Login สำเร็จ
        message.success('เข้าสู่ระบบสำเร็จ!');
        router.push(callbackUrl); // Redirect ไปยังหน้าที่ต้องการ
      }
    } catch (err: any) {
      // ข้อผิดพลาดอื่นๆ ที่อาจเกิดขึ้น
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก');
      message.error(`เข้าสู่ระบบไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(session) router.push('/')  
  })

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5', // Light background for login page
    }}>
      <Card
        title={<Title level={2} style={{ textAlign: 'center', marginBottom: '0' }}>เข้าสู่ระบบ</Title>}
        variant="outlined"
        style={{ width: 350, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้งาน!' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="ชื่อผู้ใช้งาน"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="รหัสผ่าน"
              size="large"
            />
          </Form.Item>

          {error && (
            <Form.Item>
              <Text type="danger">{error}</Text>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" block size="large" loading={loading}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text>
            ยังไม่มีบัญชี? <Link href="/auth/register">สมัครสมาชิก</Link> {/* ถ้ามีหน้าสมัครสมาชิก */}
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default function SuspenseLoginPage() {
  return (
    // You could have a loading skeleton as the `fallback` too
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}