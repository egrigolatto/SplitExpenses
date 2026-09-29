import { useState, type FormEvent } from "react";

interface MeetingNameEditorProps {
  name: string;
  isPending: boolean;
  onRename: (name: string) => void;
}

export function MeetingNameEditor({ name, isPending, onRename }: MeetingNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{name}</h1>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setError(null);
            setEditing(true);
          }}
          className="rounded text-sm font-medium underline underline-offset-4 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Editar nombre
        </button>
      </div>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = value.trim();

    if (trimmed.length < 2 || trimmed.length > 100) {
      setError("El nombre debe tener entre 2 y 100 caracteres");
      return;
    }

    onRename(trimmed);
    setEditing(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="meeting-rename" className="sr-only">
        Nombre de la reunión
      </label>
      <input
        id="meeting-rename"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={120}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? "meeting-rename-error" : undefined}
        className="rounded border border-neutral-300 px-3 py-1.5 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setError(null);
        }}
        className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
      >
        Cancelar
      </button>
      {error !== null && (
        <p id="meeting-rename-error" role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
