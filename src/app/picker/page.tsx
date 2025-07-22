'use client'

import MeterForm from "@/component/meter-form/picker-form";

export default function WarehousePage() {
  return (
    <div className="max-w-xl mx-auto mt-10" suppressHydrationWarning>
      <h1 className="text-xl font-bold mb-4">เบิกมิเตอร์ใหม่</h1>
      <MeterForm />
    </div>
  )
}
