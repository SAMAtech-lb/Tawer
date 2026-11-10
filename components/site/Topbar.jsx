/* Purple strip above the header: phone, email, opening hours, intake news, social icons. */
import Rich from "../Rich";
import { safeUrl } from "@/lib/site-helpers";

/* An icon link to a social network; hidden when the admin left that link empty. */
export function SocialLink({ C, name, label, icon, className }) {
  const url = C.social?.[name];
  if (!url) return null;
  const href = safeUrl(url);
  const ext = /^https?:/i.test(href) ? { target: "_blank", rel: "noopener" } : {};
  return <a href={href} className={className} aria-label={label} {...ext}><i className={icon} /></a>;
}

export default function Topbar({ C }) {
  return (
    <div className="topbar">
      <div className="container">
        <div className="topbar__info">
          <span><i className="ri-phone-line" /> <span dir="ltr">{C.contact?.phone}</span></span>
          <span><i className="ri-mail-line" /> <span dir="ltr">{C.contact?.email}</span></span>
          <span className="hide-sm"><i className="ri-time-line" /> <span><Rich text={C.contact?.hours} /></span></span>
        </div>
        <div className="topbar__social">
          <span className="hide-sm"><Rich text={C.contact?.intake} /></span>
          <SocialLink C={C} name="instagram" label="Instagram" icon="ri-instagram-line" />
          <SocialLink C={C} name="facebook" label="Facebook" icon="ri-facebook-fill" />
          <SocialLink C={C} name="tiktok" label="TikTok" icon="ri-tiktok-fill" />
          <SocialLink C={C} name="youtube" label="YouTube" icon="ri-youtube-fill" />
        </div>
      </div>
    </div>
  );
}
