"use client";

import "@ant-design/v5-patch-for-react-19";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { submitMeterForm } from "./action";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  DatePicker,
  UploadProps,
  UploadFile,
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeterFormData, meterFormSchema } from "@/shema/meter-form";
import dayjs from "dayjs";

export default function MeterForm() {
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

  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
    if (info.file.status == "removed"){
      resetField("newMeterPhoto")
    } else if (info.fileList.length > 0 && info.fileList[0].originFileObj) {
      console.log('testttttt')
      setValue("newMeterPhoto",info.fileList[0].originFileObj)
    }
  };

  const mutation = useMutation({
    mutationFn: submitMeterForm,
    onSuccess: () => {
      message.success("บันทึกข้อมูลเรียบร้อยแล้ว!");
    },
  });

  const onSubmit = (data: MeterFormData) => {
    mutation.mutate(data);
  };

  console.log(watch("newMeterPhoto"))

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit(onSubmit)}
      className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow-md"
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
           {" "}
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={() => false}
      >
               {" "}
        {fileList.length < 1 && (
          <div>
                        <UploadOutlined />
            <span>อัปโหลด</span>
          </div>
        )}
      </Upload>
           {" "}
      <Modal
        open={previewOpen}
        title="Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
               {" "}
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
             {" "}
      </Modal>
           {" "}
      <Form.Item
        label="ชื่อผู้เบิก"
        validateStatus={errors.issuerName ? "error" : ""}
        help={errors.issuerName?.message}
      >
        <Controller
          name="issuerName"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
           
      <Form.Item label="วันที่-เวลาเบิก">
         {" "}
        <DatePicker
          showTime
          defaultValue={dayjs()}
          onChange={(date) => {
            if (date) setValue("issueDate", date.toDate());
          }}
          style={{ width: "100%" }}
        />
      </Form.Item>
           {" "}
      <Form.Item>
               {" "}
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                    บันทึกการเบิก        {" "}
        </Button>
             {" "}
      </Form.Item>
         {" "}
    </Form>
  );
}
