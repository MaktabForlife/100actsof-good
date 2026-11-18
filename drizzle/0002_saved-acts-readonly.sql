-- Completed acts are append-only. Drafts remain in the browser until acknowledged.
CREATE TRIGGER acts_reject_updates
BEFORE UPDATE ON acts
BEGIN
  SELECT RAISE(ABORT, 'Saved log entries are read-only');
END;
--> statement-breakpoint
CREATE TRIGGER acts_reject_deletes
BEFORE DELETE ON acts
BEGIN
  SELECT RAISE(ABORT, 'Saved log entries are read-only');
END;
