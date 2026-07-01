import { Loader2 } from "lucide-react";
import Card from "../../components/ui/Card";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="flex items-center gap-3 px-5 py-4 text-gray-700">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Memuat aplikasi...</span>
      </Card>
    </div>
  );
}
