// utils/angles.ts

// Normalize un angle entre 0-360°
export function normalizeAngle(angle: number) {
    return (angle + 360) % 360;
  }
  
  // Donne le secteur angulaire (pour jauge)
  export function sectorForAngle(angle: number, sectors: number) {
    const sectorSize = 360 / sectors;
    return Math.floor(normalizeAngle(angle) / sectorSize);
  }
  
  // Donne l’inclinaison à partir de l’accéléromètre
  export function getLeanAngle(acc: {x: number, y: number, z: number}) {
    // Hypothèse : téléphone monté dans l’axe de la moto
    // On prend l’arctan(y/z) pour obtenir l’angle d’inclinaison latérale
    return Math.atan2(acc.y, acc.z) * (180 / Math.PI);
  }
  