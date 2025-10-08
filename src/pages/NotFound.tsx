import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Layout>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center space-y-3">
        <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Page not found</h1>
        <p className="text-neutral-600 dark:text-neutral-300">The page you were looking for could not be located. It may have been moved or removed.</p>
        <Link
          to="/"
          className="inline-flex w-fit items-center rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600"
        >
          Return home
        </Link>
      </section>
    </Layout>
  );
}
