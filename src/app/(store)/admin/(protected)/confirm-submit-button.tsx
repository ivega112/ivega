"use client";

/**
 * A submit button that asks for a native confirm() before letting its enclosing <form>
 * (a server action) actually submit. Shared by every destructive admin action (delivery,
 * payments, categories, brands, reviews, …) instead of each page reinventing its own
 * confirmation flow — or, worse, having none at all.
 */
export function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
