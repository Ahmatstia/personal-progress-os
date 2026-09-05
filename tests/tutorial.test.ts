import { describe, it, expect } from "vitest";
import {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_NODES,
  TUTORIAL_CHAPTERS,
  FEATURE_RELATIONS,
  REAL_LIFE_STORYBOARD,
} from "../src/app/(app)/tutorial/tutorial-data";

describe("Interactive Tutorial & Architecture Nexus Dataset", () => {
  // 1. ARCHITECTURE LAYERS & NODES
  describe("Architecture Nodes & Layers", () => {
    it("defines 5 architectural layers", () => {
      expect(ARCHITECTURE_LAYERS.length).toBe(5);
      const layerIds = ARCHITECTURE_LAYERS.map((l) => l.id);
      expect(layerIds).toContain("CORE");
      expect(layerIds).toContain("DIRECTION");
      expect(layerIds).toContain("EXECUTION");
      expect(layerIds).toContain("TEMPORAL");
      expect(layerIds).toContain("INTELLIGENCE");
    });

    it("has valid nodes with proper connections", () => {
      expect(ARCHITECTURE_NODES.length).toBeGreaterThanOrEqual(12);
      const validNodeIds = new Set(ARCHITECTURE_NODES.map((n) => n.id));

      for (const node of ARCHITECTURE_NODES) {
        expect(node.id).toBeTruthy();
        expect(node.name).toBeTruthy();
        expect(node.shortDescription).toBeTruthy();
        expect(node.layer).toBeTruthy();

        // Every connectedTo ID must exist in validNodeIds
        for (const connId of node.connectedTo) {
          expect(
            validNodeIds.has(connId),
            `Node '${node.id}' connects to unknown node '${connId}'`
          ).toBe(true);
        }
      }
    });
  });

  // 2. TUTORIAL CHAPTERS
  describe("Tutorial Chapters (10 Chapters)", () => {
    it("contains exactly 10 comprehensive chapters from Bab 0 to Bab 9", () => {
      expect(TUTORIAL_CHAPTERS.length).toBe(10);
    });

    it("ensures each chapter is thoroughly detailed", () => {
      for (const chapter of TUTORIAL_CHAPTERS) {
        expect(chapter.id).toBeTruthy();
        expect(chapter.title).toBeTruthy();
        expect(chapter.badge).toBeTruthy();
        expect(chapter.purpose).toBeTruthy();
        expect(chapter.whyItMatters.length).toBeGreaterThan(30);
        expect(chapter.stepByStepGuide.length).toBeGreaterThanOrEqual(3);
        expect(chapter.proTips.length).toBeGreaterThanOrEqual(1);
        expect(chapter.commonMistakes.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("includes Bab 0 for Authentication & Access Code", () => {
      const authChapter = TUTORIAL_CHAPTERS.find((c) => c.id === "auth-chapter");
      expect(authChapter).toBeDefined();
      expect(authChapter?.title).toContain("Bab 0: Otentikasi");
      expect(authChapter?.whyItMatters).toContain("AUTH_ACCESS_CODE");
    });
  });

  // 3. FEATURE RELATIONS MATRIX
  describe("Feature Relations Matrix (Fitur A ↔ Fitur B)", () => {
    it("contains core entity relationship pairs", () => {
      expect(FEATURE_RELATIONS.length).toBeGreaterThanOrEqual(8);
      const validNodeIds = new Set(ARCHITECTURE_NODES.map((n) => n.id));

      for (const relation of FEATURE_RELATIONS) {
        expect(validNodeIds.has(relation.fromId)).toBe(true);
        expect(validNodeIds.has(relation.toId)).toBe(true);
        expect(relation.summary).toBeTruthy();
        expect(relation.howToUseTogether.length).toBeGreaterThanOrEqual(2);
        expect(relation.dataFlowDescription).toBeTruthy();
        expect(relation.realWorldExample).toBeTruthy();
      }
    });
  });

  // 4. REAL-LIFE STORYBOARD
  describe("Real-Life 7-Day Storyboard", () => {
    it("contains sequential day-by-day steps", () => {
      expect(REAL_LIFE_STORYBOARD.length).toBe(7);
      for (let i = 0; i < REAL_LIFE_STORYBOARD.length; i++) {
        expect(REAL_LIFE_STORYBOARD[i].stepNumber).toBe(i + 1);
        expect(REAL_LIFE_STORYBOARD[i].title).toBeTruthy();
        expect(REAL_LIFE_STORYBOARD[i].userAction).toBeTruthy();
        expect(REAL_LIFE_STORYBOARD[i].systemResponse).toBeTruthy();
        expect(REAL_LIFE_STORYBOARD[i].lesson).toBeTruthy();
      }
    });
  });
});
