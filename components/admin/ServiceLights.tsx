import { LIGHT_TEXT, ServiceLight } from "@/lib/client-status";

/** One dot + label per service; hover shows the full state */
export default function ServiceLights({ lights, showState = false }: { lights: ServiceLight[]; showState?: boolean }) {
  return (
    <div className="lights">
      {lights.map((l) => (
        <span key={l.service} className="light" title={`${l.label}: ${LIGHT_TEXT[l.state]}`}>
          <span className={`light-dot ${l.state}`} />
          {l.label}
          {showState && <span style={{ fontWeight: 500, color: "#8a97ab" }}>· {LIGHT_TEXT[l.state]}</span>}
        </span>
      ))}
    </div>
  );
}
