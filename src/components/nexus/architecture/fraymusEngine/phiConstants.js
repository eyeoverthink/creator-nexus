// Port of fraymus/PhiConstants.java (only the constants the engine loop uses).
export const PHI=(1+Math.sqrt(5))/2;
export const PSI=1.324717957244746;
export const OMEGA=0.5671432904097838;
export const XI=Math.E;
export const LAMBDA=Math.PI;
export const ZETA=1.2020569031595942;
export const PHI_INVERSE=1/PHI;
export const PHI_CUBED=PHI*PHI*PHI;
export const HARMONIC_LOWER=432;
export const HARMONIC_UPPER=528;
export const applyHarmonicLaw=f=>(f<HARMONIC_LOWER||f>HARMONIC_UPPER?HARMONIC_LOWER:f);