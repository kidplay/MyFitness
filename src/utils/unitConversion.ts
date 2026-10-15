import { UnitSystem } from '../types';

export const KG_TO_LBS = 2.20462262;
export const LBS_TO_KG = 0.45359237;
export const CM_TO_INCH = 0.393700787;
export const INCH_TO_CM = 2.54;
export const GRAM_TO_OZ = 0.0352739619;
export const OZ_TO_GRAM = 28.3495231;
export const ML_TO_FLOZ = 0.0338140227;
export const FLOZ_TO_ML = 29.5735296;

/** Convert kg to lbs with desired precision */
export function kgToLbs(kg: number, precision = 1): number {
  if (kg === undefined || kg === null || isNaN(kg)) return 0;
  return Number((kg * KG_TO_LBS).toFixed(precision));
}

/** Convert lbs to kg with desired precision */
export function lbsToKg(lbs: number, precision = 1): number {
  if (lbs === undefined || lbs === null || isNaN(lbs)) return 0;
  return Number((lbs * LBS_TO_KG).toFixed(precision));
}

/** Convert cm to feet and remaining inches */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  if (!cm || isNaN(cm) || cm <= 0) return { feet: 5, inches: 10 };
  const totalInches = Math.round(cm * CM_TO_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet: Math.max(1, feet), inches: Math.max(0, inches) };
}

/** Convert feet and inches to cm */
export function feetInchesToCm(feet: number, inches: number): number {
  const f = Math.max(0, Number(feet) || 0);
  const i = Math.max(0, Math.min(11, Number(inches) || 0));
  const totalInches = f * 12 + i;
  return Math.round(totalInches * INCH_TO_CM);
}

/** Convert grams to ounces */
export function gramsToOz(grams: number, precision = 1): number {
  if (grams === undefined || grams === null || isNaN(grams)) return 0;
  return Number((grams * GRAM_TO_OZ).toFixed(precision));
}

/** Convert ounces to grams */
export function ozToGrams(oz: number, precision = 0): number {
  if (oz === undefined || oz === null || isNaN(oz)) return 0;
  return Number((oz * OZ_TO_GRAM).toFixed(precision));
}

/** Convert ml to fl oz */
export function mlToFlOz(ml: number, precision = 0): number {
  if (ml === undefined || ml === null || isNaN(ml)) return 0;
  return Number((ml * ML_TO_FLOZ).toFixed(precision));
}

/** Convert fl oz to ml */
export function flOzToMl(flOz: number, precision = 0): number {
  if (flOz === undefined || flOz === null || isNaN(flOz)) return 0;
  return Number((flOz * FLOZ_TO_ML).toFixed(precision));
}

/** Formatted weight string based on active unit system */
export function formatWeight(
  kg: number,
  unitSystem: UnitSystem = 'metric',
  includeUnit = true,
  precision = 1
): string {
  if (kg === undefined || kg === null || isNaN(kg)) {
    return includeUnit ? (unitSystem === 'imperial' ? '0 lbs' : '0 kg') : '0';
  }
  if (unitSystem === 'imperial') {
    const val = kgToLbs(kg, precision);
    return includeUnit ? `${val} lbs` : `${val}`;
  }
  const val = Number(kg.toFixed(precision));
  return includeUnit ? `${val} kg` : `${val}`;
}

/** Numeric weight value for inputs in current unit system */
export function getWeightInputValue(kg: number, unitSystem: UnitSystem = 'metric'): number {
  if (kg === undefined || kg === null || isNaN(kg)) return 0;
  if (unitSystem === 'imperial') {
    return kgToLbs(kg, 1);
  }
  return Number(kg.toFixed(1));
}

/** Convert an input weight string back to canonical internal storage (kg) */
export function parseWeightInputToKg(value: number | string, unitSystem: UnitSystem = 'metric'): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num || isNaN(num) || num <= 0) return 0;
  if (unitSystem === 'imperial') {
    return lbsToKg(num, 2);
  }
  return Number(num.toFixed(1));
}

/** Formatted height string based on active unit system */
export function formatHeight(cm: number, unitSystem: UnitSystem = 'metric'): string {
  if (!cm || isNaN(cm)) return unitSystem === 'imperial' ? `5'10"` : '178 cm';
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

/** Formatted macro value (g or oz) */
export function formatMacro(
  grams: number,
  unitSystem: UnitSystem = 'metric',
  precision = 1
): string {
  if (grams === undefined || grams === null || isNaN(grams)) {
    return unitSystem === 'imperial' ? '0 oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    const oz = gramsToOz(grams, precision);
    return `${oz} oz`;
  }
  return `${Math.round(grams)}g`;
}

/** Dual macro label: e.g. "150g (5.3 oz)" or "5.3 oz (150g)" */
export function formatMacroDual(grams: number, unitSystem: UnitSystem = 'metric'): string {
  const g = Math.round(grams || 0);
  const oz = gramsToOz(grams || 0, 1);
  if (unitSystem === 'imperial') {
    return `${oz} oz (${g}g)`;
  }
  return `${g}g (${oz} oz)`;
}

/** Formatted liquid volume (ml or fl oz) */
export function formatLiquidVolume(
  ml: number,
  unitSystem: UnitSystem = 'metric'
): string {
  if (ml === undefined || ml === null || isNaN(ml)) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0 ml';
  }
  if (unitSystem === 'imperial') {
    const flOz = Math.round(ml * ML_TO_FLOZ);
    return `${flOz} fl oz`;
  }
  return `${Math.round(ml)} ml`;
}

/** Formatted workout lifting weight (kg or lbs) */
export function formatWorkoutWeight(
  weightKg: number,
  unitSystem: UnitSystem = 'metric',
  includeUnit = true
): string {
  if (weightKg === undefined || weightKg === null || isNaN(weightKg)) {
    return includeUnit ? (unitSystem === 'imperial' ? '0 lbs' : '0 kg') : '0';
  }
  if (unitSystem === 'imperial') {
    const lbs = Math.round(weightKg * KG_TO_LBS);
    return includeUnit ? `${lbs} lbs` : `${lbs}`;
  }
  const kg = Number(weightKg.toFixed(1));
  return includeUnit ? `${kg} kg` : `${kg}`;
}
