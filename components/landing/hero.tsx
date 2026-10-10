import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 md:pt-48">
      <div className="mx-auto max-w-7xl px-6">
        {/* Eyebrow tag */}
        <div className="anim-rise flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--sage)] opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--sage)]" />
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/70">
              Niên khóa 2026 — mở nhận hồ sơ
            </span>
          </span>
        </div>

        {/* Editorial Split */}
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h1 className="anim-rise delay-100 font-serif text-5xl font-light uppercase leading-[0.95] tracking-[-0.01em] text-foreground md:text-7xl lg:text-[5rem]">
              Hồ sơ du học
              <br />
              <span className="font-medium text-[color:var(--umber)]">
                tường minh
              </span>
              <br />
              từng bước
            </h1>

            <p className="anim-rise delay-300 mt-8 max-w-xl text-balance text-base leading-relaxed text-foreground/70 md:text-lg">
              Biết giá ngay khi điền form, nộp hồ sơ online và theo dõi hồ sơ
              của mình đạt hay chưa đạt điểm chuẩn từng trường — không mập mờ,
              không đợi.
            </p>

            <div className="anim-rise delay-500 mt-10 flex flex-wrap items-center gap-3">
              {/* Primary CTA — Button-in-Button */}
              <Link
                href="#bao-gia"
                className="group relative inline-flex items-center gap-2 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-medium text-background shadow-xl shadow-foreground/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.97]"
              >
                <span>Nhận báo giá ngay</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-background/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-background/25">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  >
                    <path
                      d="M7 17L17 7M9 7h8v8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>

              {/* Secondary CTA — minimal */}
              <Link
                href="/portal"
                className="group inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/50 px-5 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-background/80 active:scale-[0.97]"
              >
                <span>Vào cổng hồ sơ</span>
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 stroke-current transition-transform duration-500 group-hover:translate-x-0.5"
                  fill="none"
                  strokeWidth="1.3"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Stat strip */}
            <dl className="anim-rise delay-700 mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-foreground/10 pt-8">
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Hồ sơ xử lý
                </dt>
                <dd className="mt-2 font-serif text-3xl tabular-nums text-foreground">
                  2.4k+
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Trường đối tác
                </dt>
                <dd className="mt-2 font-serif text-3xl tabular-nums text-foreground">
                  120
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Phản hồi TB
                </dt>
                <dd className="mt-2 font-serif text-3xl tabular-nums text-foreground">
                  24h
                </dd>
              </div>
            </dl>
          </div>

          {/* Floating card — Double-Bezel image */}
          <div className="anim-rise delay-500 relative lg:col-span-5">
            <div className="relative rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
              <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)]">
                <Image
                  src="/images/hero-students.jpg"
                  alt="Hai sinh viên trong khuôn viên đại học, sẵn sàng cho hành trình du học"
                  width={1440}
                  height={1800}
                  priority
                  className="aspect-[4/5] w-full object-cover"
                />
                {/* Soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-foreground/5 to-transparent" />

                {/* Floating badge inside image */}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                  <div className="rounded-2xl bg-background/90 px-4 py-3 backdrop-blur-md ring-1 ring-foreground/10">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                      Niên khóa Fall 2026
                    </p>
                    <p className="mt-1 font-serif text-base">
                      Toronto · Melbourne · Manchester
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating pill above the card */}
            <div className="absolute -left-4 top-8 hidden rotate-[-4deg] rounded-full bg-background px-4 py-2 shadow-xl shadow-foreground/10 ring-1 ring-foreground/8 lg:block">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/60">
                Minh Anh · GPA 8.2 · IELTS 6.5
              </p>
            </div>
            <div className="absolute -right-3 bottom-20 hidden rotate-[5deg] rounded-full bg-[color:var(--umber)] px-4 py-2 shadow-xl shadow-[color:var(--umber)]/30 lg:block">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-background">
                ✓ Đạt University of Toronto
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
