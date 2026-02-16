/**
 * Minimal types for Google Identity Services (One Tap).
 * Used with the script from https://accounts.google.com/gsi/client
 */
declare global {
  interface CredentialResponse {
    credential: string;
    select_by?: string;
    clientId?: string;
  }

  interface PromptMomentNotification {
    getMomentType(): 'display' | 'skipped' | 'dismissed';
    getSkippedReason?(): 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
    getDismissedReason?(): 'credential_returned' | 'cancel' | 'flow_restarted';
  }

  namespace google {
    namespace accounts {
      namespace id {
        function initialize(config: {
          client_id: string;
          callback: (response: CredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }): void;
        function prompt(momentListener?: (notification: PromptMomentNotification) => void): void;
        function cancel(): void;
        function disableAutoSelect(): void;
      }
    }
  }
}

export {};
