import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="login">
      <section className="login-brand">
        <svg className="ecg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 32h170l12-14 10 30 12-44 12 50 10-22h130l10-10 10 18 8-8h206" />
        </svg>
        <Logo size={56} />
        <h1>F.I. College of Nursing</h1>
        <p>One campus. Every student, fee, class and clinical hour in one place.</p>
      </section>
      <section className="login-card">
        <h2>Sign in</h2>
        <p className="muted">Staff, students and parents use the same door.</p>
        <LoginForm next={next ?? "/overview"} />
      </section>
    </main>
  );
}
