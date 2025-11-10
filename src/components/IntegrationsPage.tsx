import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Integration {
  name: string;
  status: "connected" | "not_connected";
  description: string;
}

const integrations: Integration[] = [
  {
    name: "OpenTable",
    status: "connected",
    description: "Connected • Acme Bistro",
  },
  {
    name: "Square",
    status: "connected",
    description: "Connected • Acme Bistro",
  },
  {
    name: "Stripe",
    status: "connected",
    description: "Connected • Acme Bistro",
  },
  {
    name: "Google Calendar",
    status: "connected",
    description: "Connected • Acme Bistro",
  },
  {
    name: "HubSpot",
    status: "not_connected",
    description: "Not connected • Acme Bistro",
  },
  {
    name: "Salesforce",
    status: "not_connected",
    description: "Not connected • Acme Bistro",
  },
  {
    name: "Zapier",
    status: "connected",
    description: "Connected • Acme Bistro",
  },
  {
    name: "SevenRooms",
    status: "not_connected",
    description: "Not connected • Acme Bistro",
  },
];

export function IntegrationsPage() {
  const handleConnect = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}`);
    // Integration logic would go here
  };

  const handleManage = (integrationName: string) => {
    console.log(`Managing ${integrationName}`);
    // Management logic would go here
  };

  return (
    <div className="p-4 md:p-6">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {integrations.map((integration) => (
          <Card
            key={integration.name}
            className="p-4 sm:p-6 bg-card border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">{integration.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
              </div>

              <div className="mt-auto">
                {integration.status === "connected" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-accent border-accent hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleManage(integration.name)}
                  >
                    Manage
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleConnect(integration.name)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
