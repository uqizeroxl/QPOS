import { sanitize } from "../../utils/sanitize";

type SanitizedTextProps = {
  text: string;
  as?: "span" | "div" | "p";
  className?: string;
};

export default function SanitizedText({ text, as: Tag = "span", className }: SanitizedTextProps) {
  return <Tag className={className}>{sanitize(text)}</Tag>;
}
