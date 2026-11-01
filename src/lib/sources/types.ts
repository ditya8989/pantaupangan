export type PriceRecord = {
  /** Kode komoditas di sumber (PIHPS: `comcat_id`, mis. "com_16"). */
  commodityCode: string;
  /** `null` = nasional; selain itu nama provinsi seperti tertulis di sumber. */
  provinceName: string | null;
  /** "YYYY-MM-DD" */
  date: string;
  /** Rupiah, bilangan bulat. */
  price: number;
};

export type FetchPricesParams = {
  /** "YYYY-MM-DD", inklusif */
  startDate: string;
  /** "YYYY-MM-DD", inklusif */
  endDate: string;
  commodityCodes: readonly string[];
};

export type FetchPricesResult = {
  records: PriceRecord[];
  warnings: string[];
};

/** Semua sumber data memakai interface yang sama (PRD §4), sehingga bisa diganti lewat DATA_SOURCE. */
export interface PriceSource {
  readonly name: "pihps" | "mock";
  fetchPrices(params: FetchPricesParams): Promise<FetchPricesResult>;
}

/** Respons sumber tidak sesuai format yang dikenal: run harus gagal, bukan menyimpan data rusak. */
export class SourceFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceFormatError";
  }
}
