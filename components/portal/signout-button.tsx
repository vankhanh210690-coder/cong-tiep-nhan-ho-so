import { LogOut } from "lucide-react";

export function SignoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="group inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground transition-all duration-500 hover:bg-foreground/5 active:scale-[0.97]"
      >
        <LogOut className="size-3.5 stroke-[1.3]" />
        <span>Đăng xuất</span>
      </button>
    </form>
  );
}
