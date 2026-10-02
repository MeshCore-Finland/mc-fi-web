import { useId, useState } from 'react';
export interface CommandLabels {
  name: string;
  help: string;
  invalid: string;
  copy: string;
  copied: string;
  copyFailed: string;
}
export default function CommandBuilder({ labels }: { labels: CommandLabels }) {
  const id = useId();
  const [name, setName] = useState('Helsinki-Koti');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const value = name.trim();
  const valid =
    value.length > 0 &&
    new TextEncoder().encode(value).length <= 23 &&
    !/[\x00-\x1f\x7f]/.test(value);
  const command = `set name ${value}\nget name`;
  return (
    <div className="command-builder not-content" data-pagefind-ignore>
      <label htmlFor={id}>{labels.name}</label>
      <input
        id={id}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setCopied(false);
          setCopyFailed(false);
        }}
        aria-describedby={`${id}-help`}
        aria-invalid={!valid}
      />
      <p id={`${id}-help`}>{labels.help}</p>
      {valid ? (
        <>
          <pre>
            <code>{command}</code>
          </pre>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(command);
                setCopied(true);
                setCopyFailed(false);
              } catch {
                setCopyFailed(true);
              }
            }}
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </>
      ) : (
        <p role="status">{labels.invalid}</p>
      )}
      <span role="status">{copyFailed ? labels.copyFailed : ''}</span>
    </div>
  );
}
