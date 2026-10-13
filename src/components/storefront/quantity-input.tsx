"use client";

export function QuantityInput({
  value,
  onChange,
  max = 99,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-[30px]" : "h-[42px]";
  const w = size === "sm" ? "w-[26px]" : "w-[30px]";
  const cap = Math.max(1, Math.min(99, max));
  return (
    <div className={`inline-flex items-stretch rounded-[35px] border border-black/10 text-ay-title ${h}`} dir="ltr">
      <button type="button" aria-label="إنقاص الكمية" onClick={() => onChange(Math.max(1, value - 1))} className={`${w} rounded-s-[35px] hover:bg-black/5`}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={cap}
        value={value}
        aria-label="الكمية"
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(1, Math.min(cap, n)));
        }}
        className={`${size === "sm" ? "w-[30px]" : "w-[36px]"} border-x border-black/10 bg-transparent text-center text-[14px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <button type="button" aria-label="زيادة الكمية" onClick={() => onChange(Math.min(cap, value + 1))} className={`${w} rounded-e-[35px] hover:bg-black/5`}>
        +
      </button>
    </div>
  );
}
