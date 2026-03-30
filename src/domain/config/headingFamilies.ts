export type HeadingFamily = {
  family: string;
  cues: string[];
};

export const HEADING_FAMILIES: HeadingFamily[] = [
  {
    family: "document_framing",
    cues: [
      "muc dich tai lieu",
      "vai tro cua ban gdd nay",
      "document purpose",
      "document scope",
      "current direction",
    ],
  },
  {
    family: "audience_cluster",
    cues: [
      "target audience",
      "nguoi choi muc tieu",
      "audience summary",
      "dong luc quay lai",
      "pain points",
    ],
  },
  {
    family: "loop_mechanics_cluster",
    cues: [
      "core gameplay loop",
      "moment to moment loop",
      "core tension model",
      "mechanics systems",
      "cup system",
      "physics rules",
      "merge order fail state",
      "queue bias",
      "numeric tuning",
      "danger window",
      "grace window",
      "continue recovery",
    ],
  },
  {
    family: "economy_progression_cluster",
    cues: ["progression", "retention", "meta", "economy", "reward flow", "monetization"],
  },
  {
    family: "production_risk_cluster",
    cues: ["scope", "production", "risks", "assumptions", "kpi", "metrics", "self audit"],
  },
  {
    family: "appendix_cluster",
    cues: ["appendix", "phu luc", "supporting notes", "reference notes", "tai lieu tham chieu"],
  },
];
