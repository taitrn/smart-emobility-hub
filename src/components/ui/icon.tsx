import Image from "next/image";

const icons = {
  bike: [20, 20],
  bolt: [16, 16],
  calendar: [20, 20],
  charge: [20, 20],
  home: [16, 16.2],
  key: [17.6654, 17.6651],
  parking: [20, 20],
  pin: [14.3333, 17.6667],
  student: [14.625, 15.875],
} as const;

export function Icon({ name }: { name: keyof typeof icons }) {
  const [width, height] = icons[name];
  return (
    <span className="inline-grid size-5 shrink-0 place-items-center" aria-hidden="true">
      <Image
        src={`/icons/${name}.svg`}
        width={Math.round(width)}
        height={Math.round(height)}
        style={{ width, height: "auto" }}
        alt=""
        unoptimized
      />
    </span>
  );
}
