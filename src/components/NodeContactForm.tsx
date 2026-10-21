import { useEffect, useState } from 'react';
import { normalizeNodeId } from '../lib/node-contact.mjs';
import './NodeContactForm.css';

type Lookup = { id: string; description?: string; status: string };

type Props = { greetingHeading: string; messageHelp: string };

export default function NodeContactForm({
  greetingHeading,
  messageHelp,
}: Props) {
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [idTouched, setIdTouched] = useState(false);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const id = normalizeNodeId(value);
  const invalidId =
    !locked && !id && (Boolean(value) || idTouched || invalidLink);

  useEffect(() => {
    const pathId = window.location.pathname.match(/^\/n\/([^/]+)\/?$/)?.[1];
    try {
      const supplied = (
        pathId === undefined
          ? (new URLSearchParams(window.location.search).get('id') ?? '')
          : decodeURIComponent(pathId)
      ).trim();
      const normalized = normalizeNodeId(supplied);
      if (normalized) {
        setValue(normalized);
        setLocked(true);
      } else {
        setInvalidLink(Boolean(supplied));
      }
    } catch {
      setInvalidLink(true);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const requestedId = id;
    const controller = new AbortController();
    async function loadGreeting() {
      try {
        const response = await fetch(`/api/node-contact/${id}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setLookup({
            id: requestedId,
            status: 'Tälle tunnisteelle ei löytynyt lisätietoja.',
          });
          return;
        }
        if (!response.ok) throw new Error('Lookup failed');
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (typeof data.description !== 'string')
          throw new Error('Invalid response');
        setLookup({
          id: requestedId,
          description: data.description,
          status: '',
        });
      } catch {
        if (!controller.signal.aborted) {
          setLookup({
            id: requestedId,
            status:
              'Noden tietoja ei voitu hakea. Kokeile myöhemmin uudelleen.',
          });
        }
      }
    }
    void loadGreeting();
    return () => controller.abort();
  }, [id]);

  const currentLookup = lookup?.id === id ? lookup : null;
  const status = id
    ? (currentLookup?.status ?? 'Haetaan noden tietoja…')
    : value
      ? 'Kirjoita kuusi merkkiä: 0–9 tai A–F.'
      : '';

  return (
    <>
      <noscript>
        <p>
          Ota JavaScript käyttöön, jotta linkin tunniste ja noden tiedot voidaan
          täyttää lomakkeeseen.
        </p>
      </noscript>
      <form
        className="node-contact-form"
        id="node-contact-form"
        aria-describedby="contact-notice"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="contact-node-details">
          <div className="contact-field">
            <label htmlFor="node-id">Tunniste (pakollinen)</label>
            <input
              id="node-id"
              name="nodeId"
              type="text"
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9A-Fa-f]{6}"
              autoComplete="off"
              spellCheck={false}
              placeholder="0FF1C3"
              aria-describedby="node-id-help"
              aria-invalid={invalidId}
              value={value}
              disabled={locked}
              onChange={(event) => {
                setValue(event.target.value);
                setIdTouched(true);
                setInvalidLink(false);
              }}
              onBlur={() => setIdTouched(true)}
            />
            {locked && <input name="nodeId" type="hidden" value={value} />}
            <small id="node-id-help">
              {locked
                ? 'Tunniste on täytetty linkistä.'
                : invalidLink
                  ? 'Linkin tunniste on virheellinen. Kirjoita kuusi merkkiä: 0–9 tai A–F.'
                  : 'Kuusi merkkiä: 0–9 tai A–F.'}
            </small>
          </div>
          <div className="contact-node-info">
            <section
              id="node-greeting"
              aria-live="polite"
              aria-atomic="true"
              hidden={currentLookup?.description === undefined}
            >
              <b>{greetingHeading.replace('{id}', id ?? '')}</b>
              <p>{currentLookup?.description}</p>
            </section>
            <p id="node-lookup-status" role="status" hidden={!status}>
              {status}
            </p>
          </div>
        </div>
        <div className="contact-field">
          <label htmlFor="contact-name">Nimi</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
          />
        </div>
        <div className="contact-field">
          <label htmlFor="contact-message">Viesti (pakollinen)</label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            aria-describedby="contact-message-help"
          />
          <small id="contact-message-help">{messageHelp}</small>
        </div>
        <button type="submit" disabled>
          Lähetys ei vielä käytössä
        </button>
      </form>
    </>
  );
}
