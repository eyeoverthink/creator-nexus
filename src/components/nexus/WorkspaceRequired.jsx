import StudioEmptyState from '@/components/nexus/StudioEmptyState';
export default function WorkspaceRequired({access}){
 return <div className="min-h-64"><StudioEmptyState phase={access.boot.isPending?'loading':access.boot.error?'error':'empty'} creating={access.creating} error={access.createError||access.boot.error?.message} onCreate={access.createWorkspace} onRetry={()=>access.boot.refetch()}/></div>;
}