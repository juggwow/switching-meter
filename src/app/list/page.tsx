import MeterListComponent from "../../component/meter-list/meter-list";

export default function MeterList() {
  return <MeterListComponent mode="statuslist" pdfUrl={process.env.PDF_URL}/>;
}
