import { useId, useState } from 'react';
import type { Language } from '../lib/site';
export default function CommandBuilder({ lang }: { lang: Language }) {
  const id = useId();
  const [name, setName] = useState('Helsinki-Koti');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const value = name.trim();
  const valid = value.length > 0 && new TextEncoder().encode(value).length <= 23 && !/[\x00-\x1f\x7f]/.test(value);
  const command = `set name ${value}\nget name`;
  const en = lang === 'en';
  return <div className="command-builder not-content" data-pagefind-ignore>
    <label htmlFor={id}>{en ? 'Repeater name' : 'Toistimen nimi'}</label>
    <input id={id} value={name} onChange={event => { setName(event.target.value); setCopied(false); setCopyFailed(false); }} aria-describedby={`${id}-help`} aria-invalid={!valid} />
    <p id={`${id}-help`}>{en ? 'Use a short, recognizable name (up to 23 UTF-8 bytes).' : 'Valitse lyhyt, tunnistettava nimi (enintään 23 UTF-8-tavua).'}</p>
    {valid ? <><pre><code>{command}</code></pre><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(command); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); } }}>{copied ? (en ? 'Copied' : 'Kopioitu') : (en ? 'Copy commands' : 'Kopioi komennot')}</button></> : <p role="status">{en ? 'Enter a name that fits the length limit.' : 'Anna pituusrajaan mahtuva nimi.'}</p>}
    <span role="status">{copyFailed ? (en ? 'Select and copy the commands above.' : 'Valitse ja kopioi yllä olevat komennot.') : ''}</span>
  </div>;
}
