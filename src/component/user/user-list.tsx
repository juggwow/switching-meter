// src/app/admin/users/user-list.tsx
'use client';

import "@ant-design/v5-patch-for-react-19";
import React, { useState } from 'react';
import { Table, Space, Button, Pagination, App, Typography, Popconfirm, Input, Select, Tag } from 'antd'; // นำเข้า Components ที่จำเป็น
import type { ColumnsType } from 'antd/es/table'; // Type สำหรับ Column ของ Table
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // React Query Hooks
import dayjs from 'dayjs'; // สำหรับจัดการวันที่
import { fetchUsers, deleteUser } from './action'; // นำเข้า Server Actions
import { User } from '@prisma/client'; // นำเข้า Prisma User Type
import { ReloadOutlined, SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'; // นำเข้า Icons
import { userRoleEnum } from '@/shema/user-form';
import UserFormModal from './user-form-model';

const { Text, Title } = Typography;
const { Option } = Select;

// Type สำหรับข้อมูลแต่ละแถวในตาราง (ขยายจาก Prisma.User)
interface UserTableData extends User {
  key: string; // Ant Design Table ต้องการ key
  // คุณสมบัติอื่นๆ สืบทอดมาจาก User
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]; // ตัวเลือกสำหรับจำนวนรายการต่อหน้า

export default function UserListComponent() {
  const { message, modal } = App.useApp(); // สำหรับ Ant Design Messages และ Modal Context
  const queryClient = useQueryClient(); // สำหรับ invalidating queries

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchUsername, setSearchUsername] = useState(''); // State สำหรับค้นหาชื่อผู้ใช้งาน
  const [filterRole, setFilterRole] = useState<User['role'] | undefined>(undefined); // State สำหรับกรองตามบทบาท
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // State สำหรับจัดเรียง

  const [isModalOpen, setIsModalOpen] = useState(false); // สถานะเปิด/ปิด Modal
  const [editUserId, setEditUserId] = useState<string | null>(null); // เก็บ ID ของผู้ใช้งานที่กำลังแก้ไข (null ถ้าสร้างใหม่)

  // Query สำหรับดึงข้อมูลผู้ใช้งาน
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', currentPage, pageSize, searchUsername, filterRole, sortOrder], // Query Key ที่จะ trigger Refetch เมื่อค่าเหล่านี้เปลี่ยน
    queryFn: () => fetchUsers({ // เรียก Server Action
      page: currentPage,
      pageSize: pageSize,
      searchUsername,
      filterRole,
      sortOrder,
    }),
    staleTime: 0, // ทำให้ข้อมูลเก่าทันทีเมื่อถูก Fetch
    refetchOnMount: true, // Fetch ใหม่ทุกครั้งที่ Component Mount
    refetchOnWindowFocus: true, // Fetch ใหม่ทุกครั้งที่หน้าต่างได้รับ Focus
    placeholderData: (previousData) => previousData, // แสดงข้อมูลเก่าขณะกำลังโหลดใหม่
  });

  // Mutation สำหรับลบผู้ใช้งาน
  const deleteMutation = useMutation({
    mutationFn: deleteUser, // ใช้ deleteUser Server Action
    onSuccess: () => {
      message.success('ลบผู้ใช้งานสำเร็จ!');
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Refetch List ใหม่
    },
    onError: (error: any) => {
      message.error(`ลบผู้ใช้งานไม่สำเร็จ: ${error.message}`);
    },
  });

  if (isError) {
    message.error(`ไม่สามารถโหลดข้อมูลผู้ใช้งาน: ${error?.message || 'Unknown error'}`);
  }

  // เตรียมข้อมูลสำหรับ Ant Design Table
  const usersData: UserTableData[] =
    data?.users.map((user) => ({
      ...user,
      key: user.id, // Ant Design Table ต้องการ Key ที่ไม่ซ้ำกัน
      createdAt: new Date(user.createdAt), // แปลง ISO string กลับเป็น Date
      updatedAt: new Date(user.updatedAt), // แปลง ISO string กลับเป็น Date
    })) || [];

  // กำหนด Columns ของตาราง Ant Design
  const columns: ColumnsType<UserTableData> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: true, // สามารถเรียงลำดับได้ (ต้อง Implement Logic ใน fetchUsers)
    },
    {
      title: 'ชื่อ',
      dataIndex: 'displayname',
      key: 'displayname',
      sorter: true, // สามารถเรียงลำดับได้ (ต้อง Implement Logic ใน fetchUsers)
    },
    {
      title: 'บทบาท',
      dataIndex: 'role',
      key: 'role',
      render: (role: User['role']) => (
        <Tag color={role === 'ADMIN' ? 'gold' : (role === 'PEA' ? 'blue' : 'green')}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'สร้างเมื่อ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: true, // สามารถเรียงลำดับได้
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditUser(record.id)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="คุณแน่ใจหรือไม่?"
            description={`คุณต้องการลบผู้ใช้งาน "${record.username}" ใช่หรือไม่?`}
            onConfirm={() => handleDeleteUser(record.id)} // เรียก handleDeleteUser เมื่อยืนยัน
            okText="ใช่"
            cancelText="ไม่"
            placement="topRight"
          >
            <Button icon={<DeleteOutlined />} danger loading={deleteMutation.isPending}>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handler สำหรับเปลี่ยนหน้า Pagination
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // เปิด Modal สำหรับสร้างผู้ใช้งานใหม่
  const handleCreateUser = () => {
    setEditUserId(null); // ตั้งค่าเป็น null เพื่อระบุโหมดสร้าง
    setIsModalOpen(true);
  };

  // เปิด Modal สำหรับแก้ไขผู้ใช้งาน
  const handleEditUser = (id: string) => {
    setEditUserId(id); // ตั้งค่า ID ผู้ใช้งานสำหรับแก้ไข
    setIsModalOpen(true);
  };

  // ปิด Modal
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditUserId(null); // รีเซ็ต ID ผู้ใช้งานเมื่อ Modal ปิด
  };

  // Handler สำหรับลบผู้ใช้งาน
  const handleDeleteUser = (id: string) => {
    deleteMutation.mutate(id);
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h1>

      {/* ส่วน Filter และปุ่มสร้างผู้ใช้งานใหม่ */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
        <Space direction="vertical" size="middle" className="w-full sm:w-auto">
          <Input
            placeholder="ค้นหาชื่อผู้ใช้งาน"
            prefix={<SearchOutlined />}
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            onPressEnter={()=>refetch} // กด Enter เพื่อ Refetch
            className="w-full sm:w-auto"
          />
          <Select
            placeholder="กรองตามบทบาท"
            className="w-full sm:w-auto min-w-[150px]"
            allowClear // อนุญาตให้เคลียร์ค่าที่เลือก
            value={filterRole}
            onChange={(value: User['role'] | undefined) => setFilterRole(value)}
          >
            {/* Map ตัวเลือกจาก Zod Enum */}
            {userRoleEnum.options.map((role) => (
              <Option key={role} value={role}>{role}</Option>
            ))}
          </Select>
          <Button onClick={() => { setSearchUsername(''); setFilterRole(undefined); refetch(); }} icon={<ReloadOutlined />}>
            รีเซ็ตฟิลเตอร์
          </Button>
        </Space>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleCreateUser}>
          สร้างผู้ใช้งานใหม่
        </Button>
      </div>

      {/* ตารางผู้ใช้งาน */}
      <Table
        columns={columns}
        dataSource={usersData}
        loading={isLoading}
        pagination={false} // ปิด Pagination ของ Table เพราะเราใช้ Pagination ของ Ant Design เอง
        rowKey="id" // ใช้ id เป็น Key ของแถว
        scroll={{ x: 'max-content' }} // ทำให้ตารางเลื่อนแนวนอนได้ถ้ามีหลายคอลัมน์
      />

      {/* Pagination */}
      <div className="mt-6 flex justify-end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={data?.totalCount || 0}
          onChange={handlePageChange}
          showSizeChanger // แสดงตัวเลือกเปลี่ยนจำนวนรายการต่อหน้า
          pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)} // ตัวเลือกเป็น String
          showTotal={(total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`}
        />
      </div>

      {/* Modal สำหรับ Form ผู้ใช้งาน */}
      <UserFormModal
        open={isModalOpen}
        onCancel={handleModalClose}
        editUserId={editUserId}
      />
    </div>
  );
}