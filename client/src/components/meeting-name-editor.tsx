import { useState, type FormEvent } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <Button
          variant="link"
          onClick={() => {
            setValue(name);
            setError(null);
            setEditing(true);
          }}
        >
          Editar nombre
        </Button>
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
      <Input
        id="meeting-rename"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={120}
        invalid={error !== null}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? "meeting-rename-error" : undefined}
        className="w-64 font-semibold text-lg"
      />
      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        Guardar
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setEditing(false);
          setError(null);
        }}
      >
        Cancelar
      </Button>
      {error !== null && (
        <p id="meeting-rename-error" role="alert" className="w-full text-sm text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
