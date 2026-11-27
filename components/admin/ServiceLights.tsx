import { LIGHT_TEXT, ServiceLight } from "@/lib/client-status";

/** One dot + label per service; hover shows the full state */
export default function ServiceLights({ lights, showState = false }: { lights: ServiceLight[]; showState?: boolean }) {
  const text = (l: ServiceLight) => `${LIGHT_TEXT[l.state]}${l.via ? ` via ${l.via}` : ""}`;
  return (
    <div className="lights">
      {lights.map((l) => (
        <span key={l.service} className="light" title={`${l.label}: ${text(l)}`}>
          <span className={`light-dot ${l.state}`} />
          {l.label}
          {showState ? (
            <span style={{ fontWeight: 500, color: "#8a97ab" }}>· {text(l)}</span>
          ) : (
            l.via && <span style={{ fontWeight: 500, color: "#8a97ab" }}>· via {l.via}</span>
          )}
        </span>
      ))}
    </div>
  );
}
