export default function VideoCreditLine({text}) {
 const parts = text.split(/(https:\/\/[^\s<>"']+)/g);
 return <>{parts.map((part, index) => {
  if (!part.startsWith('https://')) return <span key={index}>{part}</span>;
  let url;
  try { url = new URL(part); } catch { return <span key={index}>{part}</span>; }
  if (url.protocol !== 'https:' || url.username || url.password) return <span key={index}>{part}</span>;
  return <a key={index} href={url.href} target="_blank" rel="noopener noreferrer" className="text-link underline underline-offset-4">{part}</a>;
 })}</>;
}