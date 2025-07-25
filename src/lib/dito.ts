import { Meter } from "@prisma/client";

export type PDFContent = {
  docDate: string;
  manager: string;
  leader: string;
  installationName: string;
  ca: string;
  //   caOld: string;
  //   address: string;
  //   causeDamage: string;
  //   idCard: string;
  peaOld: string;
  peaNew: string;
  unitOld: number;
  unitNew: number;
  //   ampOld: string;
  //   ampNew: string;
  //   voltOld: string;
  //   voltNew: string;
  installationDate: string;
};

// "templateProjectPath": "sample/s3/patna/reinstall-meter.dito",
//     "templateName": "meter",
//     "pdfVersion": "1.7",
//     "data"

// {
//   "docDate": "31 มกราคม 2568",
//   "manager": "ผจก.สข.",
//   "leader": "หผ.มต.",
//   "installationName": "นายระทวย คงควรคอย",
//   "ca": "2000000000",
//   "caOld": "1000000000",
//   "address": "313 หมู่ 56 ต.หนองในเทียม อ.สุขภาพดี จ.อัณธายาน",
//   "brandOld": "โรงเกลือ",
//   "brandNew": "โรงเหล็ก",
//   "causeDamage": "ถูกฟาดด้วยของแข็งยาว 9 นิ้ว",
//   "idCard": "10002000020",
//   "peaOld": "124123412341",
//   "peaNew": "765765765765",
//   "unitOld": 12342,
//   "unitNew": 5565,
//   "ampOld": "5(15)",
//   "ampNew": "5(15)",
//   "voltOld": "3/4/220",
//   "voltNew": "3/4/220",
//   "installationDate": "30 มกราคม 2568"
// }

export async function checkDitoStatus(url: string) {
  const res = await fetchWithTimeout(`${url}/status`);
  if (res.status != 200) {
    throw new Error("cannot connect pea server");
  }
}

export async function createPDF(url: string, meter: Meter) {
  const content: PDFContent = {
    docDate: new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    manager: "ผจก.สข.",
    leader: "หผ.มต.",
    installationName: meter.installationName || "",
    ca: meter.ca,
    // caOld: "1000000000",
    // address: "313 หมู่ 56 ต.หนองในเทียม อ.สุขภาพดี จ.อัณธายาน",
    // brandOld: "โรงเกลือ",
    // brandNew: "โรงเหล็ก",
    // causeDamage: "ถูกฟาดด้วยของแข็งยาว 9 นิ้ว",
    // idCard: "10002000020",
    peaOld: meter.peaNoOld || "",
    peaNew: meter.peaNoNew,
    unitOld: meter.unitOld || 0,
    unitNew: meter.unitNew || 0,
    // ampOld: "5(15)",
    // ampNew: "5(15)",
    // voltOld: "3/4/220",
    // voltNew: "3/4/220",
    installationDate:
      meter.installationDate?.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) || "",
  };

  const res = await fetchWithTimeout(`${url}/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
    },
    body: JSON.stringify(content),
  });

  if (res.status != 200) {
    throw new Error("cannot create pdf");
  }

  return await res.json();
}

async function fetchWithTimeout(
  resource: RequestInfo, // URL หรือ Request object
  options: RequestInit = {}, // Options ของ fetch
  timeoutMs: number = 10000 // ค่า Timeout เป็นมิลลิวินาที (Default: 10 วินาที)
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs); // ตั้ง Timeout

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal, // ส่ง AbortController signal เข้าไปใน options
    });
    clearTimeout(id); // ถ้า fetch สำเร็จ, เคลียร์ Timeout
    return response;
  } catch (error: any) {
    clearTimeout(id); // เคลียร์ Timeout ไม่ว่าสำเร็จหรือเกิด Error
    if (error.name === "AbortError") {
      // นี่คือ Error ที่เกิดจาก Timeout
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }
    // Error อื่นๆ (เช่น Network Error)
    throw error;
  }
}
