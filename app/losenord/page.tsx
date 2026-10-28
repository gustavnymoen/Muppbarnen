import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/app/components/Card";
import { SITE_NAME } from "@/app/components/SiteHeader";
import { safeTarget } from "@/lib/site-session";
import { LoginForm } from "./LoginForm";

// Den enda sidan som syns utan kaka: sajtens namn och fältet, inget annat från sajten
export const metadata: Metadata = { robots: { index: false } };

export default function PasswordPage({ searchParams }: PageProps<"/losenord">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-semibold">{SITE_NAME}</h1>
      <Card className="space-y-4">
        <Suspense fallback={null}>
          <Form searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}

// Adressen man kom från kommer med i adressraden (?till=…) och kontrolleras igen när den används
async function Form({ searchParams }: { searchParams: PageProps<"/losenord">["searchParams"] }) {
  const { till } = await searchParams;
  return <LoginForm target={safeTarget(Array.isArray(till) ? till[0] : till)} />;
}
