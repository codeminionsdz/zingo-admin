import directory from "./data/algerian-administrative-areas.json";

export type Commune = { code: number; nameFr: string; nameAr: string };
export type Wilaya = {
  code: number;
  nameFr: string;
  nameAr: string;
  communes: Commune[];
};
export type AdministrativeAreaSelection = {
  wilayaCode: number | null;
  communeCode: number | null;
};

export const algerianWilayas = directory as Wilaya[];

export function getWilaya(code: number | null | undefined): Wilaya | undefined {
  return algerianWilayas.find((wilaya) => wilaya.code === code);
}

export function getCommune(
  wilayaCode: number | null | undefined,
  communeCode: number | null | undefined,
): Commune | undefined {
  return getWilaya(wilayaCode)?.communes.find(
    (commune) => commune.code === communeCode,
  );
}

export function selectWilaya(
  selection: AdministrativeAreaSelection,
  wilayaCode: number,
): AdministrativeAreaSelection {
  if (!getWilaya(wilayaCode)) return { wilayaCode: null, communeCode: null };
  return {
    wilayaCode,
    communeCode:
      selection.wilayaCode === wilayaCode &&
      getCommune(wilayaCode, selection.communeCode)
        ? selection.communeCode
        : null,
  };
}

export function selectCommune(
  selection: AdministrativeAreaSelection,
  communeCode: number,
): AdministrativeAreaSelection {
  return getCommune(selection.wilayaCode, communeCode)
    ? { ...selection, communeCode }
    : { ...selection, communeCode: null };
}

export function normalizeAreaName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function matchesName(
  input: string | null | undefined,
  names: (string | null | undefined)[],
) {
  const normalized = normalizeAreaName(input);
  return (
    normalized.length > 0 &&
    names.some((name) => normalizeAreaName(name) === normalized)
  );
}

export function resolveReverseGeocode(result: {
  region?: string | null;
  city?: string | null;
  subregion?: string | null;
  district?: string | null;
}): { wilayaCode: number; communeCode: number } | null {
  const wilaya = algerianWilayas.find((candidate) =>
    matchesName(result.region, [candidate.nameFr, candidate.nameAr]),
  );
  if (!wilaya) return null;

  const commune = wilaya.communes.find((candidate) =>
    [result.city, result.subregion, result.district].some((value) =>
      matchesName(value, [candidate.nameFr, candidate.nameAr]),
    ),
  );
  return commune
    ? { wilayaCode: wilaya.code, communeCode: commune.code }
    : null;
}

export function listingMatchesArea(
  listingWilaya: string | null,
  listingLocality: string | null,
  wilayaCode: number,
  communeCode: number,
  listingWilayaCode: number | null = null,
  listingCommuneCode: number | null = null,
): boolean {
  const wilaya = getWilaya(wilayaCode);
  const commune = getCommune(wilayaCode, communeCode);
  return Boolean(
    wilaya &&
    commune &&
    (listingWilayaCode !== null
      ? listingWilayaCode === wilayaCode
      : matchesName(listingWilaya, [wilaya.nameFr, wilaya.nameAr])) &&
    (listingCommuneCode !== null
      ? listingCommuneCode === communeCode
      : matchesName(listingLocality, [commune.nameFr, commune.nameAr])),
  );
}
