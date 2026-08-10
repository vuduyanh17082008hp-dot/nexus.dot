import { Button } from "@/components/ui/button";

export default function CategoryNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-white">Category not found</h1>
      <p className="mt-2 text-zinc-400">This category doesn&apos;t exist.</p>
      <Button href="/games" className="mt-6">
        Browse All Games
      </Button>
    </div>
  );
}
