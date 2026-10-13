import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/software-components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary border border-border mb-4">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">404 - الصفحة غير موجودة</h1>
        <p className="text-muted-foreground text-lg">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button size="lg">
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
