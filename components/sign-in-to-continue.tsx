import { SignInButton } from "@/components/sign-in-button";

export function SignInToContinue({
  callbackUrl,
  title = "Sign in to continue",
  subtitle,
}: {
  callbackUrl: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl text-primary-fg">
        ♠
      </div>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6 flex justify-center">
        <SignInButton large callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
