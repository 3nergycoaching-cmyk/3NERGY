import { SignIn } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#7c1d35] rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[#7c1d35] font-bold text-2xl tracking-tight">3NERGY</p>
            <p className="text-[#7c1d35]/60 text-xs font-medium -mt-1">CRM · Coaching sportif</p>
          </div>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border border-[#e8e0dc] rounded-2xl bg-white",
              headerTitle: "text-[#1a1218] font-bold",
              headerSubtitle: "text-gray-500",
              formButtonPrimary:
                "bg-[#7c1d35] hover:bg-[#9b2445] transition-colors text-white rounded-lg",
              formFieldInput:
                "border-[#e8e0dc] rounded-lg focus:ring-[#7c1d35] focus:border-[#7c1d35]",
              footerActionLink: "text-[#7c1d35] hover:text-[#9b2445]",
              identityPreviewEditButton: "text-[#7c1d35]",
            },
          }}
        />
      </div>
    </div>
  );
}
