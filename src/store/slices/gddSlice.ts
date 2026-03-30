import { StateCreator } from "zustand";
import mammoth from "mammoth";
import type { AppStore, GddSlice } from "../types";
import type { GddVersion } from "@/domain/models";

export const createGddSlice: StateCreator<AppStore, [], [], GddSlice> = (set) => ({
  gddVersions: [],

  addGddVersion: (version) =>
    set((state) => ({
      gddVersions: [...state.gddVersions, version],
    })),

  updateGddVersion: (id, updates) =>
    set((state) => ({
      gddVersions: state.gddVersions.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),

  updateGddSection: (versionId, sectionKey, updates) =>
    set((state) => ({
      gddVersions: state.gddVersions.map((v) => {
        if (v.id !== versionId) return v;
        return {
          ...v,
          sections: v.sections.map((s) => (s.key === sectionKey ? { ...s, ...updates } : s)),
        };
      }),
    })),

  importGddVersion: async (projectId, file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Cấu hình StyleMap để Mammoth không xóa bảng (Table)
      const options = {
        styleMap: [
          "table => table.version-table:fresh",
          "tr => tr",
          "td => td"
        ]
      };

      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      const html = result.value; // Nội dung HTML đã giữ lại cấu trúc table cơ bản

      if (!html || html.trim() === "") {
        throw new Error("File content is empty or unreadable.");
      }

      const newVersion: GddVersion = {
        // Dùng Date.now() để an toàn hơn crypto trong môi trường build Vercel
        id: `gdd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        projectId,
        name: file.name.replace(".docx", ""),
        createdAt: new Date().toISOString(),
        // Lưu trữ HTML thô để giữ định dạng bảng cho đến khi Render
        sections: [
          {
            id: `sec_${Date.now()}`,
            key: "imported_content",
            title: "Imported Content",
            content: html, 
            status: "strong",
          },
        ],
        summary: `Imported from ${file.name}`,
      };

      set((state) => ({
        gddVersions: [...state.gddVersions, newVersion],
      }));

      return newVersion.id;
    } catch (error) {
      console.error("GDD Import Error:", error);
      throw error;
    }
  },

  deleteGddVersion: (id) =>
    set((state) => ({
      gddVersions: state.gddVersions.filter((v) => v.id !== id),
    })),
});