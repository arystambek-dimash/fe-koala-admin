import { ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ForbiddenPage() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-6 w-6 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to access this dashboard. Only administrators can access this platform.
        </p>

        <div className="mt-6">
          <button
            onClick={logout}
            className="rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;
