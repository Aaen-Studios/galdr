import { useForgeStore } from "../../store/forgeStore";

export default function ConfirmDialog() {
  const confirmDialog = useForgeStore((s) => s.confirmDialog);
  const closeConfirmDialog = useForgeStore((s) => s.closeConfirmDialog);

  if (!confirmDialog) return null;

  return (
    <div className="forge-export-overlay">
      <div className="forge-export-modal forge-confirm-modal">
        <span className="forge-export-rune">?</span>
        <span className="forge-export-title">{confirmDialog.title}</span>
        <span className="forge-confirm-message">{confirmDialog.message}</span>
        <div className="forge-export-actions">
          <button className="forge-btn" onClick={() => closeConfirmDialog(false)}>cancel</button>
          <button className="forge-btn forge-btn-cast" onClick={() => closeConfirmDialog(true)}>ok</button>
        </div>
      </div>
    </div>
  );
}