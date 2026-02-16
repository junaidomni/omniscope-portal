import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(202, 138, 4, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(202, 138, 4, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      <div className="text-center relative z-10 max-w-md px-6">
        <div className="h-20 w-20 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center mx-auto mb-8">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
        
        <p className="text-zinc-400 mb-3 text-lg leading-relaxed">
          The OmniScope Intelligence Portal is invitation-only.
        </p>
        
        <p className="text-zinc-500 mb-10 text-sm leading-relaxed">
          Your email address is not associated with an active invitation. 
          If you believe this is an error, please contact your OmniScope administrator 
          to request access.
        </p>
        
        <Button
          onClick={() => window.location.href = "/"}
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Sign In
        </Button>
      </div>
    </div>
  );
}
