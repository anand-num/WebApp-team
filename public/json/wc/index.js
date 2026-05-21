/* ══════════════════════════════════════════════════════════
   wc/index.js — Web Components Эхлүүлэгч
   Бүх компонентыг нэг газраас import хийж бүртгэнэ.
   HTML файлуудаас зөвхөн энэ файлыг нэг удаа оруулна:
   <script type="module" src="/public/wc/index.js"></script>
══════════════════════════════════════════════════════════ */

// Сэтгэгдлийн компонентууд (review-list → review-card дотор ашиглана)
import './review-card.js';
import './review-list.js';
import './home-reviews.js';

// Нүүр хуудасны компонентууд
import './home-featured.js';
import './how-it-works.js';

// Бүтцийн компонентууд (бүх хуудсанд)
import './rent-footer.js';
import './cart-side.js';

// Бүтээгдэхүүний компонентууд
import './product-page.js';
import './product-card.js';
import './browse-product-grid.js';
