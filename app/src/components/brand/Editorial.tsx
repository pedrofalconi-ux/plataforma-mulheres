import Link from 'next/link';
import { clsx } from 'clsx';

type PageSectionProps = {
  children: React.ReactNode;
  className?: string;
};

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
};

type EditorialButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
};

type EditorialPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageSection({ children, className }: PageSectionProps) {
  return <section className={clsx('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</section>;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionIntroProps) {
  return (
    <div className={clsx(align === 'center' ? 'text-center' : 'text-left', className)}>
      {eyebrow ? <p className="editorial-kicker">{eyebrow}</p> : null}
      <h2 className={clsx("mt-4 max-w-4xl text-4xl leading-[1.15] text-primary-900 sm:text-5xl", align === 'center' && "mx-auto")}>{title}</h2>
      {description ? (
        <p
          className={clsx(
            'mt-6 max-w-3xl text-base leading-8 text-primary-900/72 sm:text-lg',
            align === 'center' ? 'mx-auto' : null
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function EditorialButtonLink({
  href,
  children,
  variant = 'primary',
  className,
}: EditorialButtonLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(variant === 'primary' ? 'button-primary' : 'button-secondary', className)}
    >
      {children}
    </Link>
  );
}

export function EditorialPanel({ children, className }: EditorialPanelProps) {
  return <div className={clsx('editorial-panel', className)}>{children}</div>;
}
