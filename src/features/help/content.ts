import type { Language } from "@/features/i18n/translations";

type GuideStep = {
  title: string;
  description: string;
};

type HelpContent = {
  pageDescriptions: {
    sources: string;
    gddStudio: string;
    auditLab: string;
    scorecard: string;
    insightCenter: string;
    actionTracker: string;
    governance: string;
    settings: string;
  };
  tooltips: {
    auditScore: string;
    scorecardTotal: string;
    dualRadar: string;
    issueGeneration: string;
    approvalGates: string;
    confidenceSummary: string;
    sourceReliability: string;
    docxUpload: string;
    jsonImportExport: string;
  };
  sectionDescriptions: {
    latestAudit: string;
    topGaps: string;
    sourceQuality: string;
    approvalGates: string;
  };
  guide: {
    title: string;
    intro: string;
    coreLogic: string;
    steps: GuideStep[];
  };
};

const helpContent: Record<Language, HelpContent> = {
  en: {
    pageDescriptions: {
      sources: "Manage source inputs: text, files, URLs, and reliability.",
      gddStudio: "Build, edit, and compare your active game design document.",
      auditLab: "Evaluate documentation quality and section completeness.",
      scorecard: "Score design quality manually across weighted categories.",
      insightCenter: "Compare audit and scorecard signals to find alignment gaps.",
      actionTracker: "Track issues from weak sections, conflicts, and score mismatches.",
      governance: "Review logs, approval gates, and readiness signals.",
      settings: "Manage language, imports/exports, and workspace safety options.",
    },
    tooltips: {
      auditScore:
        "Measures documentation quality based on section completeness, clarity, and support.",
      scorecardTotal: "Represents manual evaluation of design quality.",
      dualRadar: "Compares document quality and design quality across categories.",
      issueGeneration:
        "Creates issues from weak/missing audit sections and large audit-scorecard mismatches.",
      approvalGates: "Execution-readiness signals derived from audit and issue status.",
      confidenceSummary: "Estimated confidence based on evidence quality and section health.",
      sourceReliability: "Reliability indicates how trustworthy a source is for decision-making.",
      docxUpload: "DOCX files are parsed into heading/content blocks and mapped to canonical sections.",
      jsonImportExport: "Export/import full workspace snapshots for backup and transfer.",
    },
    sectionDescriptions: {
      latestAudit: "Latest document-quality result for the active GDD version, with parser coverage context.",
      topGaps: "Largest gaps between documentation quality and design quality.",
      sourceQuality: "How reliable and useful your current sources are.",
      approvalGates: "Readiness checks based on quality and risk signals.",
    },
    guide: {
      title: "How to Use Game Design OS",
      intro: "Follow this workflow to move from raw materials to actionable decisions.",
      coreLogic:
        "Core logic: Audit = document quality, Scorecard = design quality, Insight = gap between the two, Action = what to fix next.",
      steps: [
        { title: "Step 1 - Create or select a project", description: "A project is your workspace for versions, audits, and issues." },
        {
          title: "Step 2 - Add your source materials",
          description:
            "Add text, markdown/txt, URL, or DOCX sources. Set source type and reliability before saving.",
        },
        {
          title: "Step 3 - Build or edit your GDD",
          description:
            "Use GDD Studio to generate a starter version from sources, then refine each section.",
        },
        { title: "Step 4 - Run Audit", description: "Audit checks document quality and section readiness." },
        {
          title: "Step 5 - Fill the Scorecard",
          description: "Scorecard records manual design-quality evaluation with weighted categories.",
        },
        {
          title: "Step 6 - Read the Insight comparison",
          description: "Use dual radar and deltas to compare Audit vs Scorecard alignment.",
        },
        {
          title: "Step 7 - Create and manage Issues",
          description:
            "Convert weak areas, contradictions, and large mismatches into trackable action items.",
        },
        {
          title: "Step 8 - Review Governance and export outputs",
          description: "Review logs/gates and export JSON or DOCX deliverables for sharing.",
        },
      ],
    },
  },
  vi: {
    pageDescriptions: {
      sources: "Quan ly dau vao tu text, file, URL, va do tin cay nguon.",
      gddStudio: "Xay dung, chinh sua, va so sanh GDD dang hoat dong.",
      auditLab: "Danh gia chat luong tai lieu va do day du cua section.",
      scorecard: "Cham diem thu cong chat luong thiet ke theo trong so.",
      insightCenter: "So sanh Audit va Scorecard de tim khoang cach can xu ly.",
      actionTracker: "Theo doi issues tu diem yeu, mau thuan, va do lech diem.",
      governance: "Xem logs, approval gates, va tin hieu san sang.",
      settings: "Quan ly ngon ngu, import/export, va tuy chon an toan du lieu.",
    },
    tooltips: {
      auditScore: "Do chat luong tai lieu dua tren do day du, do ro rang, va bang chung.",
      scorecardTotal: "Tong diem danh gia thu cong cho chat luong thiet ke.",
      dualRadar: "So sanh chat luong tai lieu va chat luong thiet ke theo tung nhom.",
      issueGeneration:
        "Tao issue tu section weak/missing va do lech lon giua audit va scorecard.",
      approvalGates: "Tin hieu san sang thuc thi dua tren audit va tinh trang issue.",
      confidenceSummary: "Muc do tu tin uoc tinh dua tren chat luong bang chung va section.",
      sourceReliability: "Do tin cay cho biet nguon co dang tin de ra quyet dinh hay khong.",
      docxUpload: "File DOCX duoc chuyen thanh van ban tho va luu thanh source.",
      jsonImportExport: "Xuat/nhap snapshot toan bo workspace de backup hoac chuyen giao.",
    },
    sectionDescriptions: {
      latestAudit: "Ket qua chat luong tai lieu moi nhat cua version dang chon.",
      topGaps: "Khoang cach lon nhat giua chat luong tai lieu va thiet ke.",
      sourceQuality: "Do tin cay va do huu ich cua cac nguon hien tai.",
      approvalGates: "Kiem tra muc do san sang dua tren chat luong va rui ro.",
    },
    guide: {
      title: "Huong Dan Su Dung Game Design OS",
      intro: "Lam theo quy trinh nay de di tu dau vao tho den quyet dinh hanh dong.",
      coreLogic:
        "Logic cot loi: Audit = chat luong tai lieu, Scorecard = chat luong thiet ke, Insight = khoang cach giua hai ben, Action = viec can sua tiep theo.",
      steps: [
        { title: "Buoc 1 - Tao hoac chon project", description: "Project la workspace de quan ly version, audit, va issue." },
        {
          title: "Buoc 2 - Them tai lieu nguon",
          description: "Them text, markdown/txt, URL, hoac DOCX. Chon type va reliability truoc khi luu.",
        },
        {
          title: "Buoc 3 - Xay dung hoac chinh sua GDD",
          description: "Dung GDD Studio de tao ban nhap tu source roi tinh chinh tung section.",
        },
        { title: "Buoc 4 - Chay Audit", description: "Audit kiem tra chat luong tai lieu va muc do san sang cua section." },
        {
          title: "Buoc 5 - Dien Scorecard",
          description: "Scorecard ghi nhan danh gia thu cong chat luong thiet ke theo trong so.",
        },
        {
          title: "Buoc 6 - Doc Insight so sanh",
          description: "Dung dual radar va delta de xem muc do khop giua Audit va Scorecard.",
        },
        {
          title: "Buoc 7 - Tao va quan ly Issues",
          description: "Chuyen diem yeu, mau thuan, va lech lon thanh action items theo doi duoc.",
        },
        {
          title: "Buoc 8 - Xem Governance va xuat ket qua",
          description: "Xem logs/gates va xuat JSON hoac DOCX de chia se.",
        },
      ],
    },
  },
};

export function getHelpContent(language: Language): HelpContent {
  return helpContent[language];
}
