// src/app/warehouse/filter-options.tsx
"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect } from "react";
import {
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Col,
  Row,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs"; // Dayjs สำหรับจัดการวันที่
import { FilterData } from "@/app/type/filter";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface FilterOptions {
  searchPeaNoNew?: string;
  searchPeaNoOld?: string;
  // เปลี่ยน pickerDateRange เป็น Dayjs | null สำหรับการใช้งานภายใน UI
  pickerDateRange?: [Dayjs | null, Dayjs | null];
  sortOrder?: "asc" | "desc";
}

// กำหนด Props Interface สำหรับ FilterOptionComponent
interface FilterOptionComponentProps {
  isPending?: boolean;
  mode?: "wait_installation" | "statuslist";
  initialFilters?: FilterData; // ค่า Filter เริ่มต้นจาก Parent
  onApplyFilters: (filters: FilterData) => void; // Callback เมื่อกด Apply
  onResetFilters: () => void; // Callback เมื่อกด Reset
}

export default function FilterOptionComponent({
  isPending,
  mode,
  initialFilters,
  onApplyFilters,
  onResetFilters,
}: FilterOptionComponentProps) {
  // State ภายในสำหรับเก็บค่า Filter
  const [peaNoNew, setPeaNoNew] = useState(
    initialFilters?.searchPeaNoNew || undefined
  );
  const [peaNoOld, setPeaNoOld] = useState(
    initialFilters?.searchPeaNoOld || undefined
  );
  const [ca, setCa] = useState(initialFilters?.searchCa || undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs(initialFilters?.pickerDateStart),
    dayjs(initialFilters?.pickerDateEnd),
  ]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    initialFilters?.sortOrder || "desc"
  );
  const [status, setStatus] = useState<
    "wait_installation" | "is_installed" | "picker_overdue" | "all" | undefined
  >();

  // ใช้ useEffect เพื่อ Sync State ภายในกับ initialFilters จาก Parent
  // เมื่อ initialFilters เปลี่ยน (เช่น กด Reset จาก Parent)
  useEffect(() => {
    setCa(initialFilters?.searchCa);
    setPeaNoNew(initialFilters?.searchPeaNoNew);
    setPeaNoOld(initialFilters?.searchPeaNoOld);
    let startDate = dayjs().add(-7, "day");
    let endDate = dayjs();
    if (initialFilters?.pickerDateStart) {
      startDate = dayjs(initialFilters?.pickerDateStart);
    }
    if (initialFilters?.pickerDateEnd) {
      endDate = dayjs(initialFilters?.pickerDateEnd);
    }
    setDateRange([startDate, endDate]);
    setSortOrder(initialFilters?.sortOrder || "desc");
    setStatus(initialFilters?.status || "all");

    mode == "wait_installation" && setStatus("wait_installation");
    mode == "wait_installation" && setPeaNoOld(undefined);
  }, [initialFilters]);

  // Handler เมื่อกดปุ่ม "ค้นหา"
  const handleApply = () => {
    onApplyFilters({
      searchPeaNoNew: peaNoNew || undefined,
      searchPeaNoOld: peaNoOld || undefined,
      searchCa: ca || undefined,
      // *** แปลง Dayjs เป็น Date ที่นี่ก่อนส่งไปยัง Parent ***
      pickerDateStart: dateRange[0] ? dateRange[0].toDate() : undefined,
      pickerDateEnd: dateRange[1] ? dateRange[1].toDate() : undefined,
      sortOrder: sortOrder,
      status: status,
    });
  };

  // Handler เมื่อกดปุ่ม "รีเซ็ต"
  const handleReset = () => {
    setPeaNoNew("");
    setPeaNoOld("");
    setCa("");
    setDateRange([null, null]); // รีเซ็ตช่วงวันที่
    setSortOrder("desc"); // รีเซ็ตลำดับการจัดเรียงเป็นค่าเริ่มต้น
    onResetFilters(); // เรียก Callback เพื่อให้ Parent รีเซ็ต State ด้วย
  };

  return (
    <div className="mb-6 p-4 rounded-lg">
      {" "}
      {/* เพิ่ม dark mode classes */}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row gutter={[16, 16]} align="bottom">
          {/* ช่องค้นหา ca */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Text strong className="dark:text-white">
              ca ผชฟ.
            </Text>
            <Input
              placeholder="ค้นหา ca ผชฟ."
              prefix={<SearchOutlined />}
              value={ca}
              onChange={(e) => setCa(e.target.value)}
            />
          </Col>
          {/* ช่องค้นหา PEA No. ใหม่ */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Text strong className="dark:text-white">
              PEA No. ใหม่
            </Text>
            <Input
              placeholder="ค้นหา PEA No. ใหม่"
              prefix={<SearchOutlined />}
              value={peaNoNew}
              onChange={(e) => setPeaNoNew(e.target.value)}
            />
          </Col>
          {/* ช่องค้นหา PEA No. เก่า */}
          {mode != "wait_installation" && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong className="dark:text-white">
                PEA No. เก่า
              </Text>
              <Input
                placeholder="ค้นหา PEA No. เก่า"
                prefix={<SearchOutlined />}
                value={peaNoOld}
                onChange={(e) => setPeaNoOld(e.target.value)}
              />
            </Col>
          )}
          {/* ช่องเลือกช่วงวันที่เบิก */}
          <Col xs={24} sm={12} md={8} lg={8}>
            <Text strong className="dark:text-white">
              วันที่เบิก (เริ่มต้น - สิ้นสุด)
            </Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [null, null])}
              style={{ width: "100%" }}
              format="DD/MM/YYYY" // รูปแบบการแสดงวันที่
            />
          </Col>
          {/* ช่องเลือกการจัดเรียง */}
          {mode != "wait_installation" && (
            <Col xs={24} sm={12} md={8} lg={4}>
              <Text strong className="dark:text-white">
                สถานะ
              </Text>
              <Select
                value={status}
                onChange={(value) => setStatus(value)}
                style={{ width: "100%" }}
              >
                <Option value="all">ทั้งหมด</Option>
                <Option value="wait_installation">รอติดตั้ง</Option>
                <Option value="is_installed">ติดตั้งแล้ว</Option>
                <Option value="picker_overdue">เบิกเกินกำหนด</Option>
              </Select>
            </Col>
          )}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong className="dark:text-white">
              จัดเรียงวันที่เบิก
            </Text>
            <Select
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
              style={{ width: "100%" }}
              suffixIcon={
                sortOrder === "asc" ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              }
            >
              <Option value="desc">ล่าสุดไปเก่าสุด</Option>
              <Option value="asc">เก่าสุดไปล่าสุด</Option>
            </Select>
          </Col>
        </Row>
        {/* ปุ่ม "รีเซ็ต" และ "ค้นหา" */}
        <Space
          style={{
            width: "100%",
            justifyContent: "flex-end",
            marginTop: "16px",
          }}
        >
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            รีเซ็ต
          </Button>
          <Button
            loading={isPending}
            type="primary"
            onClick={handleApply}
            icon={<SearchOutlined />}
          >
            ค้นหา
          </Button>
        </Space>
      </Space>
    </div>
  );
}
