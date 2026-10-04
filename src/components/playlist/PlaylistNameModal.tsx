"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  PLAYLIST_NAME_MAX_LENGTH,
  validatePlaylistName,
} from "@/lib/utils/playlist-name";

interface PlaylistNameModalProps {
  open: boolean;
  mode: "create" | "rename";
  /** Used when the dialog opens (rename). */
  initialName?: string;
  /** Returns an error message to show, or null when the change was applied. */
  onSubmit: (name: string) => string | null;
  onClose: () => void;
}

interface NameFormProps {
  formId: string;
  initialName: string;
  onSubmit: (name: string) => string | null;
  onClose: () => void;
}

/** Mounted only while the modal is open, so its state resets every time. */
function NameForm({ formId, initialName, onSubmit, onClose }: NameFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalid = validatePlaylistName(name);
    if (invalid !== null) {
      setError(invalid);
      return;
    }

    const failure = onSubmit(name.trim());
    if (failure !== null) {
      setError(failure);
      return;
    }

    onClose();
  };

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        Playlist name
      </label>
      <input
        id={inputId}
        data-autofocus
        type="text"
        value={name}
        maxLength={PLAYLIST_NAME_MAX_LENGTH}
        autoComplete="off"
        aria-invalid={error !== null}
        aria-describedby={error !== null ? errorId : undefined}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        className="mt-2 h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted focus:border-secondary md:text-sm"
        placeholder="My playlist"
      />
      {error !== null && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

export function PlaylistNameModal({
  open,
  mode,
  initialName = "",
  onSubmit,
  onClose,
}: PlaylistNameModalProps) {
  const formId = useId();
  const creating = mode === "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={creating ? "New playlist" : "Rename playlist"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {creating ? "Create" : "Save"}
          </Button>
        </>
      }
    >
      <NameForm
        formId={formId}
        initialName={initialName}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
}
