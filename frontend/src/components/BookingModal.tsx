import { Icon } from './ui/Icons';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deskLabel: string;
  selectedDate: string;
  startTime: string;
  endTime: string;
}

export function BookingModal({
  isOpen,
  onClose,
  onConfirm,
  deskLabel,
  selectedDate,
  startTime,
  endTime,
}: BookingModalProps) {

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="kn-modal-backdrop">
      <div className="kn-modal kn-fade-in">
        <div className="border-b border-[var(--kn-line)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[var(--kn-ink)]">Book Desk {deskLabel}</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Confirm the reservation window before booking.</p>
            </div>
            <button className="kn-icon-button h-9 w-9" onClick={onClose} aria-label="Close booking dialog">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="kn-label">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              readOnly
              className="kn-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="kn-label">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                readOnly
                className="kn-input"
              />
            </div>
            <div>
              <label className="kn-label">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                readOnly
                className="kn-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={onClose}
              className="kn-button kn-button-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="kn-button kn-button-primary"
            >
              <Icon name="check" />
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
