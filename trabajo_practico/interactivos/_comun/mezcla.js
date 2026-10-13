// Mezcla de sonido directo (seco) y reverberado (húmedo) con ley de igual potencia:
// al mover la mezcla el volumen percibido se mantiene.
export function gananciasMezcla(m) {
  const v = Math.min(1, Math.max(0, m));
  return { seco: Math.cos((v * Math.PI) / 2), humedo: Math.sin((v * Math.PI) / 2) };
}
