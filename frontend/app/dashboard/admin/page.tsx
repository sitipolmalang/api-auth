import { redirect } from "next/navigation";
import { getAdminOverview } from "@/lib/api-auth";
import { requireAdminUser } from "@/lib/server-auth";
import { AppLinkButton, AppPanel, InfoTile } from "@/lib/ui";

export default async function AdminDashboardPage() {
  const { cookieHeader } = await requireAdminUser();

  const overviewResult = await getAdminOverview(cookieHeader);

  if (overviewResult.kind === "unauthorized") {
    redirect("/401");
  }
  if (overviewResult.kind === "forbidden") redirect("/403");

  if (overviewResult.kind === "error") {
    redirect("/500");
  }

  const overview = overviewResult.data;
  const eventEntries = Object.entries(overview.auth_events_by_type);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Admin Area
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Admin Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <AppLinkButton href="/dashboard/users" variant="outline" className="px-3">
            Dashboard
          </AppLinkButton>
          <AppLinkButton href="/" variant="outline" className="px-3">
            Home
          </AppLinkButton>
        </div>
      </div>

      <AppPanel className="p-6">
        <h2 className="text-base font-semibold text-zinc-900">System Metrics</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="Total Users" value={overview.users_total} />
          <InfoTile label="Total Admins" value={overview.admins_total} />
          <InfoTile label="Auth Events (Total)" value={overview.auth_events_total} />
          <InfoTile label="Auth Events (Today)" value={overview.auth_events_today} />
          <InfoTile label="Auth Events (Last 7 Days)" value={overview.auth_events_last_7_days} />
          <InfoTile
            label="Auth Events (Last 30 Days)"
            value={overview.auth_events_last_30_days}
          />
        </dl>
      </AppPanel>

      <AppPanel className="mt-6 p-6">
        <h2 className="text-base font-semibold text-zinc-900">Auth Events Breakdown</h2>
        {eventEntries.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Belum ada data event autentikasi.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-zinc-200">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm text-zinc-700">
                {eventEntries.map(([event, total], index) => (
                  <tr
                    key={event}
                    className={index < eventEntries.length - 1 ? "border-b border-zinc-100" : ""}
                  >
                    <td className="px-3 py-2 font-medium">{event}</td>
                    <td className="px-3 py-2">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppPanel>
    </div>
  );
}
