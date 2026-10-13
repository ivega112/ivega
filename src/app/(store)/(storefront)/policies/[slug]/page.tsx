import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

const VALID_SLUGS = ["delivery", "payment", "returns", "privacy", "terms"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.policyPage.findUnique({ where: { slug } });
  return { title: page?.titleAr ?? "سياسة" };
}

export default async function PolicyPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();
  const page = await prisma.policyPage.findUnique({ where: { slug } });
  if (!page) notFound();

  return (
    <div className="ay-container py-10 ">
      <h1 className="mb-6 text-2xl font-bold text-ay-title">{page.titleAr}</h1>
      <div className="max-w-2xl whitespace-pre-line text-sm leading-8 text-ay-text">{page.bodyAr}</div>
    </div>
  );
}
