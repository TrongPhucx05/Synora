export const LEVEL_TABS = [
  { id: "all", labelKey: "levelAll" },
  { id: "academic", labelKey: "levelAcademic" },
  { id: "university", labelKey: "levelUniversity" },
  { id: "other", labelKey: "levelOther" },
];

export const ACADEMIC_GRADES = [
  { id: "6", labelKey: "grade6" },
  { id: "7", labelKey: "grade7" },
  { id: "8", labelKey: "grade8" },
  { id: "9", labelKey: "grade9" },
  { id: "10", labelKey: "grade10" },
  { id: "11", labelKey: "grade11" },
  { id: "12", labelKey: "grade12" },
];

export const ACADEMIC_SUBJECTS = [
  { id: "math", labelKey: "subjectMath" },
  { id: "literature", labelKey: "subjectLiterature" },
  { id: "english", labelKey: "subjectEnglish" },
  { id: "physics", labelKey: "subjectPhysics" },
  { id: "chemistry", labelKey: "subjectChemistry" },
  { id: "biology", labelKey: "subjectBiology" },
  { id: "history", labelKey: "subjectHistory" },
  { id: "geography", labelKey: "subjectGeography" },
  { id: "informatics", labelKey: "subjectInformatics" },
  { id: "technology", labelKey: "subjectTechnology" },
  { id: "civics", labelKey: "subjectCivics" },
  { id: "economics", labelKey: "subjectEconomics" },
];

export const UNIVERSITY_MAJORS = [
  { id: "it", labelKey: "majorIt" },
  { id: "engineering", labelKey: "majorEngineering" },
  { id: "business", labelKey: "majorBusiness" },
  { id: "economics", labelKey: "majorEconomics" },
  { id: "finance", labelKey: "majorFinance" },
  { id: "law", labelKey: "majorLaw" },
  { id: "education", labelKey: "majorEducation" },
  { id: "medicine", labelKey: "majorMedicine" },
  { id: "languages", labelKey: "majorLanguages" },
  { id: "social", labelKey: "majorSocial" },
  { id: "media", labelKey: "majorMedia" },
  { id: "tourism", labelKey: "majorTourism" },
  { id: "agriculture", labelKey: "majorAgriculture" },
  { id: "architecture", labelKey: "majorArchitecture" },
  { id: "arts", labelKey: "majorArts" },
];

export const TYPE_TABS: { id: string; labelKey?: string }[] = [
  { id: "all", labelKey: "typeAll" },
  { id: "PDF" },
  { id: "DOCX" },
  { id: "PPTX" },
];

export const SORT_OPTIONS: {
  key: import("./types").SortKey;
  labelKey: string;
}[] = [
  { key: "newest", labelKey: "sortNewest" },
  { key: "mostDownloaded", labelKey: "sortMostDownloaded" },
  { key: "mine", labelKey: "sortMine" },
  { key: "saved", labelKey: "sortSaved" },
];

export const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-500",
  DOCX: "bg-blue-600",
  PPTX: "bg-orange-500",
};