"use client";

import { useState } from "react";
import { TEAM_MEMBERS } from "@/lib/workspace";

export type TeamMember = (typeof TEAM_MEMBERS)[number];

const STORAGE_KEY = "scramble-admin-team-member";

function readSaved(): TeamMember | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return TEAM_MEMBERS.includes(v as TeamMember) ? (v as TeamMember) : null;
  } catch {
    return null;
  }
}

/**
 * Who is making a change. The admin login is shared, so the person is chosen
 * here and remembered on this browser. Only rendered client-side (inside
 * AdminShell), so reading localStorage during the first render is safe.
 */
export function useTeamMember() {
  const [member, setMemberState] = useState<TeamMember | null>(readSaved);
  const setMember = (m: TeamMember) => {
    setMemberState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // storage blocked; the choice still applies for this visit
    }
  };
  return { member, setMember };
}

export default function TeamMemberPicker({
  member,
  onChange,
}: {
  member: TeamMember | null;
  onChange: (m: TeamMember) => void;
}) {
  return (
    <div className="team-picker" role="radiogroup" aria-label="Who is this?">
      <span className="team-picker-label">You are</span>
      {TEAM_MEMBERS.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={member === m}
          className={`team-picker-btn ${member === m ? "on" : ""}`}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export const TEAM_PICKER_STYLES = `
  .team-picker { display: inline-flex; align-items: center; gap: 6px; }
  .team-picker-label { font-size: 13px; color: #8a97ab; margin-right: 2px; }
  .team-picker-btn {
    padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(122, 178, 255, 0.35); cursor: pointer;
    background: white; color: #4a5a72; font-family: inherit; font-size: 13px; font-weight: 600;
  }
  .team-picker-btn.on { background: #2d7fe0; border-color: #2d7fe0; color: white; }
`;
