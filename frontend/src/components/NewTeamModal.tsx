import {useEffect, useRef, useState} from "react";
import {api} from '../services/api';
import type {Department} from "../types";
import { Icon } from "./ui/Icons";

interface NewTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, departmentId: number) => void;
}

export function NewTeamModal({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                             }: NewTeamModalProps) {

    const nameElement = useRef<HTMLInputElement>(null);
    const departmentElement = useRef<HTMLSelectElement>(null);

    const [departments, setDepartments] = useState<Department[] | null>(null)

  useEffect(() => {
    api.getDepartments()
        .then(setDepartments)
        .catch(console.error);
  }, []);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (nameElement.current && departmentElement.current) {
            onConfirm(nameElement.current.value, parseInt(departmentElement.current.value));
        }
        onClose();
    };

    return (
        <div className="kn-modal-backdrop">
            <div className="kn-modal kn-fade-in">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--kn-line)] px-6 py-5">
                    <div>
                        <h3 className="text-xl font-black text-[var(--kn-ink)]">Create Team</h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--kn-muted)]">Add a team and connect it to a department.</p>
                    </div>
                    <button className="kn-icon-button h-9 w-9" onClick={onClose} aria-label="Close team dialog">
                        <Icon name="close" className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <div>
                        <label className="kn-label">
                            Name
                        </label>
                        <input
                            type="text"
                            ref={nameElement}
                            placeholder="Team Name"
                            className="kn-input"
                        />
                    </div>

                    <div>
                        <label className="kn-label">
                            Department
                        </label>
                        <select
                            ref={departmentElement}
                            className="kn-select"
                        >
                          {departments && departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
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
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
