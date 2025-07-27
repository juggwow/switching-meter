import { PeaMeterDetailsResponse } from "@/types/gis";

export async function getDataFromGIS() {
  const formdata = new FormData();
  formdata.append("where", "PEA.DS_LowVoltageMeter.PEANO='6400129083'");
  formdata.append(
    "outFields",
    "PEA.DS_LowVoltageMeter.SUBTYPECODE,PEA.DS_LowVoltageMeter.PHASEDESIGNATION,PEA.METER_DETAIL.CODE,PEA.METER_DETAIL.PREFIX,PEA.METER_DETAIL.CUSTOMERNAME,PEA.METER_DETAIL.CUSTOMERSIRNAME,PEA.METER_DETAIL.ADDRESSNO,PEA.METER_DETAIL.ROOMNO,PEA.METER_DETAIL.FLOORNO,PEA.METER_DETAIL.MOO,PEA.METER_DETAIL.STREET,PEA.METER_DETAIL.TUMBOL,PEA.METER_DETAIL.AMPHOE,PEA.METER_DETAIL.CHANGWAT,PEA.METER_DETAIL.POSTCODE,PEA.METER_DETAIL.VILLAGEBUILDING,PEA.METER_DETAIL.TROK,PEA.METER_DETAIL.SOI,PEA.METER_DETAIL.METERTYPE,PEA.METER_DETAIL.CA,PEA.METER_DETAIL.KWATTHOURS,PEA.METER_DETAIL.CURRDATE,PEA.METER_DETAIL.MATERIALNUMBER"
  );
  formdata.append("f", "json");
  formdata.append("outSR", "4236");

  const requestOptions = {
    method: "POST",
    body: formdata,
  };

  const res = await fetch(
    "https://giss3.pea.co.th/arcgis/rest/services/PEA_QUERY/MapServer/9/query",
    requestOptions
  );

  if (res.status != 200) {
    throw new Error("cannot get data from gis");
  }

  return (await res.json()) as PeaMeterDetailsResponse;
}

export async function checkConnectGis() {
  const res = await fetch(
    "https://giss3.pea.co.th/arcgis/rest/services/"
  );
  if (res.status != 200) {
    console.log(res);
    throw new Error("cannot get data from gis");
  }

  console.log(res);
}
