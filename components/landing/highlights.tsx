import Image from "next/image";

const highlights = [
  {
    kicker: "01",
    title: "Báo giá tức thì",
    description:
      "Chọn quốc gia, bậc học và gói dịch vụ, báo giá sẽ gửi trực tiếp vào email đã đăng ký trong vài giây.",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&auto=format&fit=crop",
    span: "lg:col-span-7",
    aspect: "aspect-[4/3]",
  },
  {
    kicker: "02",
    title: "Đối chiếu điểm chuẩn minh bạch",
    description:
      "Điểm học tập và IELTS của bạn được so trực tiếp với điểm chuẩn từng trường — kết quả đạt hay không hiển thị rõ.",
    image:
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop",
    span: "lg:col-span-5",
    aspect: "aspect-[4/5]",
  },
  {
    kicker: "03",
    title: "Phản hồi trong 24 giờ",
    description:
      "Gửi yêu cầu xong, tư vấn viên sẽ liên hệ lại trong vòng 24 giờ. Không chờ đợi mơ hồ, không hứa suông.",
    image:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop",
    span: "lg:col-span-12",
    aspect: "aspect-[21/9]",
  },
];

export function Highlights() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Vì sao chọn DuHoc24
            </p>
            <h2 className="mt-5 font-serif text-4xl font-light leading-[1] tracking-tight text-foreground md:text-6xl">
              Rõ ràng từ bước
              <br />
              <span className="font-medium text-[color:var(--umber)]">đầu tiên</span>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-foreground/60">
            Ba cột trụ dịch vụ, không có fine-print, không ẩn phí. Mỗi khâu đều
            có bằng chứng cụ thể để bạn kiểm tra.
          </p>
        </div>

        {/* Asymmetrical Bento */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {highlights.map((h, i) => (
            <article
              key={h.title}
              className={`${h.span} group relative`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Outer shell */}
              <div className="relative rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-foreground/15">
                {/* Inner core */}
                <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-background">
                  <div className={`relative ${h.aspect} w-full overflow-hidden`}>
                    <Image
                      src={h.image}
                      alt={h.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />

                    {/* Kicker number — floating top-left */}
                    <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/70 backdrop-blur-md ring-1 ring-foreground/10">
                      {h.kicker}
                    </span>

                    {/* Caption — bottom-left */}
                    <div className="absolute inset-x-5 bottom-5">
                      <h3 className="font-serif text-2xl font-light leading-tight text-background md:text-3xl">
                        {h.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description — inside the card */}
                  <div className="p-6 md:p-7">
                    <p className="text-sm leading-relaxed text-foreground/70 md:text-base">
                      {h.description}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
