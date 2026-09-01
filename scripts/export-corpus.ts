import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { activeCorpus } from "../src/ai/corpus";

mkdirSync("nlp/data", { recursive: true });
writeFileSync("nlp/data/corpus_v1.json", JSON.stringify(activeCorpus, null, 2) + "\n");
console.log(`Exported ${activeCorpus.examples.length} examples from corpus ${activeCorpus.version}.`);
