import { useEffect, useState } from "react";
import { PhoneCall, CheckCircle2, Percent, User } from "lucide-react";

interface LandingProps {
  customer?: {
    name: string;
    restaurantId: string;
  };
}

export function Landing({ customer }: LandingProps) {
  const [stats, setStats] = useState({
    callsReceived: 0,
    callsAnswered: 0,
    answerRate: "0%",
  });

  useEffect(() => {
    // Example client-side calculation (replace with props or context if available)
    const todayCalls = 25;
    const answered = 18;
    const rate = todayCalls > 0 ? `${Math.round((answered / todayCalls) * 100)}%` : "0%";

    setStats({
      callsReceived: todayCalls,
      callsAnswered: answered,
      answerRate: rate,
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Welcome back 👋</h1>
        <p className="text-sm text-muted-foreground">Quick snapshot of your activity today</p>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Calls Received */}
          <div className="bg-card border border-border rounded-xl p-6 flex items-center space-x-4 shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
              <PhoneCall className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calls Received</p>
              <p className="text-2xl font-bold text-foreground">{stats.callsReceived}</p>
            </div>
          </div>

          {/* Calls Answered */}
          <div className="bg-card border border-border rounded-xl p-6 flex items-center space-x-4 shadow-sm">
            <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calls Answered</p>
              <p className="text-2xl font-bold text-foreground">{stats.callsAnswered}</p>
            </div>
          </div>

          {/* Answer Rate */}
          <div className="bg-card border border-border rounded-xl p-6 flex items-center space-x-4 shadow-sm">
            <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
              <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Answer Rate</p>
              <p className="text-2xl font-bold text-foreground">{stats.answerRate}</p>
            </div>
          </div>
        </div>

        {/* Client Info Section */}
        {customer && (
          <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Client Information</h2>
            </div>
            <p>
              <strong>Business Name:</strong> {customer.name}
            </p>
            <p>
              <strong>Customer ID:</strong> {customer.restaurantId}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
