import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-7xl font-bold grad-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route doesn't exist in OmniFlow.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl grad-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
