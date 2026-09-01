const informalWords: Record<string, string> = { yg: "yang", dgn: "dengan", dg: "dengan", gak: "tidak", ga: "tidak", nggak: "tidak", ngerjain: "mengerjakan", kerjain: "mengerjakan", hrs: "harus", sy: "saya", skrg: "sekarang", blm: "belum" };

export function normalizeText(input: string) {
  return input.toLocaleLowerCase("id-ID").trim().replace(/[!?.,;:()[\]{}"']/g, " ").split(/\s+/).filter(Boolean).map((word) => informalWords[word] ?? word).join(" ");
}
