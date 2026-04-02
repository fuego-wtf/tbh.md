import type { RouteState } from '../../core/types';
import { detectGraphynContext } from '../../core/graphyn-context';
import Breadcrumb from '../../components/Breadcrumb';
import CommandBar from '../../components/CommandBar';

/* ------------------------------------------------------------------ */
/*  Truth-gate types                                                  */
/* ------------------------------------------------------------------ */

interface ManageGateResult {
  /** Whether the user is authenticated and listing APIs are wired. */
  ready: boolean;
  /** Contextual reason if not ready (empty string when ready). */
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  enforceManageTruthGate                                            */
/*                                                                    */
/*  Honest readiness check for the /manage route.                     */
/*  Returns `ready: true` ONLY when:                                   */
/*    • a Graphyn host context is confirmed via detectGraphynContext,  */
/*    • a user identity is resolved, AND                              */
/*    • listing mutation APIs are reachable.                          */
/*                                                                    */
/*  Until the host-bridge handshake and listing backend are wired,    */
/*  this function always returns `ready: false`.                      */
/* ------------------------------------------------------------------ */

export function enforceManageTruthGate(): ManageGateResult {
  const ctx = detectGraphynContext();

  if (!ctx.isGraphyn) {
    return {
      ready: false,
      reason: 'Management is only available through Graphyn Desktop.',
    };
  }

  if (!ctx.user) {
    return {
      ready: false,
      reason: 'Sign in to manage your listings.',
    };
  }

  // Listing mutation API readiness check.
  // When the publish/unpublish backend endpoint exists, add a
  // lightweight probe here (e.g. HEAD /api/listings or similar).
  // Until then, even authenticated users land in the gate.
  return {
    ready: false,
    reason: 'Listing management is not available yet.',
  };
}

/* ------------------------------------------------------------------ */
/*  ManagePage                                                        */
/* ------------------------------------------------------------------ */

interface ManagePageProps {
  navigate: (route: RouteState) => void;
  onCopyCommand: (msg: string) => void;
}

export default function ManagePage({ navigate, onCopyCommand }: ManagePageProps) {
  const gate = enforceManageTruthGate();

  // --- Gated: auth or backend not ready ----------------------------
  if (!gate.ready) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

        <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
          <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>
            {gate.reason}
          </div>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 20 }}>
            Manage and publish listings from Graphyn Desktop Settings.<br />
            Web-based sign-in coming soon.
          </div>
          <CommandBar command="npx @graphyn/tbh login" onCopy={onCopyCommand} size={13} />
        </div>
      </main>
    );
  }

  // --- Ready: real auth + listing APIs available --------------------
  // When enforceManageTruthGate returns ready: true this branch renders
  // the actual management UI (listing cards, publish/unpublish actions).
  // No fake local-state illusions — all mutations go through the API.
  return (
    <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
      <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

      <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
        <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>
          Your listings
        </div>
        <div style={{ fontSize: 13, color: 'var(--tb-t3)' }}>
          {/* Listing management UI will be wired here when the API is ready. */}
        </div>
      </div>
    </main>
  );
}
