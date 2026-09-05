/**
 * Brand signature line: every number, answer, and publication carries its
 * provenance (source · version/status · effective date). Distinctive by
 * behavior, not decoration.
 */
export function SourceLine({
  source,
  version,
  effective,
}: Readonly<{ source: string; version?: string; effective?: string | null }>) {
  return (
    <p className="media-note" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      <span>منبع: {source}</span>
      {version && (
        <>
          <span aria-hidden="true">·</span>
          <span>{version}</span>
        </>
      )}
      {effective && (
        <>
          <span aria-hidden="true">·</span>
          <span>مؤثر از {effective}</span>
        </>
      )}
    </p>
  );
}
