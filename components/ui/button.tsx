import Link from "next/link";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "gradient-hero text-white hover:opacity-95",
        secondary:
          "border-border bg-surface text-text hover:bg-warm aria-expanded:bg-warm",
        ghost:
          "text-text hover:bg-warm aria-expanded:bg-warm dark:hover:bg-warm/80",
        danger: "border-coral bg-coral text-white hover:opacity-95",
        default: "gradient-hero text-white hover:opacity-95",
        outline:
          "border-border bg-surface text-text hover:bg-warm aria-expanded:bg-warm",
        destructive:
          "border-coral bg-coral text-white hover:opacity-95",
        link: "text-purple underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto gap-2 px-5 py-2.5",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-auto gap-1.5 px-4 py-2 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-auto gap-2 px-6 py-3 text-base",
        icon: "size-8 p-0",
        "icon-xs": "size-6 rounded-sm p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-sm p-0",
        "icon-lg": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    href?: string;
  };

function Button({
  className,
  variant,
  size,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
