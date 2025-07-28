"use server";
import { prisma } from "@/prisma/prisma-client";
import { InstallationFormData } from "@/shema/instaltion-form";
import { MeterFormData } from "@/shema/meter-form";
import { EsriPointGeometry, PeaMeterDetailAttributes } from "@/types/gis";
import { PhaseInstallation, PhaseSystem } from "@prisma/client";
import sharp from "sharp";
import { pick } from "zod/v4-mini";
import { point, distance } from "@turf/turf";

export const getMeter = async (id: string) => {
  const meterData = await prisma.meter.findUnique({
    where: {
      id: id,
    },
  });

  if (!meterData) throw new Error("Meter not found");
  return meterData;
};

export async function submitMeterForm(formData: MeterFormData) {
  const upload = await uploadImage(formData.newMeterPhoto);

  const result = await prisma.meter.create({
    data: {
      ca: formData.ca,
      peaNoNew: formData.peaNoNew,
      pickerName: formData.issuerName,
      pickerDate: formData.issueDate,
      newMeterImageUrl: upload.url,
      newMeterImageId: upload.fileId,
    },
  });

  return result;
}

export async function updateMeterForm(
  id: string,
  formData: MeterFormData,
  isRemoveImage: boolean
) {
  let data = await getMeter(id);

  if (isRemoveImage) {
    await deleteImage(data.newMeterImageId!);
    const upload = await uploadImage(formData.newMeterPhoto);
    data.newMeterImageId = upload.fileId;
    data.newMeterImageUrl = upload.url;
  }

  const result = await prisma.meter.update({
    where: {
      id,
    },
    data: {
      peaNoNew: formData.peaNoNew,
      pickerName: formData.issuerName,
      pickerDate: formData.issueDate,
      newMeterImageId: data.newMeterImageId,
      newMeterImageUrl: data.newMeterImageUrl,
    },
  });

  return result;
}

export async function submitInstallationForm(
  formData: InstallationFormData,
  {
    isRemoveNewImage,
    isRemoveOldImage,
  }: { isRemoveNewImage: boolean; isRemoveOldImage: boolean }
) {
  let data = await getMeter(formData.id);
  if (isRemoveOldImage && data.oldMeterImageId) {
    await deleteImage(data.oldMeterImageId);
  }

  if (isRemoveOldImage || !data.oldMeterImageId) {
    const oldMeterUpload = await uploadImage(formData.oldMeterImage!);
    data.oldMeterImageId = oldMeterUpload.fileId;
    data.oldMeterImageUrl = oldMeterUpload.url;
  }

  if (isRemoveNewImage) {
    if (data.newMeterImageId) {
      await deleteImage(data.newMeterImageId);
    }
    const newMeterUpload = await uploadImage(formData.newMeterImage!);
    data.newMeterImageId = newMeterUpload.fileId;
    data.newMeterImageUrl = newMeterUpload.url;
  }

  const result = await prisma.meter.update({
    where: {
      id: formData.id,
    },
    data: {
      ca: formData.ca,
      reason: formData.reson,
      peaNoNew: formData.peaNoNew,
      peaNoOld: formData.peaNoOld,
      installationName: formData.installationName,
      installationDate: formData.installationDate,
      unitNew: formData.unitNew,
      unitOld: formData.unitOld,
      installationLocation: formData.installationLocation,
      oldMeterImageUrl: data.oldMeterImageUrl,
      oldMeterImageId: data.oldMeterImageId,
      newMeterImageUrl: data.newMeterImageUrl,
      newMeterImageId: data.newMeterImageId,
    },
  });
  return result;
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
    .jpeg({ quality: 70 }) // ลด quality เพื่อให้ขนาดไฟล์เล็กลง
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
        "Basic " +
        Buffer.from(IMAGEKIT_PRIVATE_API_KEY + ":").toString("base64"),
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
    method: "DELETE",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(IMAGEKIT_PRIVATE_API_KEY + ":").toString("base64"),
    },
  });
  if (!response.ok) throw new Error("failed to delete image");
}

export async function mockSubmit(data: InstallationFormData) {
  console.log(data);
}

export async function updateFromGis(
  data: PeaMeterDetailAttributes,
  point: EsriPointGeometry,
  id: string
) {
  const customerName = `${data["PEA.METER_DETAIL.PREFIX"] || ""}${
    data["PEA.METER_DETAIL.CUSTOMERNAME"] || ""
  } ${data["PEA.METER_DETAIL.CUSTOMERSIRNAME"] || ""}`;
  let address = "";
  if (data["PEA.METER_DETAIL.VILLAGEBUILDING"]) {
    address += data["PEA.METER_DETAIL.VILLAGEBUILDING"];
  }

  if (data["PEA.METER_DETAIL.FLOORNO"])
    address += ` ${data["PEA.METER_DETAIL.FLOORNO"]}`;
  if (data["PEA.METER_DETAIL.ROOMNO"])
    address += ` ${data["PEA.METER_DETAIL.ROOMNO"]}`;
  if (data["PEA.METER_DETAIL.ADDRESSNO"])
    address += ` ${data["PEA.METER_DETAIL.ADDRESSNO"]}`;
  if (data["PEA.METER_DETAIL.MOO"])
    address += ` ${data["PEA.METER_DETAIL.MOO"]}`;
  if (data["PEA.METER_DETAIL.TROK"])
    address += ` ${data["PEA.METER_DETAIL.TROK"]}`;
  if (data["PEA.METER_DETAIL.SOI"])
    address += ` ${data["PEA.METER_DETAIL.SOI"]}`;
  if (data["PEA.METER_DETAIL.STREET"])
    address += ` ${data["PEA.METER_DETAIL.STREET"]}`;
  if (data["PEA.METER_DETAIL.TUMBOL"])
    address += ` ${data["PEA.METER_DETAIL.TUMBOL"]}`;
  if (data["PEA.METER_DETAIL.AMPHOE"])
    address += ` ${data["PEA.METER_DETAIL.AMPHOE"]}`;
  if (data["PEA.METER_DETAIL.CHANGWAT"])
    address += ` ${data["PEA.METER_DETAIL.CHANGWAT"]}`;
  if (data["PEA.METER_DETAIL.POSTCODE"])
    address += ` ${data["PEA.METER_DETAIL.POSTCODE"]}`;

  const materialNumberOld = data["PEA.METER_DETAIL.MATERIALNUMBER"];
  const metertypeOld = data["PEA.METER_DETAIL.METERTYPE"];
  const peaCode = data["PEA.METER_DETAIL.CODE"];

  let phaseSystem: string | undefined = undefined;
  if (data["PEA.DS_LowVoltageMeter.SUBTYPECODE"])
    switch (data["PEA.DS_LowVoltageMeter.SUBTYPECODE"]) {
      case 1:
        phaseSystem = "ONEPHASE";
        break;
      case 3:
        phaseSystem = "THREEPHASE";
        break;
      default:
        break;
    }

  let phaseInstallation: string | undefined = undefined;
  if (data["PEA.DS_LowVoltageMeter.PHASEDESIGNATION"]) {
    switch (data["PEA.DS_LowVoltageMeter.PHASEDESIGNATION"]) {
      case 1:
        phaseInstallation = "CN";
        break;
      case 2:
        phaseInstallation = "BN";
        break;
      case 4:
        phaseInstallation = "AN";
        break;
      case 7:
        phaseInstallation = "ABCN";
        break;
      default:
        break;
    }
  }

  if (data["PEA.DS_GroupMeter_Detail.PHASEDESIGNATION"])
    phaseInstallation = data["PEA.DS_GroupMeter_Detail.PHASEDESIGNATION"];

  const result = await prisma.meter.update({
    where: {
      id,
    },
    data: {
      customerName,
      customerAddress: address,
      materialNumberOld,
      metertypeOld,
      peaCode,
      phaseSystem,
      phaseInstallation,
      meterOldLocation: `${point.y}, ${point.x}`,
      userType: data["PEA.METER_DETAIL.USERTYPE"]
    },
  });

  if (!result.installationLocation) return result;

  const [lat1, lon1] = parseLatLngString(result.installationLocation);

  if (!lat1 || !lon1) return result;

  const distance = calculateDistanceTurf(lat1, lon1, point.y, point.x);

  const resultWithDistance = await prisma.meter.update({
    where : {
      id
    },
    data: {
      distanceDiff: distance,
      ca: data["PEA.METER_DETAIL.CA"] || result.ca
    }
  })

  return result;
}

export async function exportIsInstalledAndNoDataFromGIS() {
  const data = await prisma.meter.findMany({
    where: {
      peaNoOld: { isSet: true },
    },
  });
  return data;
}

function calculateDistanceTurf(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "kilometers" | "miles" | "nauticalmiles" = "kilometers" // Turf.js ใช้ 'kilometers'
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0; // ถ้าจุดเดียวกัน ระยะทางเป็น 0
  }

  // สร้างจุด GeoJSON จากละติจูดและลองจิจูด
  // Turf.js point() คาดหวัง [longitude, latitude]
  const fromPoint = point([lon1, lat1]);
  const toPoint = point([lon2, lat2]);

  // คำนวณระยะทางโดยใช้ turf.distance()
  const dist = distance(fromPoint, toPoint, { units: unit });

  return dist;
}

function parseLatLngString(
  latLngString: string
): [number | null, number | null] {
  // ตรวจสอบว่า string ไม่ว่างเปล่า
  if (!latLngString) {
    return [null, null];
  }

  // ใช้ split(',') เพื่อแยก string ด้วยเครื่องหมายคอมมา
  const parts = latLngString.split(",");

  // ตรวจสอบว่ามี 2 ส่วนที่แยกออกมาได้
  if (parts.length === 2) {
    // ใช้ parseFloat() เพื่อแปลงแต่ละส่วนให้เป็นตัวเลข
    const lat = parseFloat(parts[0].trim()); // .trim() เพื่อลบช่องว่างที่อาจมี
    const lon = parseFloat(parts[1].trim()); // .trim() เพื่อลบช่องว่างที่อาจมี

    // ตรวจสอบว่าการแปลงเป็นตัวเลขสำเร็จหรือไม่ (NaN = Not a Number)
    if (!isNaN(lat) && !isNaN(lon)) {
      return [lat, lon];
    }
  }

  // คืนค่า [null, null] หาก string ไม่ตรงตามรูปแบบที่คาดหวัง หรือแปลงเป็นตัวเลขไม่ได้
  return [null, null];
}
