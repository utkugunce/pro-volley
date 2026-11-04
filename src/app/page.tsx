import { SultanlarLigiClient } from "@/components/sultanlar-ligi/SultanlarLigiClient";
import { compactKadinlar2LigData } from "@/utils/kadinlar2LigPayload";
import { getSultanlarLigiData } from "@/utils/sultanlarLigiServer";

export const revalidate = 300;

export function generateMetadata(): import("next").Metadata {
  const title = "TVF Profesyonel Voleybol Ligleri — Sultanlar Ligi, 1. Lig & 2. Lig";
  const description =
    "Türkiye Voleybol Federasyonu Vodafone Sultanlar Ligi, Arabica Coffee House Kadınlar 1. Ligi ve Uzman Posta Kadınlar 2. Ligi canlı puan durumu, fikstür ve sonuçlar.";

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png", alt: "TVF Profesyonel Voleybol Ligleri" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default function Page() {
  const data = compactKadinlar2LigData(getSultanlarLigiData());
  return <SultanlarLigiClient initialData={data} initialTab="home" />;
}
