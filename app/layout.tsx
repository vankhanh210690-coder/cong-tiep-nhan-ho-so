import type { Metadata } from "next";
import { Playfair_Display, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DuHoc24 — Cổng Tiếp Nhận Hồ Sơ Du Học",
  description:
    "Tư vấn hồ sơ du học, rõ ràng từ báo giá đến xét duyệt. Nhận báo giá tức thì, nộp hồ sơ trực tuyến và theo dõi kết quả đối chiếu điểm chuẩn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geist.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
