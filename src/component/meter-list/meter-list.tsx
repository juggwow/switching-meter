"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState } from "react";
import {
  Card,
  Space,
  Button,
  Pagination,
  Typography,
  Col,
  Row,
  Image,
  message,
  theme,
} from "antd"; // เพิ่ม Image component
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { fetchMeters, FetchMetersResult } from "./action";
import Link from "next/link";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import FilterOptionComponent from "../layout/filter-option";
import { FilterData } from "@/app/type/filter";

const { Text, Title } = Typography;

// กำหนด Type ของข้อมูลสำหรับแต่ละแถว (เหมือนเดิม)
interface MeterTableData {
  key: string;
  id: string;
  peaNoNew: string;
  pickerName: string;
  pickerDate: Date;
  newMeterImageUrl: string;
  peaNoOld?: string | null;
  oldMeterImageUrl?: string | null;
  installationDate?: Date | null;
  installationName?: string | null;
  unitOld?: number | null;
  unitNew?: number | null;
  installationLocation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function MeterListComponent({
  mode,
}: {
  mode: "wait_installation" | "statuslist";
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [filter, setFilter] = useState<FilterData>({
    status: "wait_installation",
    sortOrder: "desc",
  });

  const { token } = theme.useToken(); // ดึง theme token

  const { data, isLoading, isError, error, isRefetching } = useQuery<
    FetchMetersResult,
    Error
  >({
    queryKey: [
      "wait_installation",
      currentPage,
      pageSize,
      filter.status,
      filter.searchPeaNoNew,
      filter.searchPeaNoOld,
      filter.pickerDateStart?.toISOString(), // Date -> ISO string
      filter.pickerDateEnd?.toISOString(), // Date -> ISO string
      filter.sortOrder,
    ],
    queryFn: () =>
      fetchMeters({
        page: currentPage,
        pageSize: pageSize,
        filter,
      }),
    staleTime: 5 * 1000, // Makes data always stale, so it refetches on mount/queryKey changes
    refetchOnMount: true, // Explicitly refetch on component mount
    refetchOnWindowFocus: true, // <--- เพิ่มบรรทัดนี้
    placeholderData: (previousData) => previousData,
  });

  if (isError) {
    message.error(
      `ไม่สามารถโหลดข้อมูลมิเตอร์: ${error?.message || "Unknown error"}`
    );
  }

  const metersData =
    data?.meters.map((meter) => {
      let status = "wait_installation";
      let color = "#000000";

      switch (status) {
        case "wait_installation":
          color = "#b4fcb4";
          break;
        case "is_installed":
          color = "#b4fcb4";
          break;
        case "picker_overdue":
          color = "#fcb4b4";
          break;
      }
      return {
        ...meter,
        key: meter.id,
        pickerDate: new Date(meter.pickerDate),
        installationDate: meter.installationDate
          ? new Date(meter.installationDate)
          : null,
        createdAt: new Date(meter.createdAt),
        updatedAt: new Date(meter.updatedAt),
        status,
        color,
      };
    }) || [];

  console.log(metersData);
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };
  if (isLoading) {
    <p className="text-center">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="p-6 max-w-[90%] mx-auto">
      <h1 className="text-2xl font-bold mb-6">รายการมิเตอร์</h1>
      <FilterOptionComponent
        isPending={isRefetching}
        mode={mode}
        initialFilters={filter}
        onApplyFilters={(filter) => setFilter(filter)}
        onResetFilters={() => {}}
      />

      {isLoading ? (
        <p className="text-center">กำลังโหลดข้อมูล...</p>
      ) : (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          {" "}
          {/* ใช้ Space direction="vertical" เพื่อเรียง Card ลงมา */}
          {metersData.length > 0 ? (
            metersData.map((meter) => (
              <Card
                key={meter.id}
                hoverable
                className="meter-list-card" // เพิ่ม className สำหรับ custom style
                style={{
                  borderLeft:
                    mode == "statuslist" ? `4px solid ${meter.color}`:undefined, // 4px solid สีฟ้าหลักของ Ant Design
                  borderRadius: "8px",
                  width: "100%", // ทำให้ Card เต็มความกว้างของ parent (Column เดียว)
                }}
              >
                <Row wrap={false} align="middle">
                  {" "}
                  {/* ใช้ Row wrap={false} เพื่อให้รูปและข้อมูลอยู่คนละคอลัมน์และไม่ขึ้นบรรทัดใหม่ */}
                  <Col flex="100px" className="card-image-col">
                    {" "}
                    {/* กำหนดความกว้างของคอลัมน์รูปภาพ */}
                    {meter.newMeterImageUrl ? (
                      <Image
                        alt="มิเตอร์ใหม่"
                        src={meter.newMeterImageUrl}
                        style={{
                          width: "100%",
                          height: "100px", // กำหนดความสูงของรูปภาพ
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "200px",
                          backgroundColor: "#f0f2f5",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderTopLeftRadius: "8px",
                          borderBottomLeftRadius: "8px",
                        }}
                      >
                        ไม่มีรูปมิเตอร์ใหม่
                      </div>
                    )}
                  </Col>
                  <Col flex="auto" style={{ padding: "16px" }}>
                    {" "}
                    {/* คอลัมน์ข้อมูล ใช้ flex="auto" เพื่อให้ขยายเต็มที่เหลือ */}
                    <Card.Meta
                      title={
                        <Space direction="vertical" size={4} className="w-full">
                          <Text strong>
                            <TagOutlined /> PEA ใหม่: {meter.peaNoNew}
                          </Text>
                          {mode == "statuslist" && (
                            <Text type="secondary">
                              <TagOutlined /> PEA เก่า: {meter.peaNoOld || "-"}
                            </Text>
                          )}
                        </Space>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={4}
                          className="w-full text-left"
                        >
                          <Text>
                            <UserOutlined /> ผู้เบิก: {meter.pickerName}
                          </Text>
                          <Text>
                            <CalendarOutlined /> เบิกเมื่อ:{" "}
                            {dayjs(meter.pickerDate).format("DD/MM/YYYY HH:mm")}
                          </Text>
                          {mode == "statuslist" && (
                            <Text>
                              <DollarOutlined /> หน่วยเก่า:{" "}
                              {meter.unitOld !== null
                                ? meter.unitOld.toFixed(2)
                                : "-"}
                            </Text>
                          )}
                          {mode == "statuslist" && (
                            <Text>
                              <DollarOutlined /> หน่วยใหม่:{" "}
                              {meter.unitNew !== null
                                ? meter.unitNew.toFixed(2)
                                : "-"}
                            </Text>
                          )}
                          {mode == "statuslist" && meter.installationName && (
                            <Text>
                              <UserOutlined /> ผู้ติดตั้ง:{" "}
                              {meter.installationName}
                            </Text>
                          )}
                          {mode == "statuslist" && meter.installationDate && (
                            <Text>
                              <CalendarOutlined /> ติดตั้งเมื่อ:{" "}
                              {dayjs(meter.installationDate).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </Text>
                          )}
                          {mode == "statuslist" &&
                            meter.installationLocation && (
                              <Text>
                                <EnvironmentOutlined /> ตำแหน่ง:{" "}
                                {meter.installationLocation}
                              </Text>
                            )}
                        </Space>
                      }
                    />
                  </Col>
                </Row>
                <div
                  style={{
                    padding: "8px 16px",
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Link href={`/installation/${meter.id}`}>
                    <Button type="link">
                      {meter.peaNoOld
                        ? "แก้ไขข้อมูลสับเปลี่ยน"
                        : "สับเปลี่ยน/ติดตั้ง"}
                    </Button>
                  </Link>
                  {!meter.peaNoOld && mode == "statuslist" && (
                    <Link href={`/picker/${meter.id}`}>
                      <Button type="link">แก้ไขข้อมูลการเบิก</Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-lg text-gray-500 w-full mt-8">
              ไม่พบข้อมูลมิเตอร์
            </div>
          )}
        </Space>
      )}

      <div className="mt-6 flex justify-end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={data?.totalCount || 0}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} จาก ${total} รายการ`
          }
        />
      </div>
    </div>
  );
}
