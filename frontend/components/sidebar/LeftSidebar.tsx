import Image from "next/image";
import Link from "next/link";
import { suggestedPeople, events } from "@/data/mock";
import {
  Bookmark,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

const exploreItems = [
  { label: "Learning", icon: GraduationCap, badge: "New" },
  { label: "Insights", icon: Lightbulb },
  { label: "Find friends", icon: Users },
  { label: "Bookmarks", icon: Bookmark },
  { label: "Gaming", icon: Gamepad2, badge: "New" },
  { label: "Settings", icon: Settings },
];

export default function LeftSidebar() {
  return (
    <aside
      className="hide-scrollbar sticky overflow-y-auto py-4"
      style={{
        top: "calc(var(--header-height))",
        maxHeight: "calc(100vh - var(--header-height))",
      }}
    >
      <div className="space-y-4">
        <section className="border-line bg-surface rounded-2xl border p-5 shadow-sm">
          <h2 className="text-ink mb-4 text-base font-semibold">Explore</h2>
          <ul className="space-y-2">
            {exploreItems.map(({ label, icon: Icon, badge }) => (
              <li key={label}>
                <Link
                  href="#"
                  className="text-muted hover:text-ink flex items-center justify-between rounded-xl py-1.5 text-sm font-medium transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="bg-surface-muted text-accent flex items-center justify-center rounded-xl">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </span>
                  {badge ? (
                    <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-line bg-surface rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink text-base font-semibold">Suggested People</h2>
            <Link className="text-accent text-xs font-semibold" href="#">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {suggestedPeople.map((person) => (
              <li key={person.id}>
                <div className="border-line flex items-center gap-3 rounded-xl border px-3 py-3">
                  <Link href="#" className="shrink-0">
                    <Image
                      src={person.image}
                      width={40}
                      height={40}
                      alt={person.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href="#" className="text-ink block text-sm font-semibold">
                      {person.name}
                    </Link>
                    <p className="text-muted mt-0.5 text-xs">{person.role}</p>
                  </div>
                  <Link
                    href="#"
                    className="border-line text-muted hover:border-accent/40 hover:text-accent inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-line bg-surface rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink text-base font-semibold">Events</h2>
            <Link href="#" className="text-accent text-xs font-semibold">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {events.map((evt) => (
              <li key={evt.id}>
                <Link
                  className="border-line hover:bg-surface-muted flex items-start gap-3 rounded-xl border px-3 py-3 transition"
                  href="#"
                >
                  <div className="bg-surface-muted flex w-12 shrink-0 flex-col items-center rounded-xl px-2 py-2 text-center">
                    <span className="text-ink text-base font-semibold leading-none">
                      {evt.date.split(" ")[0]}
                    </span>
                    <span className="text-muted mt-1 text-[11px] font-medium uppercase tracking-[0.08em]">
                      {evt.date.split(" ")[1]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-ink text-sm font-semibold leading-5">{evt.title}</h3>
                    <p className="text-muted mt-1 text-xs">{evt.going} people going</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
