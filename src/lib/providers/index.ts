import type { TaxProfile } from "../types";
import { mockProfile } from "../mock-data";
import { fetchCodefProfile } from "./codef";

export async function getTaxProfile(): Promise<TaxProfile> {
  if (process.env.DATA_SOURCE === "codef") {
    return fetchCodefProfile();
  }
  return { ...mockProfile, fetchedAt: new Date().toISOString() };
}
