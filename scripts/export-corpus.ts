import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { activeCorpus, corpusV2, corpusV3 } from "../src/ai/corpus";

mkdirSync("nlp/data", { recursive: true });
const corpus = process.argv.includes("--v3") ? corpusV3 : process.argv.includes("--v2") ? corpusV2 : activeCorpus;
const output = `nlp/data/corpus_v${corpus.version[0]}.json`;
writeFileSync(output, JSON.stringify(corpus, null, 2) + "\n");
console.log(`Exported ${corpus.examples.length} examples from corpus ${corpus.version}.`);
