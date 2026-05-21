/* ══════════════════════════════════════════════════════════
   how-it-works.js — Web Component
   Нүүр хуудасны "Хэрхэн ажилладаг" хэсэг.
   Түрээслүүлэгч (3 алхам) болон түрээслэгч (4 алхам)-ийн
   дэлгэрэнгүйг харуулна.

   Хэрэглэх: <how-it-works></how-it-works>
══════════════════════════════════════════════════════════ */

class HowItWorks extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  /** Компонентын бүх HTML-ийг рендерлэнэ. */
  render() {
    this.innerHTML = `
      <section id="how-it-works">
        <h2 class="visually-hidden">Хэрхэн ажилладаг</h2>

        <!-- Түрээслүүлэгчийн алхмууд -->
        <header style="text-align:center">
          <h2 class="section-tag">Хэрхэн ажилладаг</h2>
          <h1>Хувцасаа түрээслүүлэх 3 алхам</h1>
        </header>

        <section class="work-steps-container">
          <h2 class="visually-hidden">Түрээслүүлэгчийн алхмууд</h2>

          <article class="steps">
            <h2>01</h2>
            <h3>Бүртгэх</h3>
            <p>Хувцасаа нэмж, үнэ тогтоож, нэр болон тайлбар ширхэгийг бичнэ.</p>
          </article>

          <article class="steps">
            <h2>02</h2>
            <h3>Хүсэлт авах</h3>
            <p>Түрээслэгчийн гаргасан хүсэлтийг харж зөвшөөрөх эсвэл татгалзана.</p>
          </article>

          <article class="steps">
            <h2>03</h2>
            <h3>Орлого олох</h3>
            <p>Хувцас буцаагдмагц 15% хураамж хасч таны данс руу шилжүүлнэ.</p>
          </article>
        </section>

        <!-- Түрээслэгчийн алхмууд -->
        <header style="text-align:center">
          <h2 class="section-tag">Орлого олох</h2>
          <h1>Хувцас түрээслэх 4 алхам</h1>
        </header>

        <section class="work-steps-container">
          <h2 class="visually-hidden">Түрээслэгчийн алхмууд</h2>

          <article class="steps">
            <h2>01</h2>
            <h3>Үзэж сонгох</h3>
            <p>Загварын хувцасны бидний цуглуулгыг үзнэ үү. Арга хэмжээ, загвар эсвэл загварын дагуу шүүнэ үү.</p>
          </article>

          <article class="steps">
            <h2>02</h2>
            <h3>Огноо сонгох</h3>
            <p>Түрээслэх хугацаагаа сонгоно уу. Өдөрт түрээс нь хүргэлт, буцаалтыг багтаасан.</p>
          </article>

          <article class="steps">
            <h2>03</h2>
            <h3>Хүлээн авч өмсөх</h3>
            <p>Таны арга хэмжээний өмнө цэвэрхэн хувцсыг хаалганы урд хүргэнэ.</p>
          </article>

          <article class="steps">
            <h2>04</h2>
            <h3>Буцаах</h3>
            <p>Хугацаа дуусмагц хувцасыг буцааж өгнө. Угаалга манай үйлчилгээнд багтана.</p>
          </article>
        </section>
      </section>
    `;
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('how-it-works', HowItWorks);
