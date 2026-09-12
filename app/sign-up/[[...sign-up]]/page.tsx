import { SignUp } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#E6007E] rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[#E6007E] font-bold text-2xl tracking-tight">3NERGY</p>
            <p className="text-[#E6007E]/60 text-xs font-medium -mt-1">CRM · Coaching sportif</p>
          </div>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border border-[#e8e0dc] rounded-2xl bg-white",
              headerTitle: "text-[#0A0A0A] font-bold",
              headerSubtitle: "text-gray-500",
              formButtonPrimary:
                "bg-[#E6007E] hover:bg-[#C00069] transition-colors text-white rounded-lg",
              formFieldInput:
                "border-[#e8e0dc] rounded-lg focus:ring-[#E6007E] focus:border-[#E6007E]",
              footerActionLink: "text-[#E6007E] hover:text-[#C00069]",
            },
          }}
        />
      </div>
    </div>
  );
}
