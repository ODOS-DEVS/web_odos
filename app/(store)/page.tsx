import { HomeSections } from "@/components/home/home-sections";

// `HomeSections` reads `mocks/` directly, so there is nothing to prefetch server-side for now.
export default function HomePage() {
  return <HomeSections />;
}
