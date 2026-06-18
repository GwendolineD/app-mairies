import { StylizedUnderline } from "@/components/ui/stylized-underline";

type Props = {
  children: string;
};

export function AppNameHighlight({ children }: Props) {
  return <StylizedUnderline underlineClassName="text-pink">{children}</StylizedUnderline>;
}
