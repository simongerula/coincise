export function createModal({ title, content, onSubmit }) {
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

  modal.querySelector(".close-btn").onclick = () => modal.remove();
  modal.querySelector(".submit-btn").onclick = () => {
    onSubmit?.();
    modal.remove();
  };

  document.body.appendChild(modal);
  return modal;
}
