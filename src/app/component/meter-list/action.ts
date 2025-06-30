// src/app/warehouse/actions.ts (หรือไฟล์ Server Action ของคุณ)

'use server';

import { PrismaClient, Meter } from '@prisma/client'; // Import Meter type

const prisma = new PrismaClient();

interface Filter {
    mode: "statuslist" | "waiting_installation" // installationlist = "ยังไม่ได้ติดตั้ง"
}

interface FetchMetersParams {
  page: number;
  pageSize: number;
  filter?: Filter;
  // ... (search, sortBy, sortOrder)
}

export interface FetchMetersResult {
  meters: Meter[]; // ใช้ Type ที่ตรงกับ Meter ของคุณ
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
    const skip = (page - 1) * pageSize;

    let where: any = {}; // กำหนด Type เป็น any ชั่วคราว หรือใช้ Prisma.MeterWhereInput

    if(filter?.mode === "waiting_installation"){
        // ถ้า filter mode เป็น "installationlist" ให้หาข้อมูลที่ installationDate เป็น null
        // นี่คือการหา "รายการที่ยังไม่ได้ติดตั้ง"
        where = {
            installationDate: {
                isSet: false
            },
        }
    }

    console.log("Fetching meters with where clause:", where);
    // ถ้า filter.mode เป็น "statuslist" หรือไม่มี filter
    // where จะเป็น object ว่าง {} ซึ่งหมายถึงดึงข้อมูลทั้งหมด


    const meters = await prisma.meter.findMany({
      skip: skip,
      take: pageSize,
      orderBy: {
        pickerDate: 'desc', // เรียงตามวันที่เบิกล่าสุด
      },
      where: where, // ใช้ where clause ที่ถูกกำหนดไว้
    });

    console.log("Meters fetched count:", meters.length);

    const totalCount = await prisma.meter.count({
        where: where, // ใช้ where clause เดียวกันสำหรับการนับจำนวนทั้งหมด
    });

    return {
      meters: meters,
      totalCount: totalCount,
      currentPage: page,
      pageSize: pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch meters:", error);
    throw new Error("Failed to fetch meter data.");
  }
}