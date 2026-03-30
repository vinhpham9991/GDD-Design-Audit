import type {
  ApprovalGate,
  AuditResult,
  ConfidenceItem,
  ConflictItem,
  DecisionLogEntry,
  EvidenceCoverageItem,
  GDDVersion,
  InsightReport,
  IssueItem,
  PassHistoryEntry,
  Project,
  RevisionLogEntry,
  Scorecard,
  SourceItem,
  SourceQualityItem,
} from "@/domain/models";

export interface SeedData {
  projects: Project[];
  sourceItems: SourceItem[];
  gddVersions: GDDVersion[];
  auditResults: AuditResult[];
  scorecards: Scorecard[];
  insightReports: InsightReport[];
  issues: IssueItem[];
  decisionLogs: DecisionLogEntry[];
  revisionLogs: RevisionLogEntry[];
  passHistory: PassHistoryEntry[];
  approvalGates: ApprovalGate[];
  confidenceItems: ConfidenceItem[];
  evidenceCoverageItems: EvidenceCoverageItem[];
  sourceQualityItems: SourceQualityItem[];
  conflictItems: ConflictItem[];
}

const now = new Date().toISOString();

export const seedData: SeedData = {
  projects: [
    {
      id: "proj_neon_forge",
      name: "Neon Forge Tactics",
      genre: "Tactical RPG",
      platform: "PC / Console",
      targetAudience: "Strategy players 18-35",
      status: "Drafting GDD",
      createdAt: now,
      updatedAt: now,
      currentVersionId: "gdd_v1",
    },
  ],
  sourceItems: [
    {
      id: "src_market_scan",
      title: "Market Benchmark Summary",
      type: "benchmark",
      content: "Top competitors focus on short run-time and replayability.",
      createdAt: now,
      updatedAt: now,
      reliability: "high",
      tags: ["market", "benchmark"],
    },
    {
      id: "src_player_interviews",
      title: "Player Interview Notes",
      type: "feedback",
      content: "Players request meaningful progression and low onboarding friction.",
      createdAt: now,
      updatedAt: now,
      reliability: "medium",
      tags: ["ux", "retention"],
    },
  ],
  gddVersions: [
    {
      id: "gdd_v1",
      projectId: "proj_neon_forge",
      name: "Version 1",
      createdAt: now,
      summary: "Initial cross-functional draft of core game loop and progression.",
      sections: [
        {
          id: "gdd_sec_overview",
          key: "game_overview",
          title: "Game Overview",
          content: "Squad-based tactical battles with short mission sessions and long-term upgrades.",
          status: "strong",
        },
        {
          id: "gdd_sec_loop",
          key: "core_gameplay_loop",
          title: "Core Gameplay Loop",
          content: "Mission prep -> tactical mission -> reward allocation -> upgrade cycle.",
          status: "strong",
        },
        {
          id: "gdd_sec_monetization",
          key: "monetization",
          title: "Monetization",
          content: "Premium game with cosmetic DLC roadmap and seasonal packs.",
          status: "medium",
        },
        {
          id: "gdd_sec_liveops",
          key: "live_ops",
          title: "Live Ops",
          content: "Live ops event cadence still undefined.",
          status: "weak",
        },
        {
          id: "gdd_sec_risk",
          key: "risks_assumptions",
          title: "Risks and Assumptions",
          content: "Assumes live ops team can support weekly events without additional hiring.",
          status: "weak",
        },
      ],
    },
  ],
  auditResults: [
    {
      id: "audit_v1",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      createdAt: now,
      overallScore: 69,
      readinessSummary: "Strong core loop, but live ops and execution details need reinforcement.",
      findings: [
        {
          sectionKey: "core_gameplay_loop",
          health: "strong",
          score: 84,
          unsupportedClaims: [],
          contradictions: [],
          gaps: ["Add KPI assumptions for mission completion time."],
        },
        {
          sectionKey: "live_ops",
          health: "weak",
          score: 44,
          unsupportedClaims: ["Retention uplift estimate lacks reference data."],
          contradictions: [],
          gaps: ["Define event cadence and tooling requirements."],
          rewriteBrief: "Outline seasonal event framework with metrics and staffing.",
        },
      ],
    },
  ],
  scorecards: [
    {
      id: "scorecard_design_review",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      reviewer: "Lead Designer",
      createdAt: now,
      categoryScores: {
        core_loop_strength: 78,
        retention_potential: 72,
        progression_depth: 75,
        monetization_fit: 70,
        production_feasibility: 66,
        marketability: 80,
        ux_clarity: 77,
        hybrid_casual_fit: 71,
      },
      weightedTotal: 74.1,
      comments: "Promising gameplay direction, requires tighter risk planning.",
    },
  ],
  insightReports: [
    {
      id: "insight_v1",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      createdAt: now,
      auditScores: { core_loop_strength: 82, retention_potential: 55 },
      scorecardScores: { core_loop_strength: 78, retention_potential: 72 },
      deltas: { core_loop_strength: -4, retention_potential: 17 },
      summary: "Vision quality is strong but operations confidence is not yet evidence-backed.",
      strengths: ["Core loop clarity", "Tactical depth"],
      gaps: ["Live ops planning", "Retention evidence"],
      recommendations: [
        "Draft live ops calendar for first two seasons.",
        "Attach benchmark data to retention claims.",
      ],
    },
  ],
  issues: [
    {
      id: "issue_liveops_1",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      title: "Live Ops plan is under-defined",
      description: "Missing event cadence, staffing model, and KPI ownership.",
      linkedSection: "live_ops",
      priority: "high",
      severity: "high",
      status: "open",
      owner: "Producer",
      recommendation: "Create a two-quarter live ops execution plan.",
      createdAt: now,
      updatedAt: now,
    },
  ],
  decisionLogs: [
    {
      id: "decision_001",
      projectId: "proj_neon_forge",
      title: "Monetization baseline",
      decision: "Ship as premium title with cosmetic expansions.",
      rationale: "Preserves gameplay integrity and aligns with target audience sentiment.",
      createdAt: now,
      createdBy: "Creative Director",
    },
  ],
  revisionLogs: [
    {
      id: "revision_001",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      changeSummary: "Added tactical loop and progression assumptions.",
      createdAt: now,
      author: "Design Team",
    },
  ],
  passHistory: [
    {
      id: "pass_audit_seed",
      projectId: "proj_neon_forge",
      versionId: "gdd_v1",
      passType: "audit",
      label: "Initial Audit Pass",
      score: 69,
      createdAt: now,
    },
  ],
  approvalGates: [
    {
      id: "gate_preproduction",
      projectId: "proj_neon_forge",
      gateName: "Pre-Production Gate",
      status: "pending",
      owner: "Studio Director",
      updatedAt: now,
    },
  ],
  confidenceItems: [
    {
      id: "conf_core_loop",
      label: "Core loop confidence",
      score: 84,
      reason: "Validated through player interviews and benchmark patterns.",
    },
    {
      id: "conf_live_ops",
      label: "Live ops confidence",
      score: 52,
      reason: "Limited operational planning evidence.",
    },
  ],
  evidenceCoverageItems: [
    {
      id: "cov_core_loop",
      sectionKey: "core_gameplay_loop",
      coverage: 86,
      note: "Backed by interview synthesis and prototype assumptions.",
    },
    {
      id: "cov_live_ops",
      sectionKey: "live_ops",
      coverage: 42,
      note: "Needs empirical retention and staffing references.",
    },
  ],
  sourceQualityItems: [
    {
      id: "sq_market_scan",
      sourceId: "src_market_scan",
      qualityScore: 88,
      issues: [],
    },
    {
      id: "sq_player_interviews",
      sourceId: "src_player_interviews",
      qualityScore: 74,
      issues: ["Sample size not statistically representative."],
    },
  ],
  conflictItems: [
    {
      id: "conflict_001",
      statementA: "Low content cadence is sufficient post-launch.",
      statementB: "Weekly events are required to sustain retention.",
      severity: "medium",
      detectedAt: now,
    },
  ],
};
