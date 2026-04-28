import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconProp } from "@fortawesome/fontawesome-svg-core";

type LinkItem = {
  icon: IconProp;
  text: string;
  href: string;
};

type LinkListProps = {
  title: string;
  description: string;
  links: LinkItem[];
};

function LinkList({ title, description, links }: LinkListProps) {
  return (
    <div className="card-bg link-list-card m-4 p-4 rounded-2xl shadow-xl">
      <h3 className="font-bold text-lg mb-2 link-list-title">{title}</h3>
      <div className="text-sm mb-4 link-list-description">{description}</div>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={`${link.href}-${link.text}`}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={
              link.href.startsWith("http") ? "noopener noreferrer" : undefined
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors link-pill"
          >
            <FontAwesomeIcon icon={link.icon} />
            {link.text}
          </a>
        ))}
      </div>
    </div>
  );
}

export default LinkList;
