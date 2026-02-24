import { redirect } from "next/navigation";
import { AppPanel, InfoTile } from "@/lib/ui";
import { getMyActivity } from "@/lib/api-auth";
import { requireAuthUser } from "@/lib/server-auth";

export default async function DashboardActivitiesPage() {
  const { cookieHeader, user } = await requireAuthUser();
  const activityResult = await getMyActivity(cookieHeader);

  if (activityResult.kind === "unauthorized" || activityResult.kind === "forbidden") {
    redirect("/401");
  }

  if (activityResult.kind === "error") {
    redirect("/500");
  }

  const activity = activityResult.data;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Other
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Activities</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ringkasan akun dan jejak autentikasi terbaru.
        </p>
      </header>

      <AppPanel className="p-6">
        <h2 className="text-base font-semibold text-zinc-900">Account Overview</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoTile label="Name" value={user.name} />
          <InfoTile label="Email" value={user.email} />
          <InfoTile label="Role" value={user.role === "admin" ? "Admin" : "User"} />
          <InfoTile label="User ID" value={user.id} />
          <InfoTile label="Joined" value={new Date(user.created_at).toLocaleString()} />
        </dl>
      </AppPanel>

      <AppPanel className="mt-6 p-6">
        <h2 className="text-base font-semibold text-zinc-900">Recent Auth Activity</h2>

        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Belum ada aktivitas login/logout yang tercatat.
          </p>
        ) : null}

        {activity.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-zinc-200">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Request ID</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm text-zinc-700">
                {activity.map((item, index) => (
                  <tr
                    key={`${item.created_at}-${index}`}
                    className={index < activity.length - 1 ? "border-b border-zinc-100" : ""}
                  >
                    <td className="px-3 py-2">{item.event}</td>
                    <td className="px-3 py-2">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{item.ip_address ?? "-"}</td>
                    <td className="px-3 py-2">{item.request_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AppPanel>
    </div>
  );
}
