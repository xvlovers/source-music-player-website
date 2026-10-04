"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface DeletePlaylistModalProps {
  open: boolean;
  playlistName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeletePlaylistModal({
  open,
  playlistName,
  onConfirm,
  onClose,
}: DeletePlaylistModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete playlist?"
      description={`"${playlistName}" will be deleted. This cannot be undone. Your liked songs are not affected.`}
      footer={
        <>
          <Button variant="ghost" data-autofocus onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete playlist
          </Button>
        </>
      }
    />
  );
}
