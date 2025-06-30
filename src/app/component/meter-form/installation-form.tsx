import {
  InstallationFormData,
  installationFormSchema,
} from "@/shema/instaltion-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  Input,
  Upload,
  Modal,
  DatePicker,
  Button,
  UploadFile,
  message,
  UploadProps,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { UploadOutlined } from "@ant-design/icons";
import { Meter } from "@prisma/client";
import { submitInstallationForm } from "./action";

import dynamic from "next/dynamic";

// Dynamic import เพื่อไม่ให้แผนที่ถูกเรนเดอร์ฝั่ง Server (ป้องกัน error)
const LocationMap = dynamic(() => import("../map/location-map"), {
  ssr: false,
  loading: () => <p>กำลังโหลดแผนที่...</p>,
});

const urlToFile = async (
  url: string,
  filename: string,
  mimeType?: string
): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type });
};

export default function InstallationFormComponent({ meter }: { meter: Meter }) {
  const {
    handleSubmit,
    resetField,
    setValue,
    watch,
    formState: { errors },
    control,
  } = useForm<InstallationFormData>({
    resolver: zodResolver(installationFormSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: InstallationFormData) =>
      submitInstallationForm(data, isRemoveImage),
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
    },
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [newFileList, setNewFileList] = useState<UploadFile[]>([]);
  const [oldFileList, setOldFileList] = useState<UploadFile[]>([]);
  const [isRemoveImage, setIsRemoveImage] = useState({
    isRemoveNewImage: false,
    isRemoveOldImage: false,
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const initialMapPosition = () => {
    if (meter.installationLocation) {
      const [lat, lon] = meter.installationLocation
        .split(",")
        .map((part) => parseFloat(part.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        return [lat, lon] as [number, number];
      }
    }
    return null; // หรือ [0, 0] เป็นค่า default ถ้าไม่ต้องการ null
  };
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(
    initialMapPosition
  );

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

  const handleGetGps = () => {
    if (navigator.geolocation) {
      setIsGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(
            6
          )}`;
          setValue("installationLocation", locationString, {
            shouldValidate: true,
          });
          setMapPosition([latitude, longitude]);
          setIsGpsLoading(false);
          message.success("ดึงข้อมูล GPS สำเร็จ");
        },
        (error) => {
          console.error("Error getting GPS location:", error);
          let errorMessage = "ไม่สามารถดึงข้อมูล GPS ได้";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += ": ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += ": ข้อมูลตำแหน่งไม่พร้อมใช้งาน";
              break;
            case error.TIMEOUT:
              errorMessage += ": หมดเวลาในการร้องขอตำแหน่ง";
              break;
            default:
              errorMessage += ": เกิดข้อผิดพลาดที่ไม่รู้จัก";
              break;
          }
          message.error(errorMessage);
          setIsGpsLoading(false);
        }
      );
    } else {
      message.error("เบราว์เซอร์นี้ไม่รองรับ Geolocation");
    }
  };

  const handleNewChange: UploadProps["onChange"] = (info) => {
    setNewFileList(info.fileList);
    if (info.file.status == "removed") {
      setValue("newMeterImage", undefined as any, { shouldValidate: true });
      setIsRemoveImage({ ...isRemoveImage, isRemoveNewImage: true });
    } else if (info.fileList.length > 0 && info.fileList[0].originFileObj) {
      setValue("newMeterImage", info.fileList[0].originFileObj);
    }
  };

  const handleOldChange: UploadProps["onChange"] = (info) => {
    setOldFileList(info.fileList);
    if (info.file.status == "removed") {
      setValue("oldMeterImage", undefined as any, { shouldValidate: true });
      setIsRemoveImage({ ...isRemoveImage, isRemoveOldImage: true });
    } else if (info.fileList.length > 0 && info.fileList[0].originFileObj) {
      setValue("oldMeterImage", info.fileList[0].originFileObj);
    }
  };

  const handleBeforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("คุณสามารถอัปโหลดไฟล์ JPG/PNG เท่านั้น!");
      return Upload.LIST_IGNORE;
    }

    const isLt10M = file.size / 1024 / 1024 < 4; // ตรวจสอบขนาดไฟล์ก่อนบีบอัด
    if (!isLt10M) {
      message.error("ขนาดรูปภาพต้องไม่เกิน 4MB!");
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapPosition([lat, lng]);
    const locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setValue("installationLocation", locationString);
  };

  const onSubmit = (data: InstallationFormData) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    // --- โหมดแก้ไข ---
    setValue("peaNoNew", meter.peaNoNew);
    setValue("id", meter.id);

    meter.peaNoOld && setValue("peaNoOld", meter.peaNoOld);
    meter.installationDate
      ? setValue("installationDate", meter.installationDate)
      : setValue("installationDate", new Date());
    meter.installationName &&
      setValue("installationName", meter.installationName);
    meter.unitOld && setValue("unitOld", meter.unitOld);
    meter.unitNew && setValue("unitNew", meter.unitNew);
    meter.installationLocation &&
      setValue("installationLocation", meter.installationLocation);

    // ถ้ามีรูปภาพเดิม, ให้แสดงใน Upload component
    if (meter.newMeterImageUrl) {
      const fileForList: UploadFile = {
        uid: meter.id, // ใช้ ID ของ meter เป็น unique id
        name: "รูปมิเตอร์เดิม.jpg",
        status: "done",
        url: meter.newMeterImageUrl,
      };
      setNewFileList([fileForList]);

      // แปลง URL เป็น File object เพื่อให้ validation ของ react-hook-form ผ่าน
      urlToFile(meter.newMeterImageUrl, "existing-image.jpg").then(
        (fileObject) => {
          setValue("newMeterImage", fileObject, { shouldValidate: true });
        }
      );
    }

    if (meter.oldMeterImageUrl) {
      const fileForList: UploadFile = {
        uid: meter.id, // ใช้ ID ของ meter เป็น unique id
        name: "รูปมิเตอร์เดิม.jpg",
        status: "done",
        url: meter.oldMeterImageUrl,
      };
      setOldFileList([fileForList]);

      // แปลง URL เป็น File object เพื่อให้ validation ของ react-hook-form ผ่าน
      urlToFile(meter.newMeterImageUrl, "existing-image.jpg").then(
        (fileObject) => {
          setValue("oldMeterImage", fileObject, { shouldValidate: true });
        }
      );
    }
  }, [meter]);

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit(onSubmit)}
      className="max-w-xl mx-auto mt-10 rounded shadow-md "
      style={{ padding: "24px" }}
    >
      <p>ข้อมูลมิเตอร์เก่า</p>
      <Form.Item
        label="PEA No. มิเตอร์เก่า"
        validateStatus={errors.peaNoOld ? "error" : ""}
        help={errors.peaNoOld?.message}
      >
        <Controller
          name="peaNoOld"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Upload
        listType="picture-card"
        fileList={oldFileList}
        onPreview={handlePreview}
        onChange={handleOldChange}
        beforeUpload={handleBeforeUpload}
        accept="image/jpeg,image/png"
        openFileDialogOnClick={oldFileList.length < 1}
      >
        {oldFileList.length < 1 && (
          <div>
            <UploadOutlined />
            <span>อัปโหลด</span>
          </div>
        )}
      </Upload>
      <Form.Item
        label="หน่วยมิเตอร์เก่าที่จดได้"
        validateStatus={errors.unitOld ? "error" : ""}
        help={errors.unitOld?.message}
      >
        <Controller
          name="unitOld"
          control={control}
          render={({ field }) => <Input type="number" {...field} />}
        />
      </Form.Item>

      <p>ข้อมูลมิเตอร์ใหม่</p>
      <Form.Item
        label="PEA No. มิเตอร์ใหม่"
        validateStatus={errors.peaNoNew ? "error" : ""}
        help={errors.peaNoNew?.message}
      >
        <Controller
          name="peaNoNew"
          control={control}
          render={({ field }) => <Input type="number" {...field} />}
        />
      </Form.Item>
      <Upload
        listType="picture-card"
        fileList={newFileList}
        onPreview={handlePreview}
        onChange={handleNewChange}
        beforeUpload={handleBeforeUpload}
        accept="image/jpeg,image/png"
        openFileDialogOnClick={newFileList.length < 1}
      >
        {newFileList.length < 1 && (
          <div>
            <UploadOutlined />
            <span>อัปโหลด</span>
          </div>
        )}
      </Upload>
      <Form.Item
        label="หน่วยมิเตอร์ใหม่ที่จดได้"
        validateStatus={errors.unitNew ? "error" : ""}
        help={errors.unitNew?.message}
      >
        <Controller
          name="unitNew"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <p>ข้อมูลการติดตั้ง</p>
      <Form.Item
        label={<span className="mt-3">ตำแหน่งที่ติดตั้ง</span>}
        validateStatus={errors.installationLocation ? "error" : ""}
        help={errors.installationLocation?.message}
        className="mt-3"
      >
        <Controller
          name="installationLocation"
          control={control}
          render={({ field }) => (
            <Space.Compact className="w-full">
              <Input style={{ width: "calc(100% - 100px)" }} {...field} />
              <Button
                type="default"
                onClick={handleGetGps}
                loading={isGpsLoading}
              >
                GPS
              </Button>
            </Space.Compact>
          )}
        />
        <div
          className="mt-4 rounded-md overflow-hidden"
          style={{ height: "300px", width: "100%" }}
        >
          <LocationMap
            onMapClick={handleMapClick}
            latitude={mapPosition ? mapPosition[0]:undefined}
            longitude={mapPosition ? mapPosition[1]:undefined}
          />
        </div>
      </Form.Item>
      <Form.Item
        label={<span className="mt-3">ชื่อผู้ติดตั้ง</span>}
        validateStatus={errors.installationName ? "error" : ""}
        help={errors.installationName?.message}
        className="mt-3"
      >
        <Controller
          name="installationName"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Form.Item label="วันที่-เวลาติดตั้ง">
        <DatePicker
          showTime
          // value ควบคุมโดย react-hook-form จึงไม่จำเป็นต้องใช้ defaultValue
          value={
            watch("installationDate") ? dayjs(watch("installationDate")) : null
          }
          onChange={(date) => {
            if (date) setValue("installationDate", date.toDate());
          }}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item className="flex flex-row justify-end">
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          บันทึก
        </Button>
      </Form.Item>
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
    </Form>
  );
}
