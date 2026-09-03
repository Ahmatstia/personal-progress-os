const informalWords: Record<string, string> = {
  // Existing baseline mappings (Must retain exact for tests)
  yg: "yang",
  dgn: "dengan",
  dg: "dengan",
  gak: "tidak",
  ga: "tidak",
  nggak: "tidak",
  ngerjain: "mengerjakan",
  kerjain: "mengerjakan",
  hrs: "harus",
  sy: "saya",
  skrg: "sekarang",
  blm: "belum",

  // Extended Indonesian slang & abbreviations
  kalo: "kalau",
  kl: "kalau",
  bikin: "buat",
  bikinin: "buatkan",
  buatin: "buatkan",
  bwt: "buat",
  bs: "bisa",
  bisaa: "bisa",
  tolong: "tolong",
  tlng: "tolong",
  tlg: "tolong",
  plz: "tolong",
  pls: "tolong",
  please: "tolong",
  bener: "benar",
  udh: "sudah",
  sdh: "sudah",
  dah: "sudah",
  udah: "sudah",
  beres: "selesai",
  kelar: "selesai",
  slsai: "selesai",
  kelarin: "selesaikan",
  selesain: "selesaikan",
  hps: "hapus",
  apus: "hapus",
  delete: "hapus",
  del: "hapus",
  remove: "hapus",
  buang: "hapus",
  ilangin: "hapus",
  hilangkan: "hapus",
  cancel: "batalkan",
  batalin: "batalkan",
  nyalain: "mulai",
  start: "mulai",
  stop: "akhiri",
  selese: "selesai",
  sm: "sama",
  ama: "sama",
  utk: "untuk",
  untk: "untuk",
  bbrp: "beberapa",
  smua: "semua",
  smw: "semua",
  all: "semua",
  hariini: "hari ini",
  bsk: "besok",
  kmrn: "kemarin",
  mgkn: "mungkin",
  tpi: "tapi",
  tp: "tapi",
  gmn: "bagaimana",
  gimana: "bagaimana",
  kek: "seperti",
  gini: "begini",
  gitu: "begitu",
  bgt: "sangat",
  banget: "sangat",
  banyak: "banyak",
  byk: "banyak",
  tambahin: "tambahkan",
  add: "tambah",
  create: "buat",
  new: "baru",
};

export function normalizeText(input: string): string {
  if (!input) return "";
  return input
    .toLocaleLowerCase("id-ID")
    .trim()
    .replace(/[!?.,;:()[\]{}"']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => informalWords[word] ?? word)
    .join(" ");
}

export function tokenize(input: string): string[] {
  return normalizeText(input).split(/\s+/).filter(Boolean);
}
