import { describe, it, expect } from "vitest";
import {
  USER_NEEDS_GUIDES,
  MENU_EXPLANATIONS,
  FEATURE_CONNECTIONS,
  DAILY_WORKFLOW,
} from "../src/app/(app)/tutorial/tutorial-data";

describe("User-Centric Tutorial Dataset Verification", () => {
  // 1. PANDUAN BERDASARKAN KEBUTUHAN PENGGUNA ("SAYA INGIN...")
  describe("User Needs Guides", () => {
    it("has comprehensive guides answering 'Saya ingin...'", () => {
      expect(USER_NEEDS_GUIDES.length).toBeGreaterThanOrEqual(6);
      for (const need of USER_NEEDS_GUIDES) {
        expect(need.userGoal).toBeTruthy();
        expect(need.problemSolved).toBeTruthy();
        expect(need.recommendedFeature).toBeTruthy();
        expect(need.route.startsWith("/")).toBe(true);
        expect(need.howToSteps.length).toBeGreaterThanOrEqual(3);
        expect(need.whyThisFeature).toBeTruthy();
        expect(need.connectedTo).toBeTruthy();
      }
    });

    it("covers essential life goals: plan hidup, proyek, tugas harian, dan ide", () => {
      const goalsText = USER_NEEDS_GUIDES.map((n) => n.userGoal).join(" ");
      expect(goalsText).toContain("arah dan tujuan hidup");
      expect(goalsText).toContain("proyek");
      expect(goalsText).toContain("tugas-tugas harian");
      expect(goalsText).toContain("ide");
    });
  });

  // 2. PENJELASAN MENU BAHASA MANUSIA BIASA
  describe("Menu Explanations", () => {
    it("covers all primary and domain menus in the application", () => {
      expect(MENU_EXPLANATIONS.length).toBeGreaterThanOrEqual(9);
      for (const item of MENU_EXPLANATIONS) {
        expect(item.menuName).toBeTruthy();
        expect(item.simpleExplanation.length).toBeGreaterThan(20);
        expect(item.whatYouCanDo.length).toBeGreaterThanOrEqual(2);
        expect(item.stepByStep.length).toBeGreaterThanOrEqual(2);
        expect(item.tips).toBeTruthy();
      }
    });
  });

  // 3. CARA FITUR SALING MEMBANTU
  describe("Feature Connections (Hubungan Timbal Balik)", () => {
    it("explains relationships with simple analogies and concrete examples", () => {
      expect(FEATURE_CONNECTIONS.length).toBeGreaterThanOrEqual(4);
      for (const conn of FEATURE_CONNECTIONS) {
        expect(conn.title).toBeTruthy();
        expect(conn.analogy).toBeTruthy();
        expect(conn.step1.name).toBeTruthy();
        expect(conn.step2.name).toBeTruthy();
        expect(conn.howTheyHelpYou).toBeTruthy();
        expect(conn.practicalExample).toBeTruthy();
      }
    });
  });

  // 4. ALUR KERJA HARIAN
  describe("Daily Workflow Phases", () => {
    it("provides 4 logical phases from morning to weekend review", () => {
      expect(DAILY_WORKFLOW.length).toBe(4);
      for (const wf of DAILY_WORKFLOW) {
        expect(wf.time).toBeTruthy();
        expect(wf.phaseName).toBeTruthy();
        expect(wf.whatYouFeel).toBeTruthy();
        expect(wf.whatYouShouldDo).toBeTruthy();
        expect(wf.menuToOpen).toBeTruthy();
        expect(wf.route.startsWith("/")).toBe(true);
      }
    });
  });
});
