import Link from "next/link";
import { INITIAL_STORES } from "@/lib/stores-catalog";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
        That storefront does not exist
      </h1>
      <p className="text-sm text-neutral-400">
        The store you asked for is not part of the fleet. Pick one of the{" "}
        {INITIAL_STORES.length} active storefronts below.
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {INITIAL_STORES.map((store) => (
          <li key={store.id}>
            <Link
              href={`/stores/${store.id}`}
              className="inline-block rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-500 hover:text-white"
            >
              {store.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-sm underline underline-offset-4 text-neutral-300">
        Back to Mission Control
      </Link>
    </main>
  );
}
