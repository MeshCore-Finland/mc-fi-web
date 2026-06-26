import "./App.css";
import { useEffect, useState } from "react";
import StatsCards from "./components/StatsCards";
import LinkList from "./components/LinkList";
import { DocsPage } from "./pages/DocsPage";
import { resolveDocPath } from "./lib/nav";
import {
  faBars,
  faComments,
  faCrosshairs,
  faGlobe,
  faMap,
  faMicrochip,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Theme = "light" | "dark";
type Page = "home" | "docs";
interface AppRoute {
  page: Page;
  docPath?: string;
}

const THEME_STORAGE_KEY = "mc-fi-theme";
const getRouteFromHash = (hash: string): AppRoute | null => {
  const route = hash.replace(/^#/, "");

  if (route === "docs" || route === "/docs") {
    return { page: "docs" };
  }

  if (route.startsWith("/docs/")) {
    const docPath = `/${route
      .slice(1)
      .split("/")
      .map(segment => decodeURIComponent(segment))
      .join("/")}`;

    return {
      page: "docs",
      docPath: resolveDocPath(docPath) ?? docPath,
    };
  }

  if (route === "" || route === "home" || route === "/home") {
    return { page: "home" };
  }

  return null;
};

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredTheme = (): Theme | null => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return null;
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());
  const [usesSystemTheme, setUsesSystemTheme] = useState(() => getStoredTheme() === null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [route, setRoute] = useState<AppRoute>(() => {
    return getRouteFromHash(window.location.hash) ?? { page: "home" };
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!usesSystemTheme) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", applySystemTheme);
    return () => mediaQuery.removeEventListener("change", applySystemTheme);
  }, [usesSystemTheme]);

  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = getRouteFromHash(window.location.hash);

      if (nextRoute) {
        setRoute(nextRoute);
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const toggleTheme = () => {
    setIsMenuOpen(false);
    setUsesSystemTheme(false);
    setTheme((currentTheme) => {
      const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  return (
    <>
      <header className="app-navbar">
        <a href="#/home" className="logo-placeholder">
          <div className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="presentation">
              <defs>
                <linearGradient id="mcfiLogoGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d5ff" />
                  <stop offset="100%" stopColor="#0b8bff" />
                </linearGradient>
              </defs>
              <path
                d="M32 6L56 20V44L32 58L8 44V20Z"
                fill="none"
                stroke="url(#mcfiLogoGradient)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M20 32L30 22L44 34M30 22V40"
                fill="none"
                stroke="url(#mcfiLogoGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="logo-text">MeshCore Finland</span>
        </a>
        <div className="mobile-brand-title" aria-hidden="true">MeshCore Finland</div>

        <div className="app-nav-actions">
          <a href="#/home" className="app-nav-link">
            Home
          </a>
          <a href="#/docs" className="app-nav-link">
            Docs
          </a>
          <button
            type="button"
            className="theme-toggle app-nav-theme"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </button>
          <div className="app-menu">
            <button
              type="button"
              className="app-menu-trigger"
              onClick={() => setIsMenuOpen(open => !open)}
              aria-expanded={isMenuOpen}
              aria-label="Open site menu"
              title="Open site menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            {isMenuOpen ? (
              <div className="app-menu-panel">
                <a href="#/home" className="app-menu-link">
                  Home
                </a>
                <a href="#/docs" className="app-menu-link">
                  Docs
                </a>
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {route.page === "docs" ? (
        <DocsPage selectedPath={route.docPath} />
      ) : (
        <>
          <section id="center">
            <div>
              <div className="text-5xl md:text-7xl font-semibold mb-6 mt-6 tracking-tight leading-loose-2 site-title">
                MeshCore{" "}
                <span className="site-title-badge rounded-md px-3">Finland</span>
              </div>
              <div className="text-lg max-w-3xl mx-auto mb-10 leading-relaxed intro-copy">
                <div className="mb-4">
                  This is a regional MeshCore site for Finland by local community
                  enthusiasts. Work in progress, check back later for updates.
                </div>
                <div className="mb-4">
                  MeshCore is a simple, secure, off-grid mesh communications system
                  set up by a global community. For more information about MeshCore,
                  visit the main website at{" "}
                  <a
                    href="https://meshcore.io"
                    className="font-medium text-link"
                  >
                    meshcore.io
                  </a>
                  .
                </div>
                <StatsCards />
              </div>
            </div>
          </section>

               <section id="links">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div id="main-links">
            <div className="text-2xl font-bold mb-4 section-title">MeshCore in Finland</div>
            <LinkList
              title="Mesh Finland Discord"
              description="Discord server for Meshtastic & MeshCore in Finland"
              links={[
                {
                  icon: faComments,
                  text: "Join Discord",
                  href: "https://discord.gg/QVQSmpaf",
                },
              ]}
            />
            <LinkList
              title="CoreScope Finland"
              description="Explore MeshCore nodes & traffic in Finland"
              links={[
                {
                  icon: faCrosshairs,
                  text: "Open CoreScope",
                  href: "https://corescope.meshcore.fi/#/map",
                },
              ]}
            />
            <LinkList
              title="MeshCore Flasher"
              description="Flash the firmware on your MeshCore nodes. Custom flasher coming soon"
              links={[
                {
                  icon: faMicrochip,
                  text: "Open Flasher",
                  href: "https://flasher.meshcore.io",
                },
              ]}
            />
          </div>
          <div id="regional-links">
            <div className="text-2xl font-bold mb-4 section-title">Regional MeshCore Sites</div>
            <LinkList
              title="Mesh Pirkanmaa"
              description="Pirkanmaa MeshCore & Meshtastic information"
              links={[
                {
                  icon: faGlobe,
                  text: "Visit Website",
                  href: "https://meshpirkanmaa.org/",
                },
                {
                  icon: faMap,
                  text: "MeshMapper TMP",
                  href: "https://tmp.meshmapper.net/",
                },
              ]}
            />
            <LinkList
              title="MeshCore Uusimaa"
              description="Uusimaa MeshCore info coming soon..."
              links={[
                {
                  icon: faMap,
                  text: "MeshMapper HEL",
                  href: "https://hel.meshmapper.net/",
                },
              ]}
            />
                        <LinkList
              title="MeshCore Seinäjoki"
              description="Seinäjoki MeshCore info coming soon..."
              links={[
                {
                  icon: faMap,
                  text: "MeshMapper SJY",
                  href: "https://sjy.meshmapper.net/",
                },
              ]}
            />
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}

export default App;
