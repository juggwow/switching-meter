// src/app/warehouse/action.ts
"use server";

import { FilterData } from "@/app/type/filter";
import { PrismaClient, Meter, Prisma } from "@prisma/client";
import { stringify } from "csv-stringify";

const prisma = new PrismaClient();

interface FetchMetersParams {
  page: number;
  pageSize: number;
  filter?: FilterData;
}

export interface FetchMetersResult {
  meters: Meter[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export async function fetchMeters({
  page,
  pageSize,
  filter,
}: FetchMetersParams): Promise<FetchMetersResult> {
  try {
    console.log(
      "Incoming filter:",
      filter,
      "Page:",
      page,
      "PageSize:",
      pageSize
    );
    const skip = (page - 1) * pageSize;

    let where: Prisma.MeterWhereInput = setWhere(filter);

    // 4. Apply Sorting
    const orderBy: Prisma.MeterOrderByWithRelationInput = {
      pickerDate: filter?.sortOrder || "desc",
    };

    const meters = await prisma.meter.findMany({
      skip: skip,
      take: pageSize,
      orderBy: orderBy,
      where: where,
    });

    const totalCount = await prisma.meter.count({
      where: where,
    });

    return {
      meters,
      totalCount: totalCount,
      currentPage: page,
      pageSize: pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch meters:", error);
    throw new Error("Failed to fetch meter data.");
  }
}

export async function exportMetersToCsv(filter: FilterData): Promise<string> {
  try {
    let where: Prisma.MeterWhereInput = setWhere(filter)

    const metersToExport = await prisma.meter.findMany({
      where: where,
      orderBy: { pickerDate: filter?.sortOrder || "desc" },
    });

    console.log("Meters to export count:", metersToExport.length);

    // --- เตรียมข้อมูลสำหรับ CSV และแปลงด้วย csv-stringify ---
    const csvData = metersToExport.map(meter => {

      return {
        'ID มิเตอร์': meter.id,
        'PEA No. ใหม่': meter.peaNoNew,
        'PEA No. เก่า': meter.peaNoOld || '',
        'ชื่อผู้เบิก': meter.pickerName,
        'วันที่เบิก': meter.pickerDate.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), // Format สำหรับ CSV
        'หน่วยเก่า': meter.unitOld !== null ? meter.unitOld.toFixed(2) : '',
        'หน่วยใหม่': meter.unitNew !== null ? meter.unitNew.toFixed(2) : '',
        'ชื่อผู้ติดตั้ง': meter.installationName || '',
        'วันที่ติดตั้ง': meter.installationDate ? meter.installationDate.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '',
        'ตำแหน่งติดตั้ง': meter.installationLocation || '',
        'วันที่สร้างข้อมูล': meter.createdAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        'วันที่อัปเดตข้อมูล': meter.updatedAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      };
    });

    const columns = [
      { key: 'ID มิเตอร์', header: 'ID มิเตอร์' },
      { key: 'PEA No. ใหม่', header: 'PEA No. ใหม่' },
      { key: 'PEA No. เก่า', header: 'PEA No. เก่า' },
      { key: 'ชื่อผู้เบิก', header: 'ชื่อผู้เบิก' },
      { key: 'วันที่เบิก', header: 'วันที่เบิก' },
      { key: 'หน่วยเก่า', header: 'หน่วยเก่า' },
      { key: 'หน่วยใหม่', header: 'หน่วยใหม่' },
      { key: 'ชื่อผู้ติดตั้ง', header: 'ชื่อผู้ติดตั้ง' },
      { key: 'วันที่ติดตั้ง', header: 'วันที่ติดตั้ง' },
      { key: 'ตำแหน่งติดตั้ง', header: 'ตำแหน่งติดตั้ง' },
      { key: 'วันที่สร้างข้อมูล', header: 'วันที่สร้างข้อมูล' },
      { key: 'วันที่อัปเดตข้อมูล', header: 'วันที่อัปเดตข้อมูล' },
    ];

    const csvStringPromise: Promise<string> = new Promise((resolve, reject) => {
      stringify(csvData, { header: true, columns: columns }, (err, output) => {
        if (err) return reject(err);
        resolve(output || '');
      });
    });

    const csvOutput = await csvStringPromise;

    // *** เพิ่ม BOM (Byte Order Mark) ที่นี่ ***
    // BOM for UTF-8 is EF BB BF (in hex)
    const BOM = "\uFEFF"; // นี่คือ BOM character ใน Unicode

    return BOM + csvOutput; // คืนค่า CSV String พร้อม BOM
  } catch (error) {
    console.error("Failed to export meters to CSV:", error);
    throw new Error("ไม่สามารถ Export ข้อมูลเป็น CSV ได้");
  }
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999); // ตั้งค่าเวลาเป็น 23:59:59.999
  return d;
}

function setWhere(filter?: FilterData) : Prisma.MeterWhereInput {
  if (!filter) {
    return {}
  }
  let where: Prisma.MeterWhereInput = {};

  let finalPickerDateEnd: Date | undefined = filter?.pickerDateEnd; // ตัวแปรสำหรับ pickerDateEnd ที่จะใช้จริง

  // คำนวณ endOfYesterday ล่วงหน้า (ใช้สำหรับ picker_overdue)
  const now = new Date();
  const endOfYesterday = new Date(now);
  endOfYesterday.setHours(0, 0, 0, 0);
  endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);

  // 1. Apply Status Filters
  if (filter?.status) {
    if (filter.status === "wait_installation") {
      where.installationDate = { isSet: false };
    } else if (filter.status === "is_installed") {
      where.installationDate = { isSet: true };
    } else if (filter.status === "picker_overdue") {
      // เงื่อนไขหลักสำหรับ picker_overdue
      where.pickerDate = {
        lte: endOfYesterday, // pickerDate ต้องน้อยกว่าหรือเท่ากับสิ้นสุดของเมื่อวาน
      };
      where.installationDate = {
        isSet: false, // และยังไม่ได้ติดตั้ง
      };

      // *** Logic ใหม่: ถ้า picker_overdue ถูกเลือก และมี pickerDateEnd ที่ผู้ใช้ระบุมา
      // *** และ pickerDateEnd นั้น "อยู่หลัง" endOfYesterday
      // *** ให้ใช้ endOfYesterday แทน pickerDateEnd ของผู้ใช้
      if (
        filter.pickerDateEnd &&
        filter.pickerDateEnd.getTime() > endOfYesterday.getTime()
      ) {
        finalPickerDateEnd = endOfYesterday;
      } else {
        // ถ้า pickerDateEnd ไม่ได้อยู่หลัง endOfYesterday หรือไม่มีการกำหนดมา
        // ก็ใช้ค่า pickerDateEnd เดิมจาก filter (ซึ่งอาจเป็น undefined หรือมีค่าอยู่แล้ว)
        finalPickerDateEnd = filter.pickerDateEnd;
      }
    }
  }

  // 2. Apply Text Search Filters
  if (filter?.searchPeaNoNew && filter.searchPeaNoNew != "") {
    where = {
      ...where,
      peaNoNew: {
        contains: filter.searchPeaNoNew,
        mode: "insensitive",
      },
    };
  }
  if (filter?.searchPeaNoOld && filter.searchPeaNoOld != "") {
    where = {
      ...where,
      peaNoOld: {
        contains: filter.searchPeaNoOld,
        mode: "insensitive",
      },
    };
  }
  if (filter?.searchCa && filter.searchCa != "") {
    where = {
      ...where,
      ca: {
        contains: filter.searchCa,
        mode: "insensitive",
      },
    };
  }

  // 3. Apply Date Range Filter for pickerDate (วันที่เริ่มต้น - สิ้นสุด)
  // ใช้ finalPickerDateEnd ที่อาจถูกปรับแล้ว
  if (filter?.pickerDateStart || finalPickerDateEnd) {
    // ใช้ finalPickerDateEnd ที่นี่
    where = {
      ...where,
      pickerDate: {
        // ถ้า pickerDate มีเงื่อนไขอยู่แล้ว (จาก picker_overdue), Prisma จะรวมเงื่อนไขเข้าด้วยกัน
        // มิฉะนั้นจะใส่เงื่อนไขใหม่
        ...(where.pickerDate as Prisma.DateTimeFilter), // Cast เพื่อ Type Safety ถ้า pickerDate มีอยู่แล้ว
        ...(filter?.pickerDateStart && { gte: filter.pickerDateStart }),
        ...(finalPickerDateEnd && { lte: endOfDay(finalPickerDateEnd) }), // ใช้ finalPickerDateEnd
      },
    };
  }

  return where
}
