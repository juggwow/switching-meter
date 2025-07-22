"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMeter } from "@/component/meter-form/action";
import InstallationForm from "@/component/meter-form/installation-form";

export default function MeterEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ใน Client Components, `params` จะเป็น Promise
  // เราใช้ React.use() เพื่อ unwrap ค่าออกมา ซึ่งเป็นวิธีที่แนะนำ
  const { id } = use(params);

  const {
    data: meter,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["meter", id],
    queryFn: () => getMeter(id),
    enabled: !!id, // Query จะทำงานเมื่อมี id แล้วเท่านั้น
  });

  if (isLoading) {
    return <div>กำลังโหลด...</div>;
  }

  if (isError || !meter) {
    return <div>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10" suppressHydrationWarning>
      <h1 className="text-xl font-bold mb-4">ติดตั้ง/สับเปลี่ยนมิเตอร์</h1>
      <InstallationForm meter={meter} />
    </div>
  );
}
