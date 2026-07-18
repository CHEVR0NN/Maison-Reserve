import Modal from "./Modal.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={(
        <>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className={`btn${danger ? "" : " primary"}`} style={danger ? { background: "var(--negative)", borderColor: "var(--negative)", color: "#fff" } : undefined} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      )}
    >
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
