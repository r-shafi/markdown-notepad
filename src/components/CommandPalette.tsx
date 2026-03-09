import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { CommandItem } from "../types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export default function CommandPalette({
  open,
  onClose,
  items,
}: CommandPaletteProps) {
  const groups = ["Document", "Format", "Theme", "Export", "View"] as const;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () =>
      document.removeEventListener("keydown", handler, { capture: true });
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
        >
          <motion.div
            className="palette-panel"
            initial={{ scale: 0.96, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command>
              <Command.Input placeholder="Search commands…" autoFocus />
              <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                {groups.map((group) => {
                  const groupItems = items.filter((i) => i.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <Command.Group key={group} heading={group}>
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={item.label}
                          onSelect={() => {
                            item.action();
                            onClose();
                          }}
                        >
                          <span className="palette-item-icon">{item.icon}</span>
                          <span className="palette-item-label">
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <span className="palette-item-shortcut">
                              {item.shortcut}
                            </span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
            <div className="palette-footer">
              <a
                href="https://gulbahar.tech/"
                target="_blank"
                rel="noopener noreferrer"
                className="palette-footer-ad"
              >
                visit gulbahar.tech
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
