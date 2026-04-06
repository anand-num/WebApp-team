const tabs = document.querySelectorAll('[data-tab-target]');
const tabContents = document.querySelectorAll('[data-tab-content]');
const footer = document.querySelector('.tab-footer');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = document.querySelector(tab.dataset.tabTarget);

    // switch tab content
    tabContents.forEach(c => c.classList.remove('active'));
    target.classList.add('active');

    // update footer buttons
    const secondaryBtn = footer.querySelector('.secondary-btn');
    const primaryBtn = footer.querySelector('.primary-btn');
    const receipt = document.querySelector('.cart-receipt');

    if (target.id === "first-step") {
      secondaryBtn.textContent = "← КАТАЛОГ";
      secondaryBtn.removeAttribute("data-tab-target");
      secondaryBtn.onclick = () => location.href = "/product/html/browse.html";

      primaryBtn.style.display = "inline-block";
      primaryBtn.dataset.tabTarget = "#second-step";
    }

    if (target.id === "second-step") {
      secondaryBtn.textContent = "← БУЦАХ";
      secondaryBtn.onclick = null;
      secondaryBtn.dataset.tabTarget = "#first-step";

      primaryBtn.style.display = "inline-block";
      primaryBtn.dataset.tabTarget = "#third-step";
    }

    if (target.id === "third-step") {
      secondaryBtn.textContent = "← БУЦАХ";
      secondaryBtn.onclick = null;
      secondaryBtn.dataset.tabTarget = "#second-step";

      primaryBtn.style.display = "inline-block";
      primaryBtn.dataset.tabTarget = "#fourth-step"; 
    }
    if (target.id === "fourth-step") {

      secondaryBtn.style.display = "none";

      primaryBtn.style.display = "none";

      receipt.style.display = "none";
    }
  });
});