interface ModalOptions {
  title: string;
  content: string;
  onSubmit?: () => void;
  onCancel?: () => void; // optional callback for cancel
}

export function createModal({
  title,
  content,
  onSubmit,
  onCancel,
}: ModalOptions): HTMLDivElement {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      <div class="modal-body">${content}</div>
      <div class="modal-buttons">
        <button class="btn-primary submit-btn">Submit</button>
        <button class="btn-secondary close-btn">Cancel</button>
      </div>
    </div>
  `;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".close-btn");
  const submitBtn = modal.querySelector<HTMLButtonElement>(".submit-btn");

  closeBtn?.addEventListener("click", () => {
    onCancel?.();
    modal.remove();
  });

  submitBtn?.addEventListener("click", () => {
    onSubmit?.();
    modal.remove();
  });

  document.body.appendChild(modal);
  return modal;
}
