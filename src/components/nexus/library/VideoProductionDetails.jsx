import VideoCreditLine from '@/components/nexus/library/VideoCreditLine';
export default function VideoProductionDetails({production}) {
 const report = production?.director, credits = production?.credits || [];
 if (!report && !credits.length) return null;
 const status = report?.enabled === false ? 'Disabled' : report?.fallback === true ? 'Heuristic fallback' : report?.fallback === false ? 'Model scene plan' : 'Report available';
 return <section aria-label="Production details" className="space-y-5 border-t border-border pt-5">
  {report && <div className="space-y-3">
   <h2 className="font-heading text-sm">Visual Director</h2>
   <p className="text-sm">{status}</p>
   {report.reason && <p className="break-words text-sm text-muted-foreground">{report.reason}</p>}
   <dl className="space-y-2 text-xs text-muted-foreground">
    {report.model && <div><dt className="inline">Model: </dt><dd className="inline break-words">{report.model}</dd></div>}
    {report.status && <div><dt className="inline">Reported status: </dt><dd className="inline break-words">{report.status}</dd></div>}
    {report.attempts !== null && <div><dt className="inline">Attempts: </dt><dd className="inline">{report.attempts}</dd></div>}
    {report.seconds !== null && <div><dt className="inline">Planning time: </dt><dd className="inline">{report.seconds.toFixed(1)} s</dd></div>}
   </dl>
   {!!(report.repairs.length || report.errors.length) && <details className="text-xs text-muted-foreground">
    <summary className="cursor-pointer">Validation and repairs</summary>
    <ul className="mt-2 list-disc space-y-2 break-words pl-4">
     {report.errors.map((error, index) => <li key={'error-' + index}>Attempt {error.attempt}: {error.message}</li>)}
     {report.repairs.map((repair, index) => <li key={'repair-' + index}>{repair}</li>)}
    </ul>
   </details>}
  </div>}
  {!!credits.length && <div className="space-y-2">
   <h2 className="font-heading text-sm">Image credits and disclosures</h2>
   <ul className="space-y-2 break-words text-sm text-muted-foreground">{credits.map((credit, index) => <li key={index}><VideoCreditLine text={credit}/></li>)}</ul>
   <p className="text-xs text-muted-foreground">Reported by the renderer. Image rights and screening are not verified here.</p>
  </div>}
 </section>;
}