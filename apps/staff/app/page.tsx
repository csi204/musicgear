import { LoginButton } from "../components/login-button";

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">MusicGear Staff</h1>
          <p>พอร์ทัลพนักงาน — ต้อง login ก่อนเข้าใช้งาน</p>
          <div className="mt-4">
            <LoginButton />
          </div>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
