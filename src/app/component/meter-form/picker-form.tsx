"use client";

import "@ant-design/v5-patch-for-react-19";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { submitMeterForm, updateMeterForm } from "./action";
import {
  message,
  Form,
  Input,
  Button,
  Upload,
  DatePicker,
  UploadProps,
  UploadFile,
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeterFormData, meterFormSchema } from "@/shema/meter-form";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Meter } from "@prisma/client";

// Helper function to convert image URL to a File object
const urlToFile = async (
  url: string,
  filename: string,
  mimeType?: string
): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type });
};

export default function PickerMeterFormComponent({ meter }: { meter?: Meter }) {
  const router = useRouter();
  const {
    handleSubmit,
    resetField,
    setValue,
    watch,
    formState: { errors },
    control,
  } = useForm<MeterFormData>({
    resolver: zodResolver(meterFormSchema),
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isRemoveImage, setIsRemoveImage] = useState(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file.originFileObj as Blob);
      });
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = (info) => {
    setFileList(info.fileList);
    if (info.file.status == "removed") {
      // ใช้ setValue เพื่อล้างค่า field และ trigger validation ใหม่อีกครั้ง
      // ทำให้แน่ใจว่าฟอร์มจะ invalid ถ้าไม่มีรูปภาพ
      setValue("newMeterPhoto", undefined as any, { shouldValidate: true });
      setIsRemoveImage(true);
    } else if (info.fileList.length > 0 && info.fileList[0].originFileObj) {
      setValue("newMeterPhoto", info.fileList[0].originFileObj);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: MeterFormData) =>
      meter
        ? updateMeterForm(meter.id, data, isRemoveImage)
        : submitMeterForm(data),
    onSuccess: async (data) => {
      try {
        // message.success() จะคืนค่าเป็น Promise
        // เราสามารถ await เพื่อรอให้มันทำงานเสร็จ
        // และเพื่อให้แน่ใจว่าผู้ใช้เห็นข้อความก่อนที่จะเกิดการ redirect
        await message.success("บันทึกข้อมูลเรียบร้อยแล้ว!");
      } catch (error) {
        // ในกรณีที่ message.success มีปัญหา (เช่น context หาย)
        // เราจะจับ error ไว้เพื่อไม่ให้แอปพัง และแสดง log ใน console
        console.error("Ant Design message failed to display:", error);
      }

      // หน่วงเวลา 1.5 วินาทีก่อนเปลี่ยนหน้า
      setTimeout(() => {
        router.push(`/`);
      }, 500);
    },
  });

  const onSubmit = (data: MeterFormData) => {
    mutation.mutate(data);
  };

  const handleBeforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('คุณสามารถอัปโหลดไฟล์ JPG/PNG เท่านั้น!');
      return Upload.LIST_IGNORE;
    }

    const isLt10M = file.size / 1024 / 1024 < 4; // ตรวจสอบขนาดไฟล์ก่อนบีบอัด
    if (!isLt10M) {
      message.error('ขนาดรูปภาพต้องไม่เกิน 4MB!');
      return Upload.LIST_IGNORE;
    }

    return false
  }

  useEffect(() => {
    if (meter) {
      // --- โหมดแก้ไข ---
      setValue("peaNoNew", meter.peaNoNew);
      setValue("issuerName", meter.pickerName);
      setValue("issueDate", meter.pickerDate);

      // ถ้ามีรูปภาพเดิม, ให้แสดงใน Upload component
      if (meter.newMeterImageUrl) {
        const fileForList: UploadFile = {
          uid: meter.id, // ใช้ ID ของ meter เป็น unique id
          name: "รูปมิเตอร์เดิม.jpg",
          status: "done",
          url: meter.newMeterImageUrl,
        };
        setFileList([fileForList]);

        // แปลง URL เป็น File object เพื่อให้ validation ของ react-hook-form ผ่าน
        urlToFile(meter.newMeterImageUrl, "existing-image.jpg").then(
          (fileObject) => {
            setValue("newMeterPhoto", fileObject, { shouldValidate: true });
          }
        );
      }
    } else {
      // --- โหมดสร้างใหม่ ---
      setValue("issueDate", new Date());
    }
  }, [meter]);

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit(onSubmit)}
      className="max-w-xl mx-auto mt-10 rounded shadow-md"
      style={{ padding: "24px" }}
    >
      <Form.Item
        label="PEA No. มิเตอร์ใหม่"
        validateStatus={errors.peaNoNew ? "error" : ""}
        help={errors.peaNoNew?.message}
      >
        <Controller
          name="peaNoNew"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={handleBeforeUpload}
        accept="image/jpeg,image/png"
        openFileDialogOnClick={fileList.length < 1}
      >
        {fileList.length < 1 && (
          <div>
            <UploadOutlined />
            <span>อัปโหลด</span>
          </div>
        )}
      </Upload>
      <Modal
        open={previewOpen}
        title="รูปตัวอย่าง"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width="100vw"
        styles={{ body: { maxHeight: "100vh", overflow: "auto" } }}
      >
        {/* แสดงรูปภาพขนาดเต็ม และจัดให้อยู่ตรงกลาง */}
        <img
          alt="preview"
          style={{ margin: "auto", display: "block" }}
          src={previewImage}
        />
      </Modal>
      <Form.Item
        label={<span className="mt-3">ชื่อผู้เบิก</span>}
        validateStatus={errors.issuerName ? "error" : ""}
        help={errors.issuerName?.message}
        className="mt-3"
      >
        <Controller
          name="issuerName"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Form.Item label="วันที่-เวลาเบิก">
        <DatePicker
          showTime
          // value ควบคุมโดย react-hook-form จึงไม่จำเป็นต้องใช้ defaultValue
          value={watch("issueDate") ? dayjs(watch("issueDate")) : null}
          onChange={(date) => {
            if (date) setValue("issueDate", date.toDate());
          }}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item className="flex flex-row justify-end">
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {meter ? "แก้ไข" : "บันทึก"}
        </Button>
      </Form.Item>
    </Form>
  );
}
