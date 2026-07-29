import { useEffect } from "react";
import { useToast } from "../../hooks/useToast";

export default function ToastEventListener() {
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type: string };
      showToast(detail.message, detail.type as "success" | "error");
    };

    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, [showToast]);

  return null;
}
