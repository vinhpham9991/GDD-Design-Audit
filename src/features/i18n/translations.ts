export type Language = "en" | "vi";

export type TranslationDictionary = {
  appName: string;
  nav: Record<string, string>;
  pages: Record<string, string>;
  common: {
    search: string;
    create: string;
    save: string;
    cancel: string;
    language: string;
    help: string;
    emptyState: string;
    noData: string;
    status: string;
    owner: string;
    priority: string;
    reset: string;
    import: string;
    export: string;
    success: string;
  };
  guide: {
    title: string;
    intro: string;
    sources: string;
    audit: string;
    scorecard: string;
    insight: string;
    issues: string;
    exportImport: string;
  };
};

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "Game Design OS",
    nav: {
      dashboard: "Dashboard",
      projectHub: "Project Hub",
      sources: "Sources",
      gddStudio: "GDD Studio",
      auditLab: "Audit Lab",
      scorecard: "Scorecard",
      insightCenter: "Insight Center",
      actionTracker: "Action Tracker",
      governance: "Governance",
      settings: "Settings",
    },
    pages: {
      dashboard: "Command Dashboard",
      projectHub: "Project Hub",
      sources: "Source Ingestion Hub",
      gddStudio: "GDD Studio",
      auditLab: "Audit Lab",
      scorecard: "Scorecard Board",
      insightCenter: "Insight Center",
      actionTracker: "Action Tracker",
      governance: "Governance & History",
      settings: "Settings",
    },
    common: {
      search: "Search",
      create: "Create",
      save: "Save",
      cancel: "Cancel",
      language: "Language",
      help: "Guide / Help",
      emptyState: "No records yet",
      noData: "No data available",
      status: "Status",
      owner: "Owner",
      priority: "Priority",
      reset: "Reset to Seed",
      import: "Import",
      export: "Export",
      success: "Success",
    },
    guide: {
      title: "How GAME DESIGN OS Works",
      intro: "Use the workflow from left to right: Sources -> GDD -> Audit -> Scorecard -> Insight -> Issues.",
      sources:
        "Sources are your evidence base. Add text, markdown/txt files, and URLs with reliability and tags.",
      audit:
        "Audit measures document quality: clarity, section coverage, unsupported claims, and contradictions.",
      scorecard:
        "Scorecard measures design quality by human judgment using weighted design categories.",
      insight:
        "Insight compares Audit vs Scorecard to reveal alignment gaps and confidence mismatches.",
      issues:
        "Issues convert weak/missing sections and large mismatches into actionable tasks.",
      exportImport:
        "Use Settings to export/import JSON snapshots and download DOCX reports for sharing.",
    },
  },
  vi: {
    appName: "Game Design OS",
    nav: {
      dashboard: "Tong Quan",
      projectHub: "Trung Tam Du An",
      sources: "Nguon Du Lieu",
      gddStudio: "GDD Studio",
      auditLab: "Phong Danh Gia",
      scorecard: "Bang Diem",
      insightCenter: "Trung Tam Insight",
      actionTracker: "Theo Doi Hanh Dong",
      governance: "Quan Tri & Lich Su",
      settings: "Cai Dat",
    },
    pages: {
      dashboard: "Bang Dieu Khien",
      projectHub: "Trung Tam Du An",
      sources: "Hub Nguon Dau Vao",
      gddStudio: "Xuong GDD",
      auditLab: "Phong Audit",
      scorecard: "Bang Diem Danh Gia",
      insightCenter: "Trung Tam Insight",
      actionTracker: "Bang Theo Doi Viec",
      governance: "Quan Tri & Lich Su",
      settings: "Cai Dat",
    },
    common: {
      search: "Tim Kiem",
      create: "Tao Moi",
      save: "Luu",
      cancel: "Huy",
      language: "Ngon Ngu",
      help: "Huong Dan / Tro Giup",
      emptyState: "Chua co du lieu",
      noData: "Khong co du lieu",
      status: "Trang Thai",
      owner: "Phu Trach",
      priority: "Uu Tien",
      reset: "Khoi phuc du lieu mau",
      import: "Nhap",
      export: "Xuat",
      success: "Thanh cong",
    },
    guide: {
      title: "Cach GAME DESIGN OS Van Hanh",
      intro: "Theo luong cong viec tu trai sang phai: Sources -> GDD -> Audit -> Scorecard -> Insight -> Issues.",
      sources:
        "Sources la bo bang chung. Ban co the them text, file markdown/txt va URL cung do tin cay + tag.",
      audit:
        "Audit do chat luong tai lieu: do ro rang, do phu section, unsupported claims va mau thuan.",
      scorecard:
        "Scorecard do chat luong thiet ke bang danh gia thu cong theo nhom tieu chi co trong so.",
      insight:
        "Insight so sanh Audit voi Scorecard de tim khoang cach va do lech nhan dinh.",
      issues:
        "Issues bien diem yeu/missing va delta lon thanh task co the xu ly.",
      exportImport:
        "Su dung Settings de import/export JSON va tai DOCX bao cao chia se.",
    },
  },
};
