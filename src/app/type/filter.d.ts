export type FilterData = {
  searchPeaNoNew?: string;
  searchPeaNoOld?: string;
  pickerDateStart?: Date; // รับค่าเป็น Date ที่นี่
  pickerDateEnd?: Date; // รับค่าเป็น Date ที่นี่
  status?: "wait_installation" | "is_installed" | "picker_overdue" | "all";
  sortOrder?: "asc" | "desc"; // ลำดับการจัดเรียง
};
