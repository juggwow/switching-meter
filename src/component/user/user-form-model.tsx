// src/app/admin/users/user-form-modal.tsx
'use client';

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, App } from 'antd'; // นำเข้า Ant Design Components
import { useForm, Controller } from 'react-hook-form'; // สำหรับ React Hook Form
import { zodResolver } from '@hookform/resolvers/zod'; // สำหรับ Zod Validator
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // สำหรับ React Query Mutations
import { createUser, updateUser, fetchUserById } from './action'; // นำเข้า Server Actions
import { UserFormData, userFormSchema, userRoleEnum } from '@/shema/user-form';

const { Option } = Select;

interface UserFormModalProps {
  open: boolean; // สถานะการเปิด/ปิด Modal
  onCancel: () => void; // Callback เมื่อปิด Modal
  editUserId: string | null; // ID ของผู้ใช้งานที่ต้องการแก้ไข (null ถ้าเป็นการสร้างใหม่)
}

export default function UserFormModal({ open, onCancel, editUserId }: UserFormModalProps) {
  const { message } = App.useApp(); // สำหรับแสดงข้อความแจ้งเตือนของ Ant Design
  const queryClient = useQueryClient(); // สำหรับ invalidating queries หลังจาก CRUD

  const {
    handleSubmit,
    control,
    reset, // สำหรับ Reset Form
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema), // ใช้ Zod ในการ Validate Form
    defaultValues: {
      username: '',
      role: 'PEA', // บทบาทเริ่มต้นสำหรับผู้ใช้งานใหม่
    },
  });

  // ใช้ useQuery เพื่อดึงข้อมูลผู้ใช้งานสำหรับแก้ไข (ถ้า editUserId มีค่า)
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', editUserId], // Query Key สำหรับดึงผู้ใช้งานคนเดียว
    queryFn: () => editUserId ? fetchUserById(editUserId) : Promise.resolve(null), // เรียก fetchUserById ถ้ามี ID
    enabled: !!editUserId && open, // Query จะทำงานก็ต่อเมื่ออยู่ในโหมดแก้ไขและ Modal เปิดอยู่
  });

  // Mutation สำหรับสร้างผู้ใช้งาน
  const createMutation = useMutation({
    mutationFn: createUser, // ใช้ createUser Server Action
    onSuccess: () => {
      message.success('สร้างผู้ใช้งานสำเร็จ! รหัสผ่านเริ่มต้นคือ "1-8"');
      onCancel(); // ปิด Modal
      queryClient.invalidateQueries({ queryKey: ['users'] }); // ทำให้ Query 'users' เก่า เพื่อให้ List Refetch ใหม่
      reset(); // เคลียร์ Form
    },
    onError: (error: any) => {
      message.error(`สร้างผู้ใช้งานไม่สำเร็จ: ${error.message}`);
    },
  });

  // Mutation สำหรับอัปเดตผู้ใช้งาน
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormData }) => updateUser(id, data), // ใช้ updateUser Server Action
    onSuccess: () => {
      message.success('อัปเดตผู้ใช้งานสำเร็จ!');
      onCancel(); // ปิด Modal
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Refetch user list
      queryClient.invalidateQueries({ queryKey: ['user', editUserId] }); // Invalidate Query ของผู้ใช้งานคนเดียวด้วย
      reset(); // เคลียร์ Form
    },
    onError: (error: any) => {
      message.error(`อัปเดียผู้ใช้งานไม่สำเร็จ: ${error.message}`);
    },
  });

  // ใช้ useEffect เพื่อ populate Form เมื่ออยู่ในโหมดแก้ไข และข้อมูลผู้ใช้งานโหลดเสร็จ
  useEffect(() => {
    if (editUserId && userData) {
      // ตั้งค่า Form ด้วยข้อมูลที่ดึงมา
      reset({
        username: userData.username,
        displayname: userData.displayname,
        role: userData.role,
      });
    } else if (!editUserId) {
      // รีเซ็ต Form เมื่อเปลี่ยนเป็นโหมดสร้างใหม่ หรือ Modal เปิดในโหมดสร้าง
      reset({
        username: '',
        displayname: '',
        role: 'PEA',
      });
    }
  }, [editUserId, userData, reset]); // Dependency array: รันเมื่อ editUserId, userData, reset เปลี่ยน

  // Handler เมื่อ Submit Form
  const onSubmit = (data: UserFormData) => {
    if (editUserId) {
      // ถ้ามี editUserId แสดงว่าเป็นการแก้ไข
      updateMutation.mutate({ id: editUserId, data });
    } else {
      // ถ้าไม่มี editUserId แสดงว่าเป็นการสร้างใหม่
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending; // สถานะ Loading สำหรับปุ่ม Submit
  const modalTitle = editUserId ? 'แก้ไขผู้ใช้งาน' : 'สร้างผู้ใช้งานใหม่'; // หัวข้อ Modal

  return (
    <Modal
      open={open}
      title={modalTitle}
      onCancel={onCancel}
      footer={null} // กำหนด footer เป็น null เพื่อสร้างปุ่มเอง
      maskClosable={!isSubmitting} // ไม่ให้ปิด Modal เมื่อกำลัง Submit
      keyboard={!isSubmitting} // ไม่ให้ปิด Modal ด้วย Keyboard เมื่อกำลัง Submit
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* Field: ชื่อผู้ใช้งาน */}
        <Form.Item
          label="Username"
          validateStatus={errors.username ? 'error' : ''}
          help={errors.username?.message}
          required
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => <Input {...field} placeholder="เช่น 501855" />}
          />
        </Form.Item>

        {/* Field: ชื่อผู้ใช้งาน */}
        <Form.Item
          label="ชื่อผู้ใช้งาน"
          validateStatus={errors.username ? 'error' : ''}
          help={errors.displayname?.message}
          required
        >
          <Controller
            name="displayname"
            control={control}
            render={({ field }) => <Input {...field} placeholder="เช่น นายระทวย คงควรคอย" />}
          />
        </Form.Item>

        {/* Field: บทบาท */}
        <Form.Item
          label="บทบาท"
          validateStatus={errors.role ? 'error' : ''}
          help={errors.role?.message}
          required
        >
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select {...field} placeholder="เลือกบทบาท">
                {userRoleEnum.options.map((role) => (
                  <Option key={role} value={role}>
                    {role}
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        {/* ปุ่ม Submit และ Cancel */}
        <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {editUserId ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้งาน'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}