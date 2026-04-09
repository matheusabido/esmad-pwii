export function getPolygonCoordinatesByWKT(wkt: string): number[][] {
  const error = validatePolygonPoints(wkt);
  if (error) {
    throw new Error(error);
  }

  const points = wkt.split("((")[1]!.split("))")[0]!.split(",");
  return points.map((point) => {
    const [x, y] = point
      .trim()
      .split(" ")
      .map((p) => Number(p.trim()));
    return [x, y] as number[];
  });
}

export function validatePolygonPoints(wkt: string): string | undefined {
  const points = wkt.split("((")[1]?.split("))")[0]?.split(",");
  if (!points || points.length < 2) {
    return "Área deve conter pontos válidos.";
  }

  const [x1, y1] = points[0]!
    .trim()
    .split(" ")
    .map((p) => Number(p.trim())) as [number, number];
  const [x2, y2] = points[points.length - 1]!.trim()
    .split(" ")
    .map((p) => Number(p.trim())) as [number, number];

  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    return "Área deve conter coordenadas numéricas válidas.";
  }

  if (x1 !== x2 || y1 !== y2) {
    return "Área deve ser um polígono fechado.";
  }
}
