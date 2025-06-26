'use server'
import { prisma } from "@/prisma/prisma-client";
import { MeterFormData } from "@/shema/meter-form";
import sharp from "sharp";


export async function submitMeterForm(formData: MeterFormData) {
  // Mock delay
  await new Promise((res) => setTimeout(res, 1000));


  const upload = await uploadImage(formData.newMeterPhoto)

  // Mock log
  const result = await prisma.meter.create({
    data :{
      peaNoNew: formData.peaNoNew,
      pickerName: formData.issuerName,
      pickerDate: formData.issueDate,
      newMeterImage: upload.url,
    }
  })

  return { success: true };
}


const IMAGEKIT_PRIVATE_API_KEY = process.env.IMAGEKIT_TOKEN!;
const IMAGEKIT_URL = "https://upload.imagekit.io/api/v1/files/upload";

export type ImageKitUploadResponse = {
  fileId: string;
  name: string;
  size: number;
  filePath: string;
  url: string;
  height: number;
  width: number;
  thumbnailUrl: string;
};

export async function uploadImage(file: File): Promise<ImageKitUploadResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // Resize และบีบอัดภาพให้คุณภาพต่ำลง
  const resizedBuffer = await sharp(inputBuffer)
    .resize({ width: 1280 }) // ปรับความกว้างตามต้องการ
    .jpeg({ quality: 70 })   // ลด quality เพื่อให้ขนาดไฟล์เล็กลง
    .toBuffer();

  const base64String = resizedBuffer.toString("base64");
  const base64File = `data:image/jpeg;base64,${base64String}`;

  const formData = new FormData();
  formData.append("file", base64File);
  formData.append("fileName", file.name);
  formData.append("useUniqueFileName", "true"); // ตั้งชื่ออัตโนมัติเพื่อกันชนกัน

  const response = await fetch(IMAGEKIT_URL, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(IMAGEKIT_PRIVATE_API_KEY + ":").toString("base64"),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result; // result.url, result.fileId, etc.
}

export async function deleteImage(fileId: string) {
  const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization:
        "Basic " + Buffer.from(IMAGEKIT_PRIVATE_API_KEY + ":").toString("base64"),
    },
  });
  if(!response.ok) throw new Error("failed to delete image");
}
