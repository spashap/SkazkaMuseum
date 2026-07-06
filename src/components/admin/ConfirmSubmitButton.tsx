'use client';

export default function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
