// Seedable PRNG (mulberry32). The Java source uses unseeded java.util.Random, so bit-exact
// parity is impossible; a seed makes every port run reproducible instead.
export function createRng(seed){
 let a=seed>>>0;
 const double=()=>{
  a=(a+0x6D2B79F5)>>>0;
  let t=a;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return((t^(t>>>14))>>>0)/4294967296;
 };
 return {double,int:n=>Math.floor(double()*n),bool:()=>double()<0.5};
}