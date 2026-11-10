/* Contact: WhatsApp first, contact details, and the site's only two forms (as tabs). */
import Rich from "../Rich";
import RequestForms from "./RequestForms";

export default function Contact({ C, t, wa }) {
  const c = C.contact || {};
  return (
    <section className="section" id="contact">
      <div className="container contact__grid">
        <div className="contact__info reveal">
          <span className="label"><Rich text={c.label} /></span>
          <h2 className="h2"><Rich text={c.title} /></h2>
          <p><Rich text={c.text} /></p>
          <a {...wa("wa.trial")} className="btn btn--wa btn--lg contact__wa"><i className="ri-whatsapp-line" /> <span><Rich text={c.button} /></span></a>
          <ul className="contact__list">
            <li><i className="ri-phone-line" /><div><b>{t("contact.call", "Call or WhatsApp")}</b><span dir="ltr">{c.phone}</span></div></li>
            <li><i className="ri-mail-line" /><div><b>{t("contact.email", "Email")}</b><span dir="ltr">{c.email}</span></div></li>
            <li><i className="ri-time-line" /><div><b>{t("contact.hours", "Opening hours")}</b><span><Rich text={c.hours} /></span></div></li>
          </ul>
        </div>
        <RequestForms forms={C.forms || {}} levels={C.levels?.items || []} />
      </div>
    </section>
  );
}
