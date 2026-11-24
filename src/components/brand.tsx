import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-[#153f34]">
        <Icon name="bolt" />
      </span>
      <span className="text-sm font-bold text-[#153f34]">
        E-Mobility
        <span className="block text-xs font-normal text-[#546a60]">VNU-HCM - Smart Hub</span>
      </span>
    </Link>
  );
}
