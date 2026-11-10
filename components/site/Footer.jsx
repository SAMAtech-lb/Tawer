/* Footer: about text + social icons, course & academy links, "Join our community" (WhatsApp / Telegram). */
import Rich from "../Rich";
import { SocialLink } from "./Topbar";
import { safeUrl } from "@/lib/site-helpers";

function CommunityButton({ C, name, className, icon, label }) {
  const url = C.social?.[name];
  if (!url) return null;
  const href = safeUrl(url);
  const ext = /^https?:/i.test(href) ? { target: "_blank", rel: "noopener" } : {};
  return <a href={href} className={`community__btn ${className}`} {...ext}><i className={icon} /> <span>{label}</span></a>;
}

export default function Footer({ C, t }) {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <a href="#top" className="logo logo--light"><span className="logo__mark">T<i /></span><span className="logo__text">Tawer<small>Academy</small></span></a>
          <p><Rich text={C.footer?.about} /></p>
          <div className="footer__social">
            <SocialLink C={C} name="instagram" label="Instagram" icon="ri-instagram-line" />
            <SocialLink C={C} name="facebook" label="Facebook" icon="ri-facebook-fill" />
            <SocialLink C={C} name="tiktok" label="TikTok" icon="ri-tiktok-fill" />
            <SocialLink C={C} name="youtube" label="YouTube" icon="ri-youtube-fill" />
            <SocialLink C={C} name="linkedin" label="LinkedIn" icon="ri-linkedin-fill" />
          </div>
        </div>
        <div>
          <h4>{t("footer.courses", "Courses")}</h4>
          <a href="#courses">{t("footer.general", "General English")}</a>
          <a href="#courses">{t("footer.business", "Business English")}</a>
          <a href="#courses">{t("footer.ielts", "IELTS & TOEFL")}</a>
          <a href="#courses">{t("footer.kids", "Kids & Teens")}</a>
          <a href="#pricing">{t("footer.private", "Private lessons")}</a>
        </div>
        <div>
          <h4>{t("footer.academy", "Academy")}</h4>
          <a href="#about">{t("footer.about", "About us")}</a>
          <a href="#stories">{t("footer.stories", "Success stories")}</a>
          <a href="#levels">{t("footer.levels", "Levels (CEFR)")}</a>
          <a href="#test">{t("footer.test", "Placement test")}</a>
          <a href="#blog">{t("footer.blog", "Blog")}</a>
        </div>
        <div>
          <h4><Rich text={C.footer?.communityTitle} /></h4>
          <p><Rich text={C.footer?.communityText} /></p>
          <div className="community">
            <CommunityButton C={C} name="whatsappGroup" className="community__btn--wa" icon="ri-whatsapp-line" label={t("community.wa", "Join on WhatsApp")} />
            <CommunityButton C={C} name="telegram" className="community__btn--tg" icon="ri-telegram-line" label={t("community.tg", "Join on Telegram")} />
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Tawer Academy. <span>{t("footer.rights", "All rights reserved.")}</span></span>
        <span><a href="#">{t("footer.privacy", "Privacy")}</a> · <a href="#">{t("footer.terms", "Terms")}</a></span>
      </div>
    </footer>
  );
}
