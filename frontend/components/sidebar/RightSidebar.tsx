import Image from "next/image";
import Link from "next/link";
import { friends } from "@/data/mock";
import { MessageCircleMore, Search } from "lucide-react";

export default function RightSidebar() {
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink text-base font-semibold">Friends</h2>
            <Link className="text-accent text-xs font-semibold" href="#">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {friends.slice(0, 4).map((friend) => (
              <li key={friend.id}>
                <Link
                  className="border-line hover:bg-surface-muted flex items-center gap-3 rounded-xl border px-3 py-3 transition"
                  href="#"
                >
                  <Image
                    src={friend.image}
                    width={40}
                    height={40}
                    alt={friend.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-ink text-sm font-semibold">{friend.name}</h3>
                    <p className="text-muted mt-0.5 text-xs">{friend.time ?? friend.role}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-line bg-surface rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-ink text-base font-semibold">Online Friends</h2>
            <Link className="text-accent text-xs font-semibold" href="#">
              See all
            </Link>
          </div>

          <form className="relative mb-4">
            <Search className="text-subtle pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              className="border-line bg-surface text-ink focus:border-accent/50 h-10 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition"
              placeholder="Search friends"
            />
          </form>

          <ul className="space-y-3">
            {friends
              .filter((friend) => friend.active)
              .map((friend) => (
                <li
                  key={friend.id}
                  className="border-line flex items-center gap-3 rounded-xl border px-3 py-3"
                >
                  <Link className="flex min-w-0 flex-1 items-center gap-3" href="#">
                    <div className="relative">
                      <Image
                        src={friend.image}
                        width={40}
                        height={40}
                        alt={friend.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <span className="bg-success absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-ink truncate text-sm font-semibold">{friend.name}</h3>
                      <p className="text-muted mt-0.5 text-xs">{friend.role}</p>
                    </div>
                  </Link>
                  <button
                    className="border-line text-muted hover:border-accent/40 hover:text-accent flex h-9 w-9 items-center justify-center rounded-lg border transition"
                    type="button"
                    aria-label={`Message ${friend.name}`}
                  >
                    <MessageCircleMore className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
