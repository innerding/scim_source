import { describe, it, expect } from 'vitest';
import { graphCompose, deadEndNodes, classifyComponents } from './netGraph';
import type { PathEdge } from './pathEngine';

// Hilfs-Kantenbau: points als [lat,lng][].
function edge(id: number, pts: [number, number][], inNet = true): PathEdge {
  return { id, highway: 'path', source: 'primary', points: pts, tags: {}, inNet };
}

describe('graphCompose', () => {
  it('verschweißt gemeinsame Endpunkte zu einem Knoten', () => {
    // Zwei Kanten, die sich am Punkt B treffen: A–B und B–C.
    const A: [number, number] = [48.0000, 14.0000];
    const B: [number, number] = [48.0010, 14.0010];
    const C: [number, number] = [48.0020, 14.0000];
    const g = graphCompose([edge(1, [A, B]), edge(2, [B, C])]);
    expect(g.nodes.length).toBe(3);          // A, B, C
    expect(g.edges.length).toBe(2);
    expect(g.componentCount).toBe(1);         // verbunden
    const bNode = g.nodes.find((n) => n.degree === 2);
    expect(bNode).toBeDefined();              // B hat Grad 2 (Durchgang)
    expect(deadEndNodes(g).length).toBe(2);   // A und C sind degree-1 (Sackgassen)
  });

  it('zählt getrennte Komponenten', () => {
    // Zwei Kanten ohne gemeinsamen Knoten → zwei Komponenten.
    const g = graphCompose([
      edge(1, [[48.0, 14.0], [48.001, 14.001]]),
      edge(2, [[49.0, 15.0], [49.001, 15.001]]),
    ]);
    expect(g.componentCount).toBe(2);
    expect(g.nodes.length).toBe(4);
  });

  it('ignoriert Nicht-Netz-Kanten (inNet=false)', () => {
    const g = graphCompose([
      edge(1, [[48.0, 14.0], [48.001, 14.001]], true),
      edge(2, [[48.0, 14.0], [48.002, 14.002]], false), // nicht im Netz
    ]);
    expect(g.edges.length).toBe(1);
  });

  it('classifyComponents: lange Komponente = Netz, kurze = Rest', () => {
    // Komponente 1: lange Kette (~300 m). Komponente 2: winziges Stück (~15 m).
    const g = graphCompose([
      edge(1, [[48.0000, 14.0000], [48.0020, 14.0000]]), // ~222 m
      edge(2, [[48.0020, 14.0000], [48.0030, 14.0010]]), // weiterer Ast
      edge(9, [[49.0000, 15.0000], [49.00010, 15.0000]]), // ~11 m, getrennt
    ]);
    const info = classifyComponents(g, 100); // Schwelle 100 m
    expect(info.length).toBe(2);
    const netz = info.filter((c) => c.isNetz);
    const rest = info.filter((c) => !c.isNetz);
    expect(netz.length).toBe(1);   // die lange Kette
    expect(rest.length).toBe(1);   // das winzige Stück
    expect(netz[0].meters).toBeGreaterThan(rest[0].meters);
  });
});
