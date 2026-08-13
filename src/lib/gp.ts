export const GRAM_PANCHAYAT = "ग्रामपंचायत ढोरजळगाव";
export const MAIN_VILLAGE = "ढोरजळगाव";
export const TALUKA = "शेवगाव";
export const DISTRICT = "अहिल्यानगर";
export const SARPANCH = "सुवर्णा गिऱ्हे";

export const VILLAGES = [
  { name: "ढोरजळगाव", label: "ढोरजळगाव", note: "मुख्य गाव / ग्रामपंचायत कार्यालय" },
  { name: "गरडवाडी", label: "गरडवाडी", note: "उपगाव" },
  { name: "मलकापूर", label: "मलकापूर", note: "उपगाव" },
  { name: "आपेगाव", label: "आपेगाव", note: "उपगाव" },
] as const;

export const CATEGORIES = [
  { value: "water", label: "पाणीपुरवठा" },
  { value: "roads", label: "रस्ते" },
  { value: "electricity", label: "वीज" },
  { value: "sanitation", label: "कचरा व्यवस्थापन / स्वच्छता" },
  { value: "drainage", label: "गटार / नाली" },
  { value: "health", label: "आरोग्य" },
  { value: "education", label: "शिक्षण" },
  { value: "other", label: "इतर" },
] as const;

export const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;

export type IssueStatus = "pending" | "in_progress" | "completed";

export const STATUS_LABEL: Record<IssueStatus, string> = {
  pending: "प्रलंबित",
  in_progress: "काम सुरू",
  completed: "पूर्ण झाले",
};

export const ANNOUNCEMENT_KIND: Record<string, string> = {
  notice: "सूचना",
  scheme: "योजना",
  meeting: "सभा",
};

const MR_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
export const toMarathiDigits = (input: string | number) =>
  String(input).replace(/[0-9]/g, (d) => MR_DIGITS[Number(d)] ?? d);

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर",
  ];
  return `${toMarathiDigits(d.getDate())} ${months[d.getMonth()] ?? ""} ${toMarathiDigits(d.getFullYear())}`;
};

export const formatMoney = (amount?: number | string | null) => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return `₹ ${toMarathiDigits(n.toLocaleString("en-IN"))}`;
};