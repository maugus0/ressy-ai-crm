/**
 * UI-only Notice Banner
 * Shows a consistent banner indicating backend APIs are not integrated yet.
 */

import { AlertTriangle } from "lucide-react";

export function UiOnlyNotice() {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-700" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">UI-only implementation</p>
          <p className="text-sm text-yellow-800">
            Backend APIs are not integrated yet. Data, actions, and stats will be wired up later.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UiOnlyNotice;
